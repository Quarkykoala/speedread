import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysis, ReadingMode } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeText = async (text: string, mode: ReadingMode): Promise<AIAnalysis> => {
  // Truncate text to avoid token limits (approx first 20k chars is enough for a gist)
  const truncatedText = text.slice(0, 20000);

  // Using the latest Gemini 3 Flash model
  const model = "gemini-3-flash-preview";
  
  let prompt = "";

  if (mode === 'technical') {
    prompt = `
      Analyze the following technical paper/document.
      Provide a structured brief to prepare a speed-reader.
      1. Summary: A concise abstract-style summary.
      2. KeyPoints: List the Hypothesis, Methodology, and Main Findings/Data.
      3. Estimated Time: Time to read at 200wpm (technical speed).
      
      Text start:
      "${truncatedText}..."
    `;
  } else {
    prompt = `
      Analyze the following text which is from a book or document the user is about to speed read.
      Provide a concise summary, a list of 3-5 key concepts they should look out for, and an estimated reading time if read at normal speed (300wpm).
      
      Text start:
      "${truncatedText}..."
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keyPoints: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            estimatedReadingTime: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIAnalysis;
    }
    
    throw new Error("No response from AI");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      summary: "Could not generate analysis. Please check your API key or try a shorter document.",
      keyPoints: [],
      estimatedReadingTime: "N/A"
    };
  }
};

export const askQuestion = async (
  text: string,
  question: string,
  mode: ReadingMode
): Promise<string> => {
  const truncatedText = text.slice(0, 20000);
  const model = "gemini-3-flash-preview";
  const styleHint = mode === 'technical'
    ? "Answer as a concise technical tutor. Use bullet points when helpful."
    : "Answer as a concise reading coach. Be direct and practical.";

  const prompt = `
    You are a helpful tutor.
    ${styleHint}
    Use the provided document excerpt as the only source of truth.
    If the excerpt does not contain the answer, say so and suggest what to look for.

    Document excerpt:
    "${truncatedText}..."

    Question: ${question}
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt
    });

    if (response.text) {
      return response.text;
    }

    return "I did not receive a response. Please try again.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Could not answer that. Please check your API key or try again.";
  }
};
