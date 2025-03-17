const { OpenAI } = require("openai");  // Use the updated OpenAI library
const marked = require("marked"); // Add the marked library
const { formatStudyGuide } = require("./format");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateStudyGuide(inputText) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Use the appropriate model
      messages: [{ role: "user", content: `Generate a study guide from the following text:\n\n${inputText}` }],
    });

    const rawText = response.choices[0].message.content.trim();
    const formattedText = formatStudyGuide(rawText); // Format the raw study guide
    const htmlContent = marked(formattedText); // Convert Markdown to HTML
    return htmlContent;
  } catch (error) {
    console.error("Error generating study guide:", error);
    throw error;
  }
}

module.exports = { generateStudyGuide };
