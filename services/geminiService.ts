import { GoogleGenAI } from "@google/genai";
import { UserLevel, Subject } from '../types';

// Per @google/genai coding guidelines, initialize the client at the module level
// to ensure a single instance and prevent errors from missing return paths that can
// occur with in-function initialization.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateStudyNote = async (level: UserLevel, subject: Subject, topic: string): Promise<string> => {
  const prompt = `
    Agis comme un tuteur expert et pédagogue. Crée une fiche de révision claire et concise pour un étudiant de niveau "${level}" sur le sujet "${subject}", en se concentrant spécifiquement sur le thème suivant : "${topic}".

    La fiche doit inclure les sections suivantes, bien délimitées :
    1.  **Introduction (1-2 phrases)** : Présente brièvement le concept.
    2.  **Concepts Clés (3-5 points)** : Explique les idées fondamentales de manière simple et avec des analogies si possible.
    3.  **Exemple Pratique (si applicable)** : Fournis un exemple de code simple (pour la programmation) ou un problème résolu (pour les maths/réseau) avec des commentaires.
    4.  **Astuce de Mémorisation** : Donne une technique ou un moyen mnotechnique pour retenir l'information.
    5.  **Erreur à Éviter** : Décris un piège courant dans lequel les débutants tombent.
    6.  **Pour Aller Plus Loin** : Suggère une prochaine étape ou un sujet connexe à explorer.

    Structure la réponse en Markdown pour une bonne lisibilité. N'inclus pas de \`\`\`markdown au début.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    // FIX: Per @google/genai coding guidelines, the response text is accessed via the `.text` property.
    // An incorrect attempt to call it as a function (e.g., `response.text()`) would result in a "not callable" error.
    return response.text;
  } catch (error) {
    console.error("Error generating study note:", error);
    return "Désolé, une erreur est survenue lors de la génération de la fiche. Veuillez réessayer.";
  }
};
