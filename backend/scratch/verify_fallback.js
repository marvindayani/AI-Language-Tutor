import { safeGenerateContent } from '../services/ai.service.js';
import dotenv from 'dotenv';
dotenv.config();

async function testFallback() {
    console.log("🛠️ Testing AI Fallback Chain Logic...");

    const testPrompt = [{ role: 'user', parts: [{ text: "Respond with only one word: 'Success'" }] }];
    const config = { temperature: 0.1 };

    console.log("\n--- Test 1: Forcing fallback by using a likely invalid model name ---");
    try {
        // 'gemini-non-existent' will not be found in chain, findIndex returns -1, startIndex becomes 0.
        // It will try gemini-2.5-flash (which fails) then fallback to groq/mistral.
        const response = await safeGenerateContent("gemini-non-existent", testPrompt, config);
        console.log("✅ Final Result:", response.text);
    } catch (err) {
        console.error("❌ Fallback Chain failed completely:", err.message);
    }

    console.log("\n--- Test 2: Simulating API key failure for Groq (if key removed) ---");
    // This is harder without modifying the file.
}

testFallback();
