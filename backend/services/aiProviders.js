import dotenv from "dotenv";
import Groq from "groq-sdk";
import { Mistral } from "@mistralai/mistralai";
import Cerebras from "@cerebras/cerebras_cloud_sdk";
import { CohereClient } from "cohere-ai";

dotenv.config();

/**
 * Universal helper to translate Gemini format to standard SDK Messages Array
 */
const formatMessages = (contents, config) => {
  const messages = [];

  // Add system instruction if present
  if (config?.systemInstruction) {
    messages.push({ role: "system", content: config.systemInstruction });
  }

  // Translate Gemini roles (user, model) to standard roles (user, assistant)
  for (const msg of contents) {
    messages.push({
      role: msg.role === "model" ? "assistant" : "user",
      content: msg.parts[0].text,
    });
  }

  return messages;
};

export const fetchGroq = async (model, contents, config) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const groq = new Groq({ apiKey });
  const messages = formatMessages(contents, config);

  const completion = await groq.chat.completions.create({
    messages,
    model,
    temperature: config?.temperature || 0.7,
    max_tokens: config?.max_tokens || 2048,
    response_format: { type: "json_object" },
  });

  return { text: completion.choices[0].message.content };
};

export const fetchMistral = async (model, contents, config) => {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  // Note: Mistral requires 'apiKey'
  const mistral = new Mistral({ apiKey });
  const messages = formatMessages(contents, config);

  const completion = await mistral.chat.complete({
    model,
    messages,
    temperature: config?.temperature || 0.7,
    maxTokens: config?.max_tokens || 2048,
    responseFormat: { type: "json_object" },
  });

  return { text: completion.choices[0].message.content };
};

export const fetchCerebras = async (model, contents, config) => {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const cerebras = new Cerebras({ apiKey });
  const messages = formatMessages(contents, config);

  const completion = await cerebras.chat.completions.create({
    messages,
    model,
    temperature: config?.temperature || 0.7,
    response_format: { type: "json_object" },
  });

  return { text: completion.choices[0].message.content };
};

export const fetchCohere = async (model, contents, config) => {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const cohere = new CohereClient({ token: apiKey });
  
  // Extract the last message for the current 'message'
  const lastMsg = contents[contents.length - 1].parts[0].text;
  
  // Convert older history to Cohere's format
  const chatHistory = contents.slice(0, -1).map(msg => ({
    role: msg.role === "model" ? "CHATBOT" : "USER",
    message: msg.parts[0].text
  }));

  const response = await cohere.chat({
    model,
    message: lastMsg,
    chatHistory,
    preamble: config?.systemInstruction || "",
    temperature: config?.temperature || 0.7
  });

  return { text: response.text };
};
