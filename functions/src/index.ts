import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// --- 1. PROMPTS SEGUROS (Hardcoded no Backend) ---
const PROMPTS = {
  IDP: `Você é um motor de processamento de documentos (IDP) para o governo do Pará. Extraia dados em JSON.`,
  RAR: `Você é um Agente Especialista em RH Público (Lei 5.810/94). Analise os dados e emita veredito.`,
  PORTARIA: `Atue como um Redator Oficial. Gere o texto de uma Portaria Governamental baseada na aprovação deste processo. Use linguagem formal, "Considerando...", "Resolve:". Retorne apenas o texto.`,
  JURIDICO: `Você é um assistente jurídico especializado na Lei 5.810/94 (RJU Pará) e PCCR da Educação. Use o contexto fornecido para responder.`
};

// --- 2. MOCK DE INTEGRAÇÃO (Siape/Ergon) ---
// Em produção, isso seria um axios.get('https://api.governo.pa.gov.br/rh/...')
const mockErgonIntegration = async (nome: string) => {
    // Simula busca em banco legado
    const dbMock = [
        { nome: "MARIA", cargo: "Professor Classe I", matricula: "55221-9", tempo_servico: 12, lotacao: "Escola A" },
        { nome: "JOAO", cargo: "Técnico Administrativo", matricula: "11234-1", tempo_servico: 2, lotacao: "Seduc Sede" }
    ];
    
    // Busca fuzzy simples
    const servidor = dbMock.find(s => nome.toUpperCase().includes(s.nome));
    return servidor || null;
};

// --- CONTEXTO JURÍDICO (RAG Simplificado) ---
// Para um RAG real, usaríamos Vector Store. Para este exemplo, injetamos trechos chaves.
const LEI_5810_CONTEXT = `
Art. 105. A licença para tratamento de saúde será concedida a pedido ou de ofício.
Art. 110. A licença-maternidade será de 180 dias.
Art. 125. O servidor terá direito a 30 dias de férias.
`;

// --- FUNÇÕES EXPORTADAS ---

// A. Processamento Seguro (IDP + Raciocínio)
export const analyzeProcess = onCall({ cors: true }, async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login necessário.');
    
    const { action, content, contextData } = request.data;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let systemInstruction = "";
    let userPrompt = content;

    // Seleciona o prompt baseando-se na AÇÃO, não no input do usuário
    switch(action) {
        case 'EXTRACT_IDP':
            systemInstruction = PROMPTS.IDP;
            break;
        case 'ANALYZE_RULES':
            systemInstruction = PROMPTS.RAR;
            // Injeta regras e dados de RH no prompt de usuário com segurança
            userPrompt = `DADOS DOC: ${content}. DADOS RH: ${JSON.stringify(contextData.rh)}. REGRAS: ${JSON.stringify(contextData.rules)}`;
            break;
        case 'GENERATE_PORTARIA':
            systemInstruction = PROMPTS.PORTARIA;
            userPrompt = `Gere a portaria para: ${JSON.stringify(contextData)}`;
            break;
        default:
            throw new HttpsError('invalid-argument', 'Ação desconhecida.');
    }

    try {
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            // Se for IDP ou RAR, forçamos JSON. Se for Portaria, texto livre.
            generationConfig: { responseMimeType: action === 'GENERATE_PORTARIA' ? "text/plain" : "application/json" }
        });
        
        const responseText = result.response.text();
        return { data: action === 'GENERATE_PORTARIA' ? { text: responseText } : JSON.parse(responseText) };

    } catch (error) {
        logger.error("Erro IA:", error);
        throw new HttpsError('internal', 'Falha na IA');
    }
});

// B. Integração com Folha (Mock Cloud Function)
export const enrichServidorData = onCall({ cors: true }, async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login necessário.');
    
    const { nome } = request.data;
    if (!nome) return { found: false };

    const dados = await mockErgonIntegration(nome);
    return { found: !!dados, data: dados || {} };
});

// C. Chat Jurídico com Contexto (RAG)
export const chatJuridico = onCall({ cors: true }, async (request) => {
    const { message } = request.data;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: PROMPTS.JURIDICO });

    // Injeta o contexto da lei antes da pergunta do usuário (Simulação de RAG)
    const fullPrompt = `CONTEXTO DA LEI 5.810: ${LEI_5810_CONTEXT}\n\nPERGUNTA DO USUÁRIO: ${message}`;

    const result = await model.generateContent(fullPrompt);
    return { response: result.response.text() };
});