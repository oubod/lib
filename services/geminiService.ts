
import { GoogleGenAI } from "@google/genai";

// Safely access environment variables
const API_KEY = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined;

if (!API_KEY) {
  console.warn("La clé API Gemini n'est pas configurée. Les fonctionnalités IA seront désactivées.");
}

// Only create AI instance if API key is available
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export async function getAiInsight(text: string, fileName: string): Promise<string> {
  if (!API_KEY || !ai) {
    return "Fonctionnalité IA non disponible. Veuillez configurer votre clé API Gemini dans les variables d'environnement Netlify.";
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
    return "Désolé, une erreur s'est produite lors de la communication avec l'IA. Veuillez réessayer.";
  }
}
