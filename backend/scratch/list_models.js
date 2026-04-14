import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const list = await ai.models.list();
    console.log("--- Available Models ---");
    list.models.forEach(m => console.log(m.name));
  } catch (err) {
    console.error("Error listing models:", err.message);
  }
}

listModels();
