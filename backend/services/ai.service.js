import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { fetchGroq, fetchMistral, fetchCerebras, fetchCohere } from "./aiProviders.js";

dotenv.config();
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Universal helper to call AI models with automatic retries and multi-provider fallback waterfall.
 */
const fallbackChain = [
  { provider: "gemini", model: "gemini-1.5-flash" },
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
      const result = await ai.models.generateContent({
        model,
        contents,
        config: config
      });
      return { text: result.text };
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

export const safeGenerateContent = async (modelName, contents, config, retries = 2) => {
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
1. Conversation: Talk naturally with the user in the target language. Keep the conversation engaging and realistic.
2. Adapt to Level: Beginner -> simple words, short sentences. Intermediate -> moderate vocabulary and grammar. Advanced -> natural, fluent, native-level.
3. Grammar Audit (STRICT): Examine the user's entire sentence structure, word order, and syntax. Do not ignore errors. If the sentence is clumsy or structurally incorrect, identify it.
4. Error Correction: Provide a list of specific mistakes found in "corrections". 
5. Holistic Improvement: Provide a "fullCorrection" field which contains the user's entire message rewritten to be grammatically perfect and natural in ${language}.
6. Vocabulary Support: Identify 1-3 key vocabulary words or phrases from the current exchange.

Output Format Requirements:
You MUST respond IN STRICT JSON FORMAT. Do not include markdown codeblocks, just the raw JSON object string.
The JSON object MUST have the following structure:
{
  "reply": "Your natural conversational reply in the target language (MUST be a proper, helpful response to the user's content)",
  "fullCorrection": "The entire user message with all errors fixed (Set to null if NO errors were found)",
  "corrections": [
    {
      "incorrect": "The specific incorrect word or phrase the user used",
      "correct": "The corrected version",
      "explanation": "A simple explanation in English of why it was wrong",
      "grammarRule": "The fundamental grammar rule correctly explained"
    }
  ],
  "newVocabulary": ["word1", "word2"]
}
If no corrections are needed, set "fullCorrection" to null and pass an empty array for "corrections".
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
    const response = await safeGenerateContent("gemini-1.5-flash", contents, {
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
    const systemInstruction = `As a language tutor, review this conversation history between a user learning ${language} at ${level} level and the tutor.
    Perform a deep scan of the conversation to generate a session summary IN STRICT JSON FORMAT.
    
    CRITICAL: All fields ("mistakes", "vocabulary", "tips", "overallFeedback") MUST be written EXCLUSIVELY in ${language}. 
    Do not use English for tips or feedback.
    
    Format example:
    {
      "mistakes": ["List of key mistakes in ${language}"],
      "vocabulary": ["List of unique vocabulary words/phrases in ${language}"],
      "tips": ["Targeted tips in ${language}"],
      "overallFeedback": "A detailed, encouraging feedback paragraph in ${language}"
    }`;

  try {
    const transcript = chatHistory.length > 0
      ? chatHistory.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')
      : "No conversation occurred.";

    const response = await safeGenerateContent("gemini-1.5-flash", [
      { role: "user", parts: [{ text: `Summarize this practice session transcript:\n\n${transcript}` }] },
    ], {
      systemInstruction,
      temperature: 0.4,
      responseMimeType: "application/json",
    });

    let text = response.text;
    if (!text) throw new Error("Empty response");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Summary Generation Error:", error);
    // ✅ Fallback summary if AI fails (e.g., quota exceeded), so user can still end session!
    return {
      mistakes: ["Limit reached"],
      vocabulary: ["Limit reached"],
      tips: ["Please continue practicing!"],
      overallFeedback:
        "Great session! Detailed feedback is temporarily unavailable due to high AI demand, but your progress has been saved.",
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
    
    STRICT LANGUAGE ENFORCEMENT:
    1. Every field (question, options, explanation, grammarRule) MUST be written STOICALLY AND EXCLUSIVELY in ${language}.
    2. DO NOT use English in any of these fields.
    3. Use the native script for ${language} (e.g., Hindi, Japanese, Cyrillic) where applicable.

    You MUST respond IN STRICT JSON FORMAT.
    Format:
    {
      "questions": [
        {
          "question": "Question text in ${language}",
          "options": ["Option A", "Option B", "Option C", "Option D"], // ALL in ${language}
          "correctAnswerIndex": 0,
          "explanation": "Why this answer is correct in ${language}",
          "grammarRule": "The underlying grammar rule in ${language}"
        }
      ]
    }`;

  try {
    const response = await safeGenerateContent("gemini-1.5-flash", [
      { role: "user", parts: [{ text: "Generate the quiz now." }] }
    ], {
      systemInstruction: prompt,
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
  const prompt = `You are a STRICT language generator.

TASK:
Generate a micro grammar lesson for:
- Language: ${language}
- Level: ${level}
- Rule: ${rule}

CRITICAL RULES (MUST FOLLOW):
1. "title", "explanation", and "tip" MUST be ONLY in ${language}.
2. "examples[].target" MUST be ONLY in ${language}.
3. "examples[].english" MUST be ONLY in English.
4. DO NOT mix languages.
5. DO NOT include any French/Spanish/English in target unless ${language} is that language.
6. If you violate rules, the answer is INVALID.

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "title": "...",
  "explanation": "...",
  "examples": [
    {
      "target": "...",
      "english": "..."
    }
  ],
  "tip": "..."
}

VALIDATION BEFORE RESPONSE:
- Check that ALL non-English fields are in ${language}.
- If not, REGENERATE before responding.

Generate now.`;

  try {
    const response = await safeGenerateContent("gemini-1.5-flash", [
      { role: "user", parts: [{ text: "Generate the lesson now." }] }
    ], {
      systemInstruction: prompt,
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
    - Provide a detailed pedagogical report IN ${language} with 3 strengths, 3 weaknesses, and 3 next steps.
    - CRITICAL: The fields "report", "strengths", "weaknesses", and "nextSteps" MUST be written EXCLUSIVELY in ${language}.

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
    const response = await safeGenerateContent("gemini-1.5-flash", [
      { role: "user", parts: [{ text: "Analyze the data and generate the report now." }] }
    ], {
      systemInstruction: prompt,
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
    const response = await safeGenerateContent("gemini-1.5-flash", [
      { role: "user", parts: [{ text: "Generate the starter focus areas now." }] }
    ], {
      systemInstruction: prompt,
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
    const response = await safeGenerateContent("gemini-1.5-flash", [
      { role: "user", parts: [{ text: "Translate the topics now." }] }
    ], {
      systemInstruction: prompt,
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
  
  STRICT LANGUAGE ENFORCEMENT:
  1. Title, Summary, Explanation, and Closing Tip MUST be written EXCLUSIVELY in ${language}.
  2. DO NOT use English in those fields.
  3. Use English ONLY in the "english" field within the examples array.

  You MUST respond IN STRICT JSON FORMAT.
  Format:
  {
    "title": "Encouraging title in ${language}",
    "summary": "Short summary in ${language}",
    "explanation": "Pedagogical explanation in ${language}",
    "examples": [
      {
        "target": "Tailored example in ${language}",
        "english": "English translation"
      }
    ],
    "closingTip": "Final advice in ${language}"
  }`;

  try {
    const response = await safeGenerateContent("gemini-1.5-flash", [
      { role: "user", parts: [{ text: "Generate the recovery lesson now." }] }
    ], {
      systemInstruction: prompt,
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
