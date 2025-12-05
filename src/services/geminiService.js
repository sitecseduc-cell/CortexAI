import { GoogleGenerativeAI } from "@google/generative-ai";

// Inicializa o cliente do Gemini
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const ML_SYSTEM_INSTRUCTION = `
Você é um especialista em RH Público (Estado do Pará). Analise o documento.
Classifique EXCLUSIVAMENTE como 'Férias - Administrativo' ou 'Férias - Professor'.
Extraia as entidades chave: NOME_SERVIDOR, MATRICULA, CARGO, PERIODO_AQUISITIVO, DATA_INICIO, DIAS_GOZO (número).
Determine o sentimento.
Forneça a saída estritamente no formato JSON.
`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    documentType: { type: "STRING" },
    keyFields: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { field: { type: "STRING" }, value: { type: "STRING" } }
      }
    },
    nlpResult: {
      type: "OBJECT",
      properties: {
        sentiment: { type: "STRING" },
        summary: { type: "STRING" }
      }
    }
  }
};

export const geminiApiService = {
  /**
   * Processa o documento enviando o Base64 diretamente para o Gemini
   */
  async processDocument(base64Content, mimeType = "application/pdf") {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash", // Modelo rápido e eficiente
        systemInstruction: ML_SYSTEM_INSTRUCTION,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA
        }
      });

      const prompt = "Analise este requerimento de férias e extraia os dados solicitados.";

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Content,
            mimeType: mimeType
          }
        }
      ]);

      const response = await result.response;
      return JSON.parse(response.text());

    } catch (error) {
      console.error("Erro na API Gemini:", error);
      throw new Error("Falha ao processar documento com IA.");
    }
  }
};