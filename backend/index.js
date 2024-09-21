const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const { Configuration, OpenAIApi } = require('openai');
const ytdl = require('ytdl-core');
const { Readable } = require('stream');
const speech = require('@google-cloud/speech');
const { PrismaClient } = require('@prisma/client');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize YouTube API client
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

// Initialize OpenAI API client
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// Initialize Google Speech-to-Text client
const speechClient = new speech.SpeechClient();

// Initialize Prisma client
const prisma = new PrismaClient();

// Endpoint to summarize podcast
app.post('/summarize', async (req, res) => {
  try {
    const { url } = req.body;

    // 1. Extract video ID from URL
    const videoId = ytdl.getVideoID(url);

    // 2. Get video details from YouTube API
    const videoDetails = await youtube.videos.list({
      part: 'snippet',
      id: videoId,
    });
    const videoTitle = videoDetails.data.items[0].snippet.title;

    // 3. Get audio stream from YouTube video
    const audioStream = ytdl(url, { quality: 'highestaudio' });

    // 4. Convert audio stream to buffer
    const audioBuffer = await streamToBuffer(audioStream);

    // 5. Convert audio to text using Google Speech-to-Text
    const transcription = await transcribeAudio(audioBuffer);

    // 6. Generate summary using OpenAI GPT-4
    const summary = await generateSummary(transcription);

    // 7. Store podcast details using Prisma
    const dbResponse = await prisma.podcast.create({
      data: {
        youtubeUrl: url,
        title: videoTitle,
        transcription: transcription,
        summary: summary,
      },
    });

    // 8. Send response back to the client
    res.json({
      title: videoTitle,
      summary: summary.trim(),
      transcription: transcription,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing the request' });
  }
});

// Function to convert stream to buffer
async function streamToBuffer(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

// Function to transcribe audio using Google Speech-to-Text
async function transcribeAudio(audioBuffer) {
  const [response] = await speechClient.recognize({
    audio: { content: audioBuffer.toString('base64') },
    config: {
      encoding: 'MP3', // Modify depending on your audio format
      sampleRateHertz: 16000,
      languageCode: 'en-US',
    },
  });

  return response.results.map(result => result.alternatives[0].transcript).join('\n');
}

// Function to generate summary using OpenAI
async function generateSummary(text) {
  const response = await openai.createCompletion({
    model: 'gpt-4',
    prompt: `Summarize the following podcast transcript:\n\n${text}\n\nSummary:`,
    max_tokens: 300, // Adjust depending on summary length preference
    temperature: 0.5, // Controls creativity (0.0 = conservative, 1.0 = creative)
  });

  return response.data.choices[0].text;
}

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
