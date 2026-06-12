
import { GoogleGenAI } from "@google/genai";

const FALLBACK_LORE = [
  "The fog thickens...",
  "They smell your fear.",
  "Fetch me their souls...",
  "Don't look back.",
  "The dead are rising...",
  "No one is coming to save you.",
  "Run while you still can.",
  "The bus is late...",
  "Is that a light in the distance?",
  "Stay out of the fire.",
  "A cold wind blows from the east.",
  "They are closer than you think.",
  "The town is silent. Too silent.",
  "The bank is empty, but not abandoned.",
  "Can you hear the scratching at the door?",
  "The shadows are moving on their own.",
  "Keep your eyes on the rooftops.",
  "The air tastes like copper.",
  "Every corner holds a secret.",
  "The silence is heavier than the dark."
];

let apiDisabledUntil = 0;

export const getRoundLore = async (round: number): Promise<string> => {
  const now = Date.now();
  
  if (now < apiDisabledUntil) {
    return FALLBACK_LORE[Math.floor(Math.random() * FALLBACK_LORE.length)];
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) throw new Error("No API key found");

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Generate a very short (max 12 words) cryptic, dark message for a survivor in a zombie apocalypse starting round ${round}. Something like 'The fog thickens...' or 'They smell your fear.'`,
    });
    
    const text = response.text?.trim();
    if (text) return text;
    
    return FALLBACK_LORE[Math.floor(Math.random() * FALLBACK_LORE.length)];
  } catch (error: any) {
    const errorString = JSON.stringify(error).toLowerCase();
    const isRateLimit = errorString.includes('429') || 
                        errorString.includes('quota') || 
                        errorString.includes('resource_exhausted') ||
                        errorString.includes('exceeded your current quota') ||
                        error?.status === 429;

    if (isRateLimit) {
      apiDisabledUntil = now + 300000; // Increase cooldown to 5 minutes
      console.warn("Gemini API quota exhausted. Switched to fallback lore.");
    } else {
      console.warn("Gemini lore generation failed, using fallback.");
    }
    
    return FALLBACK_LORE[Math.floor(Math.random() * FALLBACK_LORE.length)];
  }
};
