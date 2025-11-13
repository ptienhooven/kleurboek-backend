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
  apiKey: process.env.OPENAI_API_KEY
});

// Endpoint voor het converteren van foto's naar kleurplaten
app.post('/api/generate-coloring-page', async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Geen afbeelding ontvangen' });
    }

    console.log('Received image, analyzing with GPT-4 Vision...');

    // Stap 1: Gebruik GPT-4 Vision om de afbeelding te analyseren
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this image in simple terms, focusing on the main subject and key visual elements. Keep it brief (1-2 sentences) and child-friendly."
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64
              }
            }
          ]
        }
      ],
      max_tokens: 100
    });

    const imageDescription = visionResponse.choices[0].message.content;
    console.log('Image description:', imageDescription);

    // Stap 2: Gebruik DALL-E 3 om een kleurplaat te genereren
    console.log('Generating coloring page with DALL-E 3...');
    const dalleResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Create a simple black and white coloring book page based on this description: ${imageDescription}. The design should have clear, bold black outlines on a white background with no shading or gradients. Make it suitable for children to color, with distinct shapes and simple details.`,
      n: 1,
      size: "1024x1024",
      quality: "standard"
    });

    const generatedImage = dalleResponse.data[0].url;
    console.log('Successfully generated coloring page!');

    res.json({
      success: true,
      imageUrl: generatedImage,
      description: imageDescription
    });

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Geef meer details over de error
    const errorDetails = {
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param
    };
    
    res.status(500).json({
      error: 'Fout bij het genereren van kleurplaat',
      details: errorDetails
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
