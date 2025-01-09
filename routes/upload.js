const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

// Import the generateStudyGuide function from utils.js
const { generateStudyGuide } = require('../utils/utils');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure 'uploads/' exists
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// Set up OpenAI (ensure your API key is in a .env file)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


// Route for handling text input
router.post('/upload-text', async (req, res) => {
  const { textContent } = req.body;

  if (!textContent) {
    return res.status(400).json({ error: 'No text content provided.' });
  }

  try {
    const studyGuide = await generateStudyGuide(textContent);
    res.json({ studyGuide });
  } catch (error) {
    res.status(500).json({ error: 'Error processing text input.' });
  }
});

// Route for handling PDF uploads
router.post('/upload-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);

  try {
    const pdfData = fs.readFileSync(filePath);
    const pdfText = await pdfParse(pdfData);
    const studyGuide = await generateStudyGuide(pdfText.text);
    res.json({ studyGuide });
  } catch (error) {
    console.error('Error processing PDF file:', error.message);
    res.status(500).json({ error: 'Error processing PDF file.' });
  } finally {
    // Optional: Clean up the uploaded file after processing
    fs.unlinkSync(filePath);
  }
});

module.exports = router;
