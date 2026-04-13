import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { fetchGroq, fetchMistral, fetchCerebras, fetchCohere } from "./aiProviders.js";

dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Universal helper to call AI models with automatic retries and multi-provider fallback waterfall.
 */
const fallbackChain = [
  { provider: "gemini", model: "gemini-2.5-flash" },
  { provider: "groq", model: "llama-3.3-70b-versatile" },
  { provider: "mistral", model: "mistral-large-latest" },
  { provider: "cerebras", model: "llama3.1-70b" },
  { provider: "cohere", model: "command-r-plus" },
  // Last resort
  { provider: "gemini", model: "gemini-2.0-flash" }
];

const callProvider = async (providerInfo, contents, config) => {
  const { provider, model } = providerInfo;
  switch (provider) {
    case "gemini":
      const genModel = ai.getGenerativeModel({ model });
      const result = await genModel.generateContent({
        contents,
        generationConfig: config
      });
      return { text: result.response.text() };
    case "groq":
      if (!process.env.GROQ_API_KEY) throw new Error("not configured");
      return await fetchGroq(model, contents, config);
    case "mistral":
      if (!process.env.MISTRAL_API_KEY) throw new Error("not configured");
      return await fetchMistral(model, contents, config);
    case "cerebras":
      if (!process.env.CEREBRAS_API_KEY) throw new Error("not configured");
      return await fetchCerebras(model, contents, config);
    case "cohere":
      if (!process.env.COHERE_API_KEY) throw new Error("not configured");
      return await fetchCohere(model, contents, config);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
};

const safeGenerateContent = async (modelName, contents, config, retries = 2) => {
  let lastError;

  // Find the starting point in the chain based on the requested model
  const startIndex = Math.max(0, fallbackChain.findIndex(c => c.model === modelName));
  const chainToTry = fallbackChain.slice(startIndex);

  for (const providerInfo of chainToTry) {
    // Only retry transient errors heavily for the primary provider
    const providerRetries = providerInfo.provider === "gemini" ? retries : 1;

    for (let i = 0; i < providerRetries; i++) {
      try {
        return await callProvider(providerInfo, contents, config);
      } catch (error) {
        lastError = error;

        if (error.message.includes("not configured") || (error.status && error.status === 401)) {
          console.warn(`⏭️ Skipping ${providerInfo.provider} (${providerInfo.model}): API Key missing or invalid.`);
          break; // Move to next provider
        }

        const status = error.status || (error.error && error.error.code);

        // Retry on transient errors for the current provider
        if (status === 503 || status === 429) {
          const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
          console.warn(`⚠️ ${providerInfo.provider} busy (${status}). Retrying in ${Math.round(delay / 1000)}s...`);
          await sleep(delay);
          continue;
        }

        // For other errors, fallback to the next provider immediately
        console.warn(`🔄 ${providerInfo.provider} failed (${status || error.message}). Falling back to next...`);
        break;
      }
    }
  }

  throw lastError; // Only runs if every provider in the entire chain fails
};

const getSystemPrompt = (language, level, scenario, focusRule = null) => {
  let persona = "";
  if (focusRule) {
    persona = `You are an expert Language Coach specializing in ${language}. Your single priority for this session is to help the user master the following grammar rule: "${focusRule}". You should act as an encouraging but meticulous coach.`;
  } else if (scenario) {
    persona = `You are a native speaker of ${language}. You are engaging the user in a realistic roleplay scenario: "${scenario}". Your job is to act naturally according to the context of this scenario (e.g., barista, interviewer, fellow traveler). Do not break character unless absolutely necessary.`;
  } else {
    persona = `You are an AI Language Tutor designed to help users learn a new language through real conversation.`;
  }

  return `${persona}
Context:
- Target Language: ${language}
- User Level: ${level}
${scenario ? `- Current Roleplay Scenario: ${scenario}` : ""}
${focusRule ? `- CORE FOCUS RULE: "${focusRule}". Your primary goal is to guide the user to use this rule correctly in conversation.` : ""}

Your Responsibilities:
1. Conversation: Talk naturally with the user in the target language. Keep the conversation engaging and realistic. ${focusRule ? `Try to steer the conversation into scenarios where the user MUST use the rule "${focusRule}".` : "Ask follow-up questions to continue the conversation."}
2. Adapt to Level: Beginner -> simple words, short sentences. Intermediate -> moderate vocabulary and grammar. Advanced -> natural, fluent, native-level.
3. Error Correction (VERY IMPORTANT): When the user makes a mistake: Identify grammar, tense, or vocabulary mistakes clearly. ${focusRule ? `Pay EXTREME attention to the rule "${focusRule}". If they miss it, prioritize correcting it.` : ""}
4. Vocabulary Support (STRICT REQUIREMENT): Always identify 1-3 key vocabulary words or phrases from the current exchange (even if the user made no mistakes). These should be words the user just used correctly, or words the tutor introduced that are level-appropriate.
5. Positive Feedback: If the user writes correctly, give short encouragement. ${focusRule ? `If they use the rule "${focusRule}" correctly, give them extra praise!` : ""}
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
  focusRule = null
) => {
  const systemInstruction = getSystemPrompt(language, level, scenario, focusRule);

  const contents = [
    ...chatHistory,
    { role: "user", parts: [{ text: userMessage }] },
  ];
  // console.log(userMessage);
  // console.log("chatHistory:", chatHistory);

  try {
    const response = await safeGenerateContent("gemini-2.5-flash", contents, {
      systemInstruction,
      temperature: 0.7,
      responseMimeType: "application/json",
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
    const response = await safeGenerateContent("gemini-2.5-flash", [
      { role: "user", parts: [{ text: JSON.stringify(chatHistory) }] },
      { role: "user", parts: [{ text: prompt }] },
    ], {
      temperature: 0.4,
      responseMimeType: "application/json",
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

export const generateGrammarQuiz = async (language, level, focusRule = null, previousMistakes = []) => {
  const basePrompt = `You are an expert language teacher. Generate a language grammar quiz for a student learning ${language} at the ${level} level.`;

  let specificInstructions = "";
  if (previousMistakes && previousMistakes.length > 0) {
    specificInstructions = `CRITICAL: The user previously took a quiz on this level/language and made the following mistakes: 
    ${previousMistakes.map(m => `- Failed Question: "${m.question}" (Rule: ${m.grammarRule})`).join('\n')}
    
    IMPORTANT: You MUST generate a quiz that specifically targets these weaknesses. Focus on the nuances of these grammar rules where the user previously failed. Ensure the questions are fresh but address the same pitfalls.`;
  } else if (focusRule) {
    specificInstructions = `IMPORTANT: All 5 questions MUST specifically test the user's understanding of this specific grammar rule: "${focusRule}".`;
  } else {
    specificInstructions = `The quiz must consist of exactly 5 multiple choice questions testing general grammar, vocabulary, or sentence structure.`;
  }

  const prompt = `${basePrompt}
    ${specificInstructions}
    You MUST respond IN STRICT JSON FORMAT.
    Format:
    {
      "questions": [
        {
          "question": "The question text IN THE TARGET LANGUAGE (e.g. Hindi/Spanish script)",
          "options": ["Option A", "Option B", "Option C", "Option D"], // ALL IN TARGET LANGUAGE
          "correctAnswerIndex": 0,
          "explanation": "Why this answer is correct (IN THE TARGET LANGUAGE)",
          "grammarRule": "The underlying grammar rule (IN THE TARGET LANGUAGE)"
        }
      ]
    }`;

  try {
    const response = await safeGenerateContent("gemini-2.5-flash", [
      { role: "user", parts: [{ text: prompt }] }
    ], {
      temperature: 0.7,
      responseMimeType: "application/json",
    });

    let text = response.text;
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);
    return parsed.questions || parsed;
  } catch (error) {
    console.error("Quiz Generation Error:", error);
    throw error;
  }
};

