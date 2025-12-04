// src/services/geminiService.js

// Serviço simplificado para chamar suas rotas de API (ex: Vercel Functions ou API local)
export const geminiApiService = {
  
  // Função genérica para chamar suas APIs Serverless
  async callEndpoint(endpoint, body) {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("Gemini Service Error:", error);
        throw error;
    }
  },

  async callGeminiAPI(content, systemInstruction, schema) {
    // Você precisa criar um endpoint genérico ou específico para isso em /api/
    // Exemplo: /api/gemini-generic
    return this.callEndpoint('/api/gemini-generic', { 
        content, 
        systemInstruction, 
        schema 
    });
  },

  async generateDraft(context, veredict) {
    // Supondo que você crie um arquivo api/generate-draft.js
    const result = await this.callEndpoint('/api/generate-draft', {
        context,
        veredict
    });
    return result.response || result;
  }
};