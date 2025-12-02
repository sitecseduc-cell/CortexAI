/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import {GoogleGenerativeAI, SchemaType} from "@google/generative-ai";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

// NÃO inicialize o cliente globalmente com process.env, pois pode falhar no deploy
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); <--- REMOVIDO

const MODEL_NAME = "gemini-1.5-flash";

// --- 1. PROMPTS ESPECIALIZADOS ---

// Prompt base para IDP (Extração)
const PROMPT_IDP = `
Você é um motor de extração de dados para a SEDUC.
Analise o documento anexo.
Extraia:
- Tipo Documental (Ex: Requerimento de Férias, Atestado, etc)
- Nome do Servidor
- Matrícula
- Cargo (se visível)
- Período Aquisitivo (ex: 2023/2024)
- Dias Solicitados (numérico)
- Data de Início
Saída JSON: { documentType, keyFields: [{field, value}], summary }
`;

// Helper para obter cliente seguro
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key não configurada.");
  return new GoogleGenerativeAI(apiKey);
}

// Helper para Auditoria
async function logAudit(db: any, data: { docId: string, action: string, prompt: string, response: string, model: string, decision: string }) {
    await db.collection("audit_logs").add({
        ...data,
        timestamp: new Date(), // Firestore Timestamp
    });
    logger.info(`[AUDIT] Decisão registrada para ${data.docId}: ${data.decision}`);
}


// Helper: Calcular Similaridade de Cosseno
function cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) {
        return 0;
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 1. Função para "Semear" a Lei (Execute uma vez via script ou endpoint admin)
export async function seedLawKnowledgeBase(apiKey: string, fullText: string) {
    const genAIWithKey = new GoogleGenerativeAI(apiKey);
    const model = genAIWithKey.getGenerativeModel({ model: "text-embedding-004" });

    // Divide o texto em chunks (Artigos ou Parágrafos)
    // Simplificado: divide por quebra dupla de linha (ajuste conforme a formatação do seu PDF/TXT)
    const chunks = fullText.split("\n\n").filter((c) => c.length > 50);

    const batch = db.batch();

    logger.info(`Gerando embeddings para ${chunks.length} trechos da lei...`);

    for (let i = 0; i < chunks.length; i++) {
        const text = chunks[i];
        const result = await model.embedContent(text);
        const vector = result.embedding.values;

        const docRef = db.collection("knowledge_base").doc(`chunk_${i}`);
        batch.set(docRef, {
            text: text,
            embedding: vector, // Array de floats
            source: "Lei 5.810/94 RJU-PA",
            index: i,
        });
    }

    await batch.commit();
    logger.info("Base de conhecimento jurídica indexada com sucesso.");
}

// 2. Função de Recuperação (Retrieval)
export async function retrieveRelevantContext(apiKey: string, query: string): Promise<string> {
    const genAIWithKey = new GoogleGenerativeAI(apiKey);
    const model = genAIWithKey.getGenerativeModel({ model: "text-embedding-004" });

    // 1. Vetorizar a pergunta
    const result = await model.embedContent(query);
    const queryVector = result.embedding.values;

    // 2. Buscar vetores no Firestore
    const snapshot = await db.collection("knowledge_base").get();
    const matches: { text: string; score: number }[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        const score = data.embedding ? cosineSimilarity(queryVector, data.embedding) : 0;
        return { text: data.text, score };
    }).filter((match) => match.score > 0.65); // Limiar de relevância

    // 3. Ordenar e pegar os Top 3 trechos
    const topMatches = matches.sort((a, b) => b.score - a.score).slice(0, 3);

    return topMatches.map((m) => m.text).join("\n---\n");
}

// Função simples de distância de Levenshtein para comparação Fuzzy
function levenshtein(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
}

/**
 * Mock function to simulate integration with Ergon system.
 * @param {string} termoBusca - The name or registration to search for.
 * @return {Promise<any>} - The found user data or null.
 */
