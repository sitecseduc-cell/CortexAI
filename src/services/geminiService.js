// src/services/geminiService.js

// 1. Atualize os imports para incluir connectFunctionsEmulator
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { app } from '@/libs/firebase'; // Importa o app inicializado

// 2. Inicializa o serviço de funções
const functions = getFunctions(app, 'us-central1');

// --- BLOCO QUE VOCÊ PERGUNTOU (Conexão com Emulador) ---
// Coloque aqui, logo após inicializar 'functions'
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    // A porta 5001 é a padrão das Cloud Functions no emulador
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    console.log("🔌 Conectado ao Emulador de Funções (Localhost:5001)");
}
// -------------------------------------------------------

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

// --- Serviço Principal ---
export const geminiApiService = {
  
  // ... (restante do código do serviço: callGeminiAPI, callGeminiAPIForProcessing, etc.)
  
  async callGeminiAPI(content, systemInstruction, schema) {
    try {
      // Cria a referência para a função 'callGeminiAgent' que criamos no backend
      const callGeminiFunction = httpsCallable(functions, 'callGeminiAgent');
      
      const result = await callGeminiFunction({ 
        content: content, 
        systemInstruction: systemInstruction, 
        schema: schema ? JSON.stringify(schema) : null 
      });
      
      if (!result.data || !result.data.data) {
         throw new Error("Resposta inválida do servidor.");
      }

      return result.data.data; 
    } catch (error) {
      console.error("GeminiService: Erro na chamada ao Backend:", error);
      throw error;
    }
  },

  // ... mantenha os outros métodos (callGeminiAPIForProcessing, callGeminiAPIForReasoning) abaixo
  async callGeminiAPIForProcessing(content) {
      const idpSchema = {
        type: "OBJECT",
        properties: {
          documentType: { type: "STRING" },
          keyFields: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                field: { type: "STRING" },
                value: { type: "STRING" },
                confidence: { type: "NUMBER" }
              }
            }
          },
          nlpResult: {
             type: "OBJECT",
             properties: {
                summary: { type: "STRING" },
                sentiment: { type: "STRING", enum: ["Positivo", "Neutro", "Negativo"] }
             }
          }
        },
        required: ["documentType", "keyFields"]
      };

      const result = await this.callGeminiAPI(content, ML_IDP_SYSTEM_INSTRUCTION, idpSchema);
      
      return {
          idpResult: result, 
          nlpResult: result.nlpResult || {} 
      };
  },

  async callGeminiAPIForReasoning(dossierPrompt) {
      const rarSchema = {
          type: "OBJECT",
          properties: {
              veredicto: {
                  type: "OBJECT",
                  properties: {
                      status: { type: "STRING", enum: ["Aprovado", "Rejeitado", "FALHA"] },
                      parecer: { type: "STRING" }
                  },
                  required: ["status", "parecer"]
              },
              chainOfThought: { type: "STRING" }
          },
          required: ["veredicto", "chainOfThought"]
      };

      return await this.callGeminiAPI(dossierPrompt, RAR_SYSTEM_INSTRUCTION, rarSchema);
  }
};