// Copiamos as instruções do sistema e schemas do código original 
const ML_IDP_SYSTEM_INSTRUCTION = "Você é um motor de processamento de documentos (IDP)..."; 
// ... (Mantenha as constantes de prompt do código original aqui)

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export const geminiApiService = {
  async callGeminiAPI(content, systemInstruction, schema) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{ parts: [{ text: content }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: { responseMimeType: "application/json", responseSchema: schema }
    };

    // Lógica de retry do código original 
    for (let i = 0; i < 3; i++) {
      try {
        const response = await fetch(apiUrl, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        const result = await response.json();
        const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) return JSON.parse(jsonText);
        throw new Error("Resposta vazia.");
      } catch (error) {
        if (i < 2) await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        else throw error;
      }
    }
  },

  async callGeminiAPIForProcessing(content) {
      // Lógica adaptada do original 
      // ... implemente a chamada chamando this.callGeminiAPI
      // Retorne { idpResult, nlpResult }
  },

  async callGeminiAPIForReasoning(dossierPrompt) {
      // Lógica adaptada do original 
      // ...
  }
};