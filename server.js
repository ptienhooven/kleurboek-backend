// Backend server voor kleurboek generator met OpenAI
// Installeer eerst: npm install express cors openai dotenv

const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
// Middleware - Allow all origins for testing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '50mb' }));

// OpenAI configuratie
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Bewaar dit in .env bestand!
});

// Endpoint voor het converteren van foto's naar kleurplaten
app.post('/api/generate-coloring-page', async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Geen afbeelding ontvangen' });
    }

    // Verwijder data:image/... prefix als die er is
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // Roep OpenAI DALL-E aan om een kleurplaat te maken
    const response = await openai.images.edit({
      image: Buffer.from(base64Data, 'base64'),
      prompt: "Convert this image into a simple black and white coloring book page with clear outlines, no shading, suitable for children to color in. White background with black lines only.",
      n: 1,
      size: "1024x1024"
    });

    const generatedImage = response.data[0].url;

    res.json({
      success: true,
      imageUrl: generatedImage
    });

  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({
      error: 'Fout bij het genereren van kleurplaat',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is actief!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server draait op http://localhost:${PORT}`);
  console.log('⚠️  Vergeet niet je OPENAI_API_KEY toe te voegen aan .env bestand!');
});
