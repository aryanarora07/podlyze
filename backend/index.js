const express = require('express');
const cors = require('cors');

const OpenAI = require('openai');

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { PassThrough } = require('stream');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Downloader, } = require('ytdl-mp3');

const { RealtimeSession } =  require('speechmatics');

const session = new RealtimeSession(process.env.SM_KEY);

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let currentProgress = 0;

// Add this new endpoint for progress updates
app.get('/progress', (req, res) => {
  res.json({ progress: currentProgress });
});

app.post('/summarize', async (req, res) => {
  try {
    const { url } = req.body;
    currentProgress = 0;

    // Step 1: Download MP3 using CustomDownloader
    currentProgress = 20;

    // Define the correct backend directory path
    const backendDir = path.resolve(__dirname); // This resolves to the current directory
    const downloader = new Downloader({
      getTags: false, // Set this to false to skip iTunes API query
      outputDir: backendDir,
    });

    let outputFile;
    try {
      currentProgress = 40;
      outputFile = await downloader.downloadSong(url);
      console.log(`Audio downloaded successfully: ${outputFile}`);
      currentProgress = 60;
    } catch (error) {
      console.error('Error downloading audio:', error);
      throw new Error('Failed to download audio: ' + error.message);
    }

    // Step 2: Transcribe using OpenAI's Whisper
    currentProgress = 80;
    // const transcription = await openai.audio.transcriptions.create({
    //   file: fs.createReadStream(outputFile),
    //   model: 'whisper-1',
    // });

    let transcription = '';

    session.addListener('RecognitionStarted', () => {
      console.log('RecognitionStarted');
    });
    
    session.addListener('Error', (error) => {
      console.log('session error', error);
    });
    
    session.addListener('AddTranscript', (message) => {
      transcription += message.metadata.transcript + ' ';
      console.log('AddTranscript:', message.metadata.transcript);
    });
    
    session.addListener('AddPartialTranscript', (message) => {
      console.log('AddPartialTranscript', message);
    });
    
    session.addListener('EndOfTranscript', () => {
      console.log('EndOfTranscript');
      console.log(transcription);
    });

    // Wrap the session in a Promise
    const transcriptionPromise = new Promise((resolve, reject) => {
      session.start().then(() => {
        const fileStream = fs.createReadStream(outputFile);
        
        fileStream.on('data', (sample) => {
          console.log('sending audio', sample.length);
          session.sendAudio(sample);
        });
        
        fileStream.on('end', () => {
          session.stop();
        });
      });

      session.addListener('EndOfTranscript', () => {
        resolve(transcription);
      });

      session.addListener('Error', (error) => {
        reject(error);
      });
    });

    // Wait for transcription to complete
    transcription = await transcriptionPromise;

    // Clean up the temporary file
    fs.unlinkSync(outputFile);

    // Step 3: Generate a summary using GPT-4
    const summary = await generateSummary(transcription);
    currentProgress = 100;

    // Send the summary back to the client
    res.json({ summary, title: 'Video Summary' });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred during the summarization process: ' + error.message });
  } finally {
    currentProgress = 0;
  }
});

async function generateSummary(transcription) {
  const summaryPrompt = "You are a video summarizer. Given the following transcript of a video, provide a long form summary of the text.";
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.5,
    messages: [
      {
        role: "system",
        content: summaryPrompt
      },
      {
        role: "user",
        content: transcription
      }
    ]
  });
  return completion.choices[0].message.content;
}

// Signup route
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Generate JWT token
    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ token, userId: newUser.id });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'An error occurred during signup' });
  }
});

// Login route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token, userId: user.id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

app.post('/chat', async (req, res) => {
  try {
    const { message, summary } = req.body;

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = new PassThrough();
    res.write('data: {"start":true}\n\n');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant that can answer questions about a podcast summary. Here's the summary:" + summary },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: {"done":true}\n\n');
    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'An error occurred during the chat process.' });
  }
});

app.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text to ${targetLanguage}. Maintain the original meaning and tone as closely as possible.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.5,
    });

    const translation = completion.choices[0].message.content;

    res.json({ translation });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'An error occurred during translation.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
