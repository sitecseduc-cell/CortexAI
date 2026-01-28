import { GoogleGenerativeAI } from "@google/generative-ai";

// Inicializa o cliente com a chave que definiste no .env.local
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const ML_SYSTEM_INSTRUCTION = `
Você é um especialista em RH Público do Estado do Pará.
Analise o documento administrativo.
Extraia EXCLUSIVAMENTE em formato JSON os seguintes campos:
- documentType (ex: "Férias", "Licença", "Outros")
- keyFields: Um array de objetos {field, value} contendo: Nome, Matrícula, Cargo, Data de Início, Dias Solicitados (numérico), Período Aquisitivo.
- nlpResult: Objeto com sentiment (sentimento do texto) e summary (resumo curto).
`;

export const geminiApiService = {
  async processDocument(base64Content, mimeType = "application/pdf") {
    if (!API_KEY) {
      throw new Error("VITE_GEMINI_API_KEY não configurada no .env.local");
    }

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: ML_SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = "Extraia os dados deste requerimento para análise de RH.";
      
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
      throw new Error("Falha ao processar documento com a IA. Verifique sua chave API.");
    }
  }
};