// --- 2. INTEGRAÇÃO COM RH (ERGON - MOCK) ---
// Refatorado para incluir Cargos distintos
async function mockErgonIntegration(termoBusca: string): Promise<any> {
  logger.info(`[ERGON] Buscando dados para: ${termoBusca}`);
  if (!termoBusca) return { erro: "Nome não identificado" };

  const termoUpper = termoBusca.toUpperCase().trim();
  
  // Banco de dados Mockado
  const dbMock = [
    { 
      nome: "MARIA OLIVEIRA", 
      cargo: "PROFESSOR CLASSE I", 
      categoria: "MAGISTERIO", // Flag importante para a regra
      matricula: "55221-9", 
      tempo_servico_anos: 12, 
      lotacao: "EEEFM RUI BARBOSA", 
      status_funcional: "ATIVO",
      ferias_vencidas: 1, // Tem 1 período vencido
    },
    { 
      nome: "JOAO SILVA", 
      cargo: "ASSISTENTE ADMINISTRATIVO", 
      categoria: "ADMINISTRATIVO", // Flag importante
      matricula: "11234-1", 
      tempo_servico_anos: 5, 
      lotacao: "SEDE - GABINETE", 
      status_funcional: "ATIVO",
      ferias_vencidas: 2,
    },
    { 
        nome: "CARLOS SOUZA", 
        cargo: "MERENDEIRO", 
        categoria: "APOIO", 
        matricula: "99887-2", 
        tempo_servico_anos: 25, 
        status_funcional: "ATIVO", 
    },
  ];

  // Busca Fuzzy simples
  return dbMock.find(s => termoUpper.includes(s.nome)) || 
         dbMock.find(s => s.matricula === termoUpper) ||
         { erro: "Servidor não encontrado na base RH", categoria: "DESCONHECIDO" };
}

// Gatilho 1: Assim que um documento é criado -> Inicia IDP
export const onProcessCreated = onDocumentCreated(
  "artifacts/{appId}/users/{userId}/intelligent_platform_docs/{docId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot || snapshot.data().status !== "Uploaded") return;

    logger.info(`[AGENTE] Iniciando IDP para doc: ${event.params.docId}`);

    try {
      // Atualiza status para dar feedback na UI
      await snapshot.ref.update({status: "Processing IDP"});
      const data = snapshot.data();
      
      // 1. Baixar o arquivo do Storage
      logger.info(`[AGENTE] Baixando arquivo para IDP: ${data.fileUrl}`);
      // Em produção real, use admin.storage().bucket().file().download()
      const response = await fetch(data.fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString("base64");
      
      const genAI = getGenAIClient();
      // 2. Enviar para Gemini (Multimodal)
      const model = genAI.getGenerativeModel({ 
          model: MODEL_NAME,
          generationConfig: { responseMimeType: "application/json" },
      });

      const result = await model.generateContent([
          { inlineData: { mimeType: "application/pdf", data: base64Data } },
          { text: PROMPT_IDP },
      ]);

      const idpResult = JSON.parse(result.response.text());

      // Salva o resultado no documento
      await snapshot.ref.update({
          idpResult: JSON.stringify(idpResult),
          status: "Enriquecimento Pendente",
      });

    } catch (error) {
      logger.error("Erro no IDP:", error);
      await snapshot.ref.update({ status: "Failed", error: "Falha na leitura do documento." });
    }
  }
);

// Trigger 2: Análise Jurídica Especializada (Vacation Analyst)
export const onProcessUpdated = onDocumentUpdated(
  "artifacts/{appId}/users/{userId}/intelligent_platform_docs/{docId}",
  async (event) => {
    const newData = event.data?.after.data();
    const previousData = event.data?.before.data();

    if (!newData || newData.status === previousData?.status) return;

    const docRef = event.data?.after.ref;

    // A. ENRIQUECIMENTO (Busca dados no Ergon)
    if (newData.status === "Enriquecimento Pendente") {
        const idpData = JSON.parse(newData.idpResult || "{}");
        const nomeAlvo = idpData.keyFields?.find((f: any) => f.field.includes("Nome"))?.value || "";
        
        const dadosRH = await mockErgonIntegration(nomeAlvo);
        
        await docRef!.update({
            enrichedData: JSON.stringify(dadosRH),
            status: "Validacao Pendente", // Pausa para humano confirmar se a extração + busca estão certas
        });
    }

    // B. RACIOCÍNIO (Onde a mágica das Férias acontece)
    if (newData.status === "Raciocinio Pendente") {
        const idpData = JSON.parse(newData.idpResult || "{}");
        const dadosRH = JSON.parse(newData.enrichedData || "{}");
        const diasSolicitados = parseInt(idpData.keyFields?.find((f: any) => f.field.includes("Dias"))?.value || "0");

        // 1. VALIDAÇÃO DETERMINÍSTICA (Hybrid AI)
        // Usa a categoria informada no upload OU a vinda do RH
        const userCategory = newData.userCategory || dadosRH.categoria || "ADMINISTRATIVO";
        
        // Regra Hardcoded (Lei 5.810/94 & PCCR)
        const limiteLegal = userCategory === "MAGISTERIO" ? 45 : 30;
        
        logger.info(`[REGRAS] Categoria: ${userCategory} | Limite Aplicado: ${limiteLegal} dias`);

        const promptAnalista = `
        ATUE COMO UM ANALISTA SÊNIOR DE RH DA SEDUC-PA.
        
        REGRA DETERMINÍSTICA APLICADA:
        O servidor pertence à categoria "${userCategory}".
        O limite MÁXIMO de férias permitido por lei para ele é de: **${limiteLegal} DIAS**.
        
        DADOS DO PEDIDO:
        - Servidor: ${dadosRH.nome || "Não identificado"}
        - Dias Solicitados: ${diasSolicitados}
        
        INSTRUÇÕES CRÍTICAS:
        1. Se "Dias Solicitados" (${diasSolicitados}) for MAIOR que o limite (${limiteLegal}), você DEVE REJEITAR IMEDIATAMENTE.
        2. Se for menor ou igual, analise se há outros impedimentos (ex: falta de período aquisitivo).
        3. Não tente reinterpretar a lei. Siga o limite de ${limiteLegal} dias estritamente.
        
        SAÍDA JSON:
        {
            "veredicto": {
                "status": "Aprovado" | "Rejeitado",
                "parecer": "Texto explicativo citando o limite de ${limiteLegal} dias."
            },
            "chainOfThought": "Seu raciocínio passo a passo."
        }
        `;

        const genAI = getGenAIClient();
        const model = genAI.getGenerativeModel({ 
            model: MODEL_NAME,
            generationConfig: { responseMimeType: "application/json" },
        });

        const result = await model.generateContent(promptAnalista);
        const responseText = result.response.text();
        const rarResult = JSON.parse(responseText);

        // 2. AUDITORIA DE DECISÕES
        await logAudit(db, {
            docId: event.params.docId,
            action: "AUTO_DECISION",
            prompt: promptAnalista,
            response: responseText,
            model: MODEL_NAME,
            decision: rarResult.veredicto?.status,
        });

        await docRef!.update({
            status: rarResult.veredicto?.status === "Aprovado" ? "Aprovado" : "Rejeitado",
            rarResult: responseText, // Salva como string JSON
        });
    }
  }
);

