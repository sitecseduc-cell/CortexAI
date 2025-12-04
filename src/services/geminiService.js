// src/services/geminiService.js

// REMOVIDOS IMPORTS DO FIREBASE FUNCTIONS

// --- Constantes de Prompt (System Instructions) ---
const ML_IDP_SYSTEM_INSTRUCTION = `
Você é um motor de processamento de documentos (IDP) especializado em documentos administrativos públicos brasileiros (Estado do Pará).
Analise o texto extraído e estruture os dados.
Identifique o tipo de documento (Requerimento, Atestado, Certidão, etc).
Extraia campos chave como: Nome, Matrícula, Cargo, Datas, CIDs, etc.
Sua saída deve ser estritamente um JSON válido.
`;

const RAR_SYSTEM_INSTRUCTION = `
Você é um Agente Especialista em RH Público do Estado do Pará (Lei 5.810/94).
Analise os dados extraídos (IDP) e os dados de RH (Enriquecimento).
Aplique as regras fornecidas e emita um veredito justificado.
`;

// --- Serviço Principal: Usa fetch para chamar endpoints Vercel ---
export const geminiApiService = {
  
  // Função utilitária para chamar endpoints Vercel (ou API local)
  async callEndpoint(endpoint, body) {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
             const errorBody = await response.text();
             throw new Error(`API Error: ${response.status} - ${errorBody}`);
        }
        return await response.json();

    } catch (error) {
        console.error("Gemini Service Error:", error);
        throw error;
    }
  },

  // Chamada para ToolsView.vue (Assistente Jurídico)
  async callGeminiAPI(content, jsonInstruction) {
    return this.callEndpoint('/api/gemini-juridico', { 
        prompt: content, 
        jsonInstruction: jsonInstruction 
    });
  },

  // Chamada para DocumentViewer (Geração de Minuta)
  async generateDraft(context, veredict) {
    const result = await this.callEndpoint('/api/generate-official-act', {
        context,
        veredict
    });
    // Assume que a API retorna o texto final dentro da propriedade 'response'
    return result.response || result;
  }
};