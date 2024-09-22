const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const OpenAI = require('openai');
const ytdl = require('ytdl-core');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const axios = require('axios');
const http = require('http');
const request = require('request');
const { pipeline } = require('stream');
const util = require('util');
const pipelineAsync = util.promisify(pipeline);
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3001;

// Load environment variables


// Middleware
app.use(cors());
app.use(express.json());

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


app.post('/summarize', async (req, res) => {
  try {
    const { url } = req.body;


    
    // Step 1: Get MP3 URL from RapidAPI
    const options = {
      method: 'POST',
      url: 'https://youtube-to-mp315.p.rapidapi.com/download',
      params: {
        url: url,
        format: 'mp3',
        quality: '5'
      },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'youtube-to-mp315.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      data: {}
    };


    let mp3Url;
    let title;
    try {
      
      const rapidApiResponse = await axios.request(options);      
      mp3Url = rapidApiResponse.data.downloadUrl;
      title = rapidApiResponse.data.title;
      console.log("I'm downloading from", mp3Url);
      
    } catch (error) {
      console.error('RapidAPI Error:', error);
      throw new Error('Failed to get MP3 URL from RapidAPI');
    }

    // setTimeout(() => {
    //   console.log("I'm downloading from", mp3Url);
    // }, 15000);
    // Step 2: Download the MP3 file
    const tempFilePath = './temp1_audio.mp3';

    console.log("Attempting to download from:", mp3Url);

    // setTimeout(() => {
    //   console.log("loading");
    // }, 15000);
    // Function to download the MP3 file
    const downloadMP3 = async () => {
      try {
        const response = await axios({
          method: 'GET',
          url: mp3Url,
          responseType: 'stream',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' // truncated for brevity
          }
        });


        // Use pipeline to handle the stream properly
        await pipelineAsync(response.data, fs.createWriteStream(tempFilePath));

        console.log('MP3 file downloaded successfully');
      } catch (error) {
        console.error('Download failed:', error.message);
        throw error;
      }
    };

    // Retry logic
    const maxRetries = 6;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        await downloadMP3();
        break; // Exit the loop if successful
      } catch (error) {
        retries++;
        console.error(`Download attempt ${retries} failed:`, error.message);
        if (retries >= maxRetries) {
          throw new Error(`Failed to download after ${maxRetries} attempts`);
        }
        // Wait before next retry
        await new Promise(resolve => setTimeout(resolve, 20000));
      }
    }

    // Step 3: Transcribe using OpenAI's Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: 'whisper-1',
    });

    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);

    // Step 4: Correct the transcription using GPT-4
    // const correctedTranscript = await generateCorrectedTranscript(0, systemPrompt, transcription.text);

    // Step 5: Generate a summary using GPT-4
    const summary = await generateSummary(transcription.text);

    // Send the summary back to the client
    res.json({ summary, title });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred during the summarization process.' });
  }
});



// New function to generate summary
async function generateSummary(correctedTranscript) {
  const summaryPrompt = "You are a video summarizer. Given the following transcript of a video, provide a concise summary of the main points and key information. Also expand a little bit on the summary:";
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.5,
    messages: [
      {
        role: "system",
        content: summaryPrompt
      },
      {
        role: "user",
        content: correctedTranscript
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
