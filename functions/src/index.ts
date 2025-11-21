import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";

// Define a interface dos dados que esperamos receber do Frontend
interface AgentRequestData {
  content: string;
  systemInstruction?: string;
  schema?: string;
}

// Pega a chave do ambiente ou usa string vazia (para evitar erro de tipo, mas falhará se vazio)
const API_KEY = process.env.GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(API_KEY);

export const callGeminiAgent = onCall({ cors: true }, async (request: CallableRequest<AgentRequestData>) => {
    // 1. Validação de Autenticação
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'O usuário deve estar logado.');
    }

    // O TypeScript agora sabe que 'content', 'systemInstruction' etc existem por causa da interface acima
    const { content, systemInstruction, schema } = request.data;

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: systemInstruction 
        });

        const generationConfig: GenerationConfig = {
            responseMimeType: "application/json",
            responseSchema: schema ? JSON.parse(schema) : undefined
        };

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: content }] }],
            generationConfig: generationConfig
        });

        const responseText = result.response.text();

        return { data: JSON.parse(responseText) };
    } catch (error: unknown) {
        logger.error("Erro no Gemini:", error);
        
        // Tratamento de erro seguro para TypeScript (error é 'unknown')
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        
        throw new HttpsError('internal', `Erro ao processar IA: ${errorMessage}`);
    }
});