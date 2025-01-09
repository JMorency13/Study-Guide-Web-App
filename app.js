require('dotenv').config(); // Load .env variables

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var multer = require('multer');
var pdfParse = require('pdf-parse');
var fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');
const { OpenAI } = require('openai');

// Import the generateStudyGuide function from utils.js
const { generateStudyGuide } = require('./utils/utils');
var app = express();

// Routers
var usersRouter = require('./routes/users');
var uploadRouter = require('./routes/upload');

// Middleware for serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Route for serving Frontend.html
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'public/javascripts/Frontend.html');
  res.sendFile(filePath); // Serve the file
});


// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage: storage });

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

// Routes
app.use('/users', usersRouter);
app.use('/upload', uploadRouter); // Custom upload routes

// Text upload route
app.post('/upload-text', async (req, res) => {
  try {
    const { textContent } = req.body;
    if (!textContent) {
      return res.status(400).json({ error: 'No text content provided' });
    }
    const studyGuide = await generateStudyGuide(textContent);
    res.json({ studyGuide });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PDF upload route
app.post('/upload-pdf', upload.single('file'), async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'uploads', req.file.filename);
    const data = await pdfParse(fs.readFileSync(filePath));
    const studyGuide = await generateStudyGuide(data.text);
    res.json({ studyGuide });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Video upload route
app.post('/upload-video', upload.single('file'), (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.file.filename);
  ffmpeg(filePath)
    .on('end', async () => {
      try {
        const studyGuide = await generateStudyGuide('Video summary...');
        res.json({ studyGuide });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    })
    .on('error', (err) => res.status(500).json({ error: err.message }))
    .run();
});


// Error handling for 404
app.use((req, res, next) => next(createError(404)));

// General error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
