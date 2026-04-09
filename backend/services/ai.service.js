import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getSystemPrompt = (language, level, scenario) => {
  const persona = scenario
    ? `You are a native speaker of ${language}. You are engaging the user in a realistic roleplay scenario: "${scenario}". Your job is to act naturally according to the context of this scenario (e.g., barista, interviewer, fellow traveler). Do not break character unless absolutely necessary.`
    : `You are an AI Language Tutor designed to help users learn a new language through real conversation.`;
  return `${persona}
Context:
- Target Language: ${language}
- User Level: ${level}
${scenario ? `- Current Roleplay Scenario: ${scenario}` : ""}

Your Responsibilities:
1. Conversation: Talk naturally with the user in the target language. Keep the conversation engaging and realistic. Ask follow-up questions to continue the conversation.
2. Adapt to Level: Beginner -> simple words, short sentences. Intermediate -> moderate vocabulary and grammar. Advanced -> natural, fluent, native-level.
3. Error Correction (VERY IMPORTANT): When the user makes a mistake: Identify grammar, tense, or vocabulary mistakes clearly. 
4. Vocabulary Support (STRICT REQUIREMENT): Always identify 1-3 key vocabulary words or phrases from the current exchange (even if the user made no mistakes). These should be words the user just used correctly, or words the tutor introduced that are level-appropriate.
5. Positive Feedback: If the user writes correctly, give short encouragement.
6. Keep It Balanced: Do NOT over-correct small mistakes. Focus on learning + conversation balance. Keep responses concise.

Output Format Requirements:
You MUST respond IN STRICT JSON FORMAT. Do not include markdown codeblocks, just the raw JSON object string.
The JSON object MUST have the following structure:
{
  "reply": "Your natural conversational reply in the target language",
  "corrections": [
    {
      "incorrect": "The specific incorrect word or phrase the user used",
      "correct": "The corrected version",
      "explanation": "A simple explanation in English of why it was wrong",
      "grammarRule": "The fundamental grammar rule the user should learn to prevent this mistake in the future"
    }
  ],
  "newVocabulary": ["word1", "word2"]
}
If no corrections are needed, pass an empty array for "corrections". ALWAYS provide at least one word in "newVocabulary" from the user's latest sentence or your response.
`;
};

export const generateTutorResponse = async (
  language,
  level,
  chatHistory,
  userMessage,
  scenario = null,
) => {
  const systemInstruction = getSystemPrompt(language, level, scenario);

  const contents = [
    ...chatHistory,
    { role: "user", parts: [{ text: userMessage }] },
  ];
  // console.log(userMessage);
  // console.log("chatHistory:", chatHistory);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    });

    let text = response.text;

    // console.log("RAW AI RESPONSE:", text);

    // ✅ FIX 1: Handle empty response
    if (!text) {
      throw new Error("Empty AI response");
    }

    // ✅ FIX 2: Clean markdown if exists
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // ✅ FIX 3: Safe JSON parse
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      console.error("❌ JSON PARSE ERROR:", parseError);

      // ✅ fallback response (VERY IMPORTANT)
      return {
        reply: "Sorry, I couldn't understand properly. Can you try again?",
        corrections: [],
        newVocabulary: [],
      };
    }

    // ✅ FIX 4: Ensure required fields exist
    return {
      reply: parsed.reply || "No response generated.",
      corrections: parsed.corrections || [],
      newVocabulary: parsed.newVocabulary || [],
    };
  } catch (error) {
    console.error("❌ AI Generation Error:", error);

    // ✅ FINAL fallback (prevents crash)
    return {
      reply: "⚠️ AI is currently unavailable. Please try again later.",
      corrections: [],
      newVocabulary: [],
    };
  }
};
export const generateSessionSummary = async (language, level, chatHistory) => {
  const prompt = `As a language tutor, review this conversation history between a user learning ${language} at ${level} level and the tutor.
    Perform a deep scan of the conversation to generate a session summary IN STRICT JSON FORMAT.
    Instructions:
    1. Mistakes: Identify the most important grammatical, vocabulary, or punctuation errors made by the user.
    2. Vocabulary (EXTREMELY IMPORTANT): List the 5-10 most valuable vocabulary words, verbs, or natural idioms encountered during the session (both those used by the student correctly and those used by the tutor).
    3. Tips: Provide 1-3 targeted tips for the user's current level.
    4. Feedback: Write a short, encouraging summary in English.

    Format:
    {
      "mistakes": ["List of key mistakes"],
      "vocabulary": ["List of unique vocabulary words/phrases"],
      "tips": ["Targeted tips"],
      "overallFeedback": "Feedback paragraph"
    }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: JSON.stringify(chatHistory) }] },
        { role: "user", parts: [{ text: prompt }] },
      ],
      config: {
        temperature: 0.4,
        responseMimeType: "application/json",
      },
    });

    let text = response.text;
    if (!text) throw new Error("Empty AI response");
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(text);
  } catch (error) {
    console.error("Summary Generation Error:", error);
    // ✅ Fallback summary if AI fails (e.g., quota exceeded), so user can still end session!
    return {
      mistakes: ["Could not generate details due to AI limit"],
      vocabulary: ["Could not generate details due to AI limit"],
      tips: ["Keep practicing!"],
      overallFeedback:
        "Great job practicing! Unfortunately, the AI is unavailable right now to provide a detailed summary.",
    };
  }
};

export const generateGrammarQuiz = async (language, level) => {
  const prompt = `You are an expert language teacher. Generate a language grammar quiz for a student learning ${language} at the ${level} level.
    The quiz must consist of exactly 10 multiple choice questions testing grammar, vocabulary, or sentence structure.
    You MUST respond IN STRICT JSON FORMAT.
    Format:
    [
      {
        "question": "The question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswerIndex": 0,
        "explanation": "Why this answer is correct",
        "grammarRule": "The underlying grammar rule"
      }
    ]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Quiz Generation Error:", error);
    throw error;
  }
};
export const generateCEFRAssessment = async (language, currentLevel, sessionsData, quizzesData) => {
  const prompt = `You are a professional language proficiency examiner. Analyze the following data from a user learning ${language}. 
    The user's current self-reported level is ${currentLevel}.
    
    1. Conversational Data (from the last 5 text/voice/immersive roleplay sessions):
    ${JSON.stringify(sessionsData)}

    2. Testing Data (from recent formal grammar quizzes):
    ${JSON.stringify(quizzesData)}

    Your task:
    - Evaluate overall communicative competence (fluency, range, accuracy).
    - Determine the user's objective CEFR level (A1, A2, B1, B2, C1, C2).
    - Contrast their natural conversational performance with their formal test scores.
    - Provide a detailed pedagogical report in English with 3 strengths, 3 weaknesses, and 3 next steps.

    You MUST respond IN STRICT JSON FORMAT.
    Format:
    {
      "cefrLevel": "B1",
      "report": "Detailed assessment text...",
      "strengths": ["Strength 1", "Strength 2", "Strength 3"],
      "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
      "nextSteps": ["Step 1", "Step 2", "Step 3"]
    }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.5,
        responseMimeType: "application/json",
      },
    });

    let text = response.text;
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Assessment Generation Error:", error);
    throw error;
  }
};
