
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("La clé API Gemini n'est pas configurée. Les fonctionnalités IA seront désactivées.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function getAiInsight(text: string, fileName: string): Promise<string> {
  if (!API_KEY) {
    return "Fonctionnalité IA non disponible. Veuillez configurer votre clé API Gemini.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Contexte : Tu es un assistant expert pour un étudiant en médecine analysant un document nommé "${fileName}".\n\nVoici un extrait du texte :\n\n---\n${text}\n---\n\nS'il te plaît, fournis un résumé concis et clair de cet extrait, en mettant en évidence les points clés pertinents pour un étudiant en médecine. Si le texte contient une question, réponds-y directement.`,
      config: {
        temperature: 0.2,
        topP: 0.9,
      }
    });
    return response.text || 'Aucune réponse reçue de l\'IA';
  } catch (error) {
    console.error("Erreur lors de l'appel à l'API Gemini :", error);
    return "Désolé, une erreur est survenue lors de la communication avec l'IA. Veuillez réessayer.";
  }
}