export const generateGrammarLesson = async (language, level, rule) => {
  const prompt = `Act as an expert language tutor. Create a concise, highly effective micro-lesson explaining the grammar rule: "${rule}" for a ${level} student learning ${language}.
  The lesson should be easy to understand, provide 2-3 clear examples with translations, and include a quick "Tip".
  
  You MUST respond IN STRICT JSON FORMAT.
  Format:
  {
    "title": "Friendly title for the lesson (IN THE TARGET LANGUAGE)",
    "explanation": "Clear, concise explanation of the rule (IN THE TARGET LANGUAGE)",
    "examples": [
      {
        "target": "Example in the target language (Use native script like Hindi/Japanese if applicable)",
        "english": "English translation"
      }
    ],
    "tip": "A helpful mnemonic, rule of thumb, or common mistake to avoid. (IN THE TARGET LANGUAGE)"
  }`;

  try {
    const response = await safeGenerateContent("gemini-2.5-flash", [
      { role: "user", parts: [{ text: prompt }] }
    ], {
      temperature: 0.7,
      responseMimeType: "application/json",
    });

    let text = response.text;
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Lesson Generation Error:", error);
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
    const response = await safeGenerateContent("gemini-2.5-flash", [
      { role: "user", parts: [{ text: prompt }] }
    ], {
      temperature: 0.5,
      responseMimeType: "application/json",
    });

    let text = response.text;
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Assessment Generation Error:", error);
    throw error;
  }
};

