import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); // Try with object config

async function testDirect() {
  try {
    console.log("Testing ai.generateContent...");
    const result = await ai.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'Hi' }] }]
    });
    console.log("Success:", result.text);
  } catch (err) {
    console.log("Direct failed:", err.message);
    try {
        console.log("Testing ai.models.generateContent...");
        const result = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: [{ role: 'user', parts: [{ text: 'Hi' }] }]
        });
        console.log("Success (models):", result.text);
    } catch (err2) {
        console.log("Models failed:", err2.message);
    }
  }
}

testDirect();
