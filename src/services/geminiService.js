// src/services/geminiService.js

// Serviço simplificado para chamar suas rotas de API (ex: Vercel Functions ou API local)
export const geminiApiService = {
  
  /**
   * Chama uma rota de API para processar texto ou gerar conteúdo
   */
  async callGeminiAPI(prompt, systemInstruction) {
    try {
      const response = await fetch('/api/gemini-generic', { // Você precisará criar esta rota ou adaptar
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemInstruction })
      });

      if (!response.ok) throw new Error('Falha na requisição AI');
      return await response.json();
    } catch (error) {
      console.error("Erro no serviço Gemini:", error);
      // Retorna fallback para não quebrar a UI
      return { text: "Erro ao processar solicitação de IA." };
    }
  },

  // Gera a minuta chamando uma API específica
  async generateDraft(context, veredict) {
    try {
      const response = await fetch('/api/generate-draft', { // Crie esta rota similar a api/process-vacation
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, veredict })
      });
      
      const data = await response.json();
      return data.response || data;
    } catch (error) {
      console.error("Erro ao gerar minuta:", error);
      return "Erro ao gerar o documento. Tente novamente.";
    }
  }
};