export const generateStarterFocusAreas = async (language, level) => {
  const prompt = `Act as an expert language tutor. I have a brand new student learning ${language} at the ${level} level. 
  They need a "Starter Syllabus" of 3 to 4 fundamental grammar rules to focus on first to build a strong foundation.
  Provide ONLY the names of the grammar rules.

  You MUST respond IN STRICT JSON FORMAT.
  Format:
  {
    "focusAreas": ["Rule 1", "Rule 2", "Rule 3"]
  }`;

  try {
    const response = await safeGenerateContent("gemini-2.5-flash", [
      { role: "user", parts: [{ text: prompt }] }
    ], {
      temperature: 0.7,
      responseMimeType: "application/json",
    });

    let text = response.text;
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Starter Syllabus Generation Error:", error);
    throw error;
  }
}; export const translateCurriculumTopics = async (language, topics) => {
  const prompt = `You are a professional translator and language tutor. Translate the following grammar curriculum topics from English into ${language}.
  Return the results as a JSON array of objects with the keys "rule" (original English name), "displayName" (translated name in ${language} script), and "displayDescription" (translated description in ${language} script).
  
  Input topics: ${JSON.stringify(topics)}
  
  Output Format:
  {
    "translated": [
      { "rule": "Original Rule", "displayName": "Translated Name", "displayDescription": "Translated Desc" }
    ]
  }`;

  try {
    const response = await safeGenerateContent("gemini-2.5-flash", [
      { role: "user", parts: [{ text: prompt }] }
    ], {
      temperature: 0.3,
      responseMimeType: "application/json",
    });

    let text = response.text;
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);
    return parsed.translated || [];
  } catch (error) {
    console.error("Curriculum Translation Error:", error);
    // Fallback: return original topics if translation fails
    return topics.map(t => ({ ...t, displayName: t.rule, displayDescription: t.description }));
  }
};
export const generateAdaptiveRemedialLesson = async (language, level, mistakes) => {
  const prompt = `Act as an expert language tutor. A student learning ${language} at ${level} level just took a quiz and failed these specific questions:
  ${mistakes.map(m => `- Question: "${m.question}" | Rule: "${m.grammarRule}" | Their Answer: "${m.userAnswer}"`).join('\n')}
  
  Your goal: Create a consolidated, high-impact "Recovery Lesson" in the target language (${language}).
  - Explain the core mistakes they made.
  - Provide a clear, easy-to-follow pedagogical explanation of the correct rules.
  - Provide 2-3 tailored examples that address their exact pitfalls.
  - Keep the tone encouraging but expert.
  
  You MUST respond IN STRICT JSON FORMAT.
  Format:
  {
    "title": "A encouraging title for this recovery lesson (IN TARGET LANGUAGE)",
    "summary": "Short summary of why these mistakes happened (IN TARGET LANGUAGE)",
    "explanation": "Detailed but concise pedagogical explanation (IN TARGET LANGUAGE)",
    "examples": [
      {
        "target": "Tailored example in ${language}",
        "english": "English translation"
      }
    ],
    "closingTip": "A final mnemonic or advice to avoid these specific errors in the future (IN TARGET LANGUAGE)"
  }`;

  try {
    const response = await safeGenerateContent("gemini-2.5-flash", [
      { role: "user", parts: [{ text: prompt }] }
    ], {
      temperature: 0.7,
      responseMimeType: "application/json",
    });

    let text = response.text;
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Adaptive Lesson Generation Error:", error);
    throw error;
  }
};
