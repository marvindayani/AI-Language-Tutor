import { safeGenerateContent } from '../services/ai.service.js';
import dotenv from 'dotenv';
dotenv.config();

async function testPrimary() {
    console.log("🛠️ Testing Primary AI Model (Gemini)...");

    const testPrompt = [{ role: 'user', parts: [{ text: "Respond with only one word: 'Ready'" }] }];
    const config = { temperature: 0.1 };

    try {
        const response = await safeGenerateContent("gemini-1.5-flash", testPrompt, config);
        console.log("✅ Primary (Gemini) Result:", response.text);
    } catch (err) {
        console.error("❌ Primary Model failed:", err.message);
    }
}

testPrimary();