// Adicione/Atualize esta função mockada de RAG
// Em produção, isso consultaria o Pinecone ou Firestore Vector Search
async function retrieveLegalContext(query: string): Promise<string> {
    const queryLower = query.toLowerCase();
    
    // Simulação de "Knowledge Base" indexada
    let context = "";

    if (queryLower.includes("férias") || queryLower.includes("dias")) {
        context += `
        [LEI 5.810/94 - Art. 105] O servidor terá direito a 30 (trinta) dias de férias anuais.
        [PCCR EDUCAÇÃO - Art. 42] O ocupante do cargo de Professor fará jus a 45 (quarenta e cinco) dias de férias anuais, gozadas de acordo com o calendário escolar.
        `;
    }
    
    if (queryLower.includes("prêmio") || queryLower.includes("licença")) {
        context += `
        [LEI 5.810/94 - Art. 130] Após cada quinquênio de efetivo exercício, o servidor fará jus a 3 (três) meses de licença-prêmio.
        `;
    }

    return context || "Nenhuma legislação específica encontrada na base de conhecimento para este tópico.";
}

// Atualize a função Callable do Chat
export const callGeminiAgent = onCall({cors: true}, async (request) => {
  try {
    const genAI = getGenAIClient();
    const {content, systemInstruction, schema} = request.data; // content é a pergunta do usuário

    // 1. RAG STEP: Recupera legislação antes de responder
    const legalContext = await retrieveLegalContext(content);

    // 2. Prompt Enriquecido
    const augmentedPrompt = `
    CONTEXTO JURÍDICO RECUPERADO (LEGISLAÇÃO VIGENTE):
    ${legalContext}

    PERGUNTA DO USUÁRIO:
    ${content}

    INSTRUÇÃO:
    Responda à pergunta do usuário baseando-se ESTRITAMENTE no contexto jurídico fornecido acima. 
    Se a lei distinguir entre Professor e Administrativo, deixe isso claro.
    `;

    // ... Configuração do Modelo (mantenha o código existente de schema/generationConfig) ...
    interface GenerationConfig {
        responseMimeType?: "application/json" | "text/plain";
        responseSchema?: object;
    }
    const generationConfig: GenerationConfig = {};
    if (schema) { /* ... lógica do schema mantida ... */ }

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      // Se houver systemInstruction original, anexamos ela, senão usamos uma padrão jurídica
      systemInstruction: systemInstruction || "Você é um consultor jurídico da SEDUC-PA. Responda com base na Lei 5.810/94.",
      generationConfig: generationConfig,
    });

    const result = await model.generateContent(augmentedPrompt);
    const responseText = result.response.text();

    // ... (lógica de parsing JSON mantida) ...
    let data;
    try {
      data = (generationConfig.responseMimeType === "application/json") ? JSON.parse(responseText) : responseText;
    } catch {
      data = responseText;
    }

    return {data};
  } catch (error: unknown) {
    // ... (tratamento de erro mantido) ...
    const err = error as Error;
    logger.error("Erro crítico na função callGeminiAgent:", err);
    throw new HttpsError("internal", `Erro no processamento de IA: ${err.message}`);
  }
});