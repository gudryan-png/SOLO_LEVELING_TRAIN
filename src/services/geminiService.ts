import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const getMealRecommendations = async (goal: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Como um mentor de dieta de um sistema estilo Solo Leveling, recomende 3 refeições rápidas e eficientes para um Hunter que tem o objetivo: "${goal}".
      O objetivo pode ser "muscle_gain" (ganhar massa), "weight_gain" (engordar), "weight_loss" (emagrecer) ou "maintenance" (manter).`,
      config: {
        systemInstruction: "Você é um sistema hunter que recomenda dietas. Responda apenas com o JSON solicitado. Inclua o campo 'recipe' com o passo a passo da preparação.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              description: { type: Type.STRING },
              recipe: { type: Type.STRING }
            },
            required: ["name", "calories", "protein", "description", "recipe"]
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return [];
  } catch (error) {
    console.error("Erro ao buscar recomendações de refeição:", error);
    return [];
  }
};
