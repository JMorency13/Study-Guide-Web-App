// utils.js
const { OpenAI } = require('openai');

// Set up OpenAI (ensure your API key is in a .env file)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper function to process text and generate a study guide
async function generateStudyGuide(text) {
  try {
    console.log('Generating study guide with text:', text);  // Debug log to check the input
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // or the model you're using
      messages: [
        { role: 'user', content: `Create a simple and organized study guide for the following content:\n\n${text}` }
      ],
      max_tokens: 500,
    });

    console.log('OpenAI response:', response);  // Log OpenAI response
    return response.choices[0].message.content.trim() || 'No study guide generated.';
  } catch (error) {
    console.error('Error generating study guide:', error);  // Log error details
    throw new Error('Error generating study guide: ' + error.message);
  }
}

module.exports = { generateStudyGuide };