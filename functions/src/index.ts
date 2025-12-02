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
import {GoogleGenerativeAI} from "@google/generative-ai";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

// NÃO inicialize o cliente globalmente com process.env, pois pode falhar no deploy
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); <--- REMOVIDO

// --- 1. PROMPTS & CONFIG ---
const MODEL_NAME = "gemini-1.5-flash";

interface GenerationConfig {
    responseMimeType?: "application/json" | "text/plain";
    responseSchema?: object;
}

const PROMPTS = {
  IDP: `Você é um motor IDP (Intelligent Document Processing) para o governo.
  Analise o texto OCR fornecido.
  Identifique o tipo documental.
  Extraia: Nome completo, Matrícula, Cargo, Datas relevantes, CIDs (se houver).
  Saída OBRIGATÓRIA: JSON com chaves 'documentType', 'keyFields' (array de objetos field/value), e 'summary'.`,

  RAR: `Você é um Analista de RH Público (Lei 5.810/94).
  Com base nos DADOS DO DOCUMENTO, DADOS DO SERVIDOR e REGRAS:
  1. Verifique cada regra.
  2. Emita um veredito final (Aprovado/Rejeitado).
  3. Gere um 'chainOfThought' explicando seu raciocínio passo a passo.
  Saída OBRIGATÓRIA: JSON com chaves 'veredicto' (status, parecer) e 'chainOfThought'.`,
};

// --- 2. FUNÇÕES AUXILIARES ---

// Helper para obter cliente seguro
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("A chave de API do Gemini (GEMINI_API_KEY) não está configurada no ambiente.");
  }
  return new GoogleGenerativeAI(apiKey);
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
async function mockErgonIntegration(termoBusca: string): Promise<any> {
  logger.info(`[ERGON] Buscando dados para: ${termoBusca}`);
  if (!termoBusca) return null;

  const termoUpper = termoBusca.toUpperCase().trim();
  
  // Banco de dados Mockado
  const dbMock = [
    { nome: "MARIA OLIVEIRA", cargo: "Professor Classe I", matricula: "55221-9", tempo_servico_em_anos: 12, lotacao: "Escola A", status_funcional: "Ativo" },
    { nome: "JOAO SILVA", cargo: "Técnico Administrativo", matricula: "11234-1", tempo_servico_em_anos: 2, lotacao: "Seduc Sede", status_funcional: "Estágio Probatório" },
    { nome: "CARLOS SOUZA", cargo: "Motorista", matricula: "99887-2", tempo_servico_em_anos: 25, lotacao: "Transporte", status_funcional: "Ativo" }
  ];

  // Busca simples (pode ser melhorada com fuzzy match se necessário)
  return dbMock.find(s => termoUpper.includes(s.nome)) || 
         dbMock.find(s => s.matricula === termoUpper) ||
         { erro: "Servidor não encontrado na base RH", tempo_servico_em_anos: 0 };
}

// --- 3. TRIGGERS (O CORAÇÃO DO AGENTE AUTÔNOMO) ---

// Função auxiliar extraída para reuso
async function realizarEnriquecimento(newData: any, docRef: any) {
    const idpData = JSON.parse(newData.idpResult || "{}");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nomeField = idpData.keyFields?.find((f: any) => f.field.toLowerCase().includes("nome") || f.field.toLowerCase().includes("interessado"));
    const nome = nomeField ? nomeField.value : "";
    
    const dados = await mockErgonIntegration(nome);
    
    await docRef.update({
        status: "Validacao Pendente",
        enrichedData: JSON.stringify(dados || {})
    });
}

// Gatilho 1: Assim que um documento é criado -> Inicia IDP
export const onProcessCreated = onDocumentCreated(
  "artifacts/{appId}/users/{userId}/intelligent_platform_docs/{docId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    if (data.status !== "Uploaded") return; // Evita loops

    logger.info(`[AGENTE] Iniciando IDP para doc: ${event.params.docId}`);

    try {
      // Atualiza status para dar feedback na UI
      await snapshot.ref.update({status: "Processing IDP"});
      
      // 1. Baixar o arquivo do Storage
      logger.info(`[AGENTE] Baixando arquivo para IDP: ${data.fileUrl}`);
      const response = await fetch(data.fileUrl);
      if (!response.ok) {
        throw new Error(`Falha ao baixar o arquivo: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString("base64");
      
      const genAI = getGenAIClient();
      // 2. Enviar para Gemini (Multimodal)
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const result = await model.generateContent([
          {
            inlineData: {
              mimeType: "application/pdf", // TODO: Detectar dinamicamente se necessário
              data: base64Data
            }
          },
          { text: PROMPTS.IDP }
      ]);
      const responseText = result.response.text();
      
      // Limpeza básica de JSON markdown ```json ... ```
      const jsonStr = responseText.replace(/```json|```/g, "").trim();
      const idpResult = JSON.parse(jsonStr);

      // Salva o resultado no documento
      await snapshot.ref.update({
          idpResult: JSON.stringify(idpResult),
          status: "Enriquecimento Pendente"
      });

    } catch (error) {
      logger.error("Erro no IDP:", error);
      await snapshot.ref.update({
        status: "Failed",
        error: "Erro na análise do documento.",
      });
    }
  }
);

// Gatilho 2: Orquestrador de Mudanças de Estado
export const onProcessUpdated = onDocumentUpdated(
  "artifacts/{appId}/users/{userId}/intelligent_platform_docs/{docId}",
  async (event) => {
    const newData = event.data?.after.data();
    const previousData = event.data?.before.data();

    if (!newData || newData.status === previousData?.status) return;

    const docRef = event.data?.after.ref;
    if (!docRef) return;

    // ESTÁGIO: Enriquecimento (Busca dados no RH)
    if (newData.status === "Enriquecimento Pendente") {
      try {
        logger.info(`[AGENTE] Iniciando Enriquecimento...`);
        await realizarEnriquecimento(newData, docRef);
      } catch (e) {
        logger.error("Erro Enriquecimento", e);
        // Mesmo com erro, avança para validação humana para correção manual
        await docRef.update({
          status: "Validacao Pendente",
          enrichedData: "{}",
        }); // Fallback: Avança mesmo sem dados para não travar o fluxo
      }
    }

    // ESTÁGIO: Raciocínio (Após humano validar e mudar status para 'Raciocinio Pendente')
    if (newData.status === "Raciocinio Pendente") {
      logger.info(`[AGENTE] Iniciando Raciocínio Legal (RAR)...`);
      try {
        // A. GARANTIA DE DADOS (Self-Healing)
        // Se entrou manualmente, pode não ter dados de RH (enrichedData). Vamos buscar agora.
        let dadosRH = newData.enrichedData;
        
        if (!dadosRH || Object.keys(JSON.parse(dadosRH || "{}")).length === 0 || JSON.parse(dadosRH).erro) {
            logger.warn("[AGENTE] Dados de RH ausentes ou com erro. Tentando buscar antes da análise...");
            const idpData = JSON.parse(newData.idpResult || "{}");
            // Tenta achar o nome em qualquer campo se não tiver estruturado
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const nomeAlvo = idpData.keyFields?.find((f:any) => f.value && f.value.length > 3)?.value || "Desconhecido";
            const resultadoBusca = await mockErgonIntegration(nomeAlvo);
            dadosRH = JSON.stringify(resultadoBusca);
            
            // Salva para persistência
            await docRef.update({ enrichedData: dadosRH });
        }

        // Busca as regras do usuário
        const userId = event.params.userId;
        const appId = event.params.appId;
        const rulesSnap = await db
          .collection(`artifacts/${appId}/users/${userId}/rules`)
          .where("status", "==", "Ativa")
          .get();
        const activeRules = rulesSnap.docs
          .map((d) => {
            const r = d.data();
            return `- ${r.nome}: ${JSON.stringify(r.condicoes)}`;
          })
          .join("\n");

        const prompt = `
          CONTEXTO DO PROCESSO:
          - Documento (Extração): ${newData.idpResult}
          - Dados Funcionais (RH): ${dadosRH}
          - Regras de Negócio Ativas:
          ${activeRules || "Usar regras gerais da Lei 5.810/94"}

          TAREFA:
          Avalie se o servidor tem direito ao solicitado.
          Considere o tempo de serviço e status funcional.
        `;
        
        const genAI = getGenAIClient();
        const model = genAI.getGenerativeModel({
          model: MODEL_NAME,
          systemInstruction: PROMPTS.RAR,
          generationConfig: {responseMimeType: "application/json"},
        });
        const result = await model.generateContent(prompt);
        const rarResult = JSON.parse(result.response.text());

        await docRef.update({
          status: rarResult.veredicto?.status === "Aprovado" ? "Aprovado" : "Rejeitado",
          rarResult: JSON.stringify(rarResult),
        });
      } catch (e) {
        logger.error("Erro RAR", e);
        await docRef.update({
          status: "Failed", 
          error: "Falha na análise inteligente. Verifique os logs." 
        });
      } // Ou criar status "Pendência"
    }
  }
);

// --- 4. CALLABLES (Para chamadas diretas da UI, ex: Chat e Portaria) ---

export const generateDraft = onCall({cors: true}, async (request) => {
  const {context, veredicto} = request.data;
  const genAI = getGenAIClient();
  const model = genAI.getGenerativeModel({model: MODEL_NAME});

  const prompt = `
    Atue como Redator Oficial do Estado.
    Contexto: ${JSON.stringify(context)}
    Decisão: ${JSON.stringify(veredicto)}
    Tarefa: Escreva a minuta da Portaria de concessão/indeferimento. Use linguagem formal, "O Secretário de Estado...", "Resolve...".
    Retorne apenas o texto da portaria.
    `;

  const result = await model.generateContent(prompt); // Use o prompt diretamente
  return {response: result.response.text()};
});

export const callGeminiAgent = onCall({cors: true}, async (request) => {
  try {
    const genAI = getGenAIClient(); // Inicializa aqui dentro
    const {content, systemInstruction, schema} = request.data;

    // Configuração defensiva do Schema
    const generationConfig: GenerationConfig = {};
    if (schema) {
      try {
        // Garante que é um objeto JSON válido se veio como string
        const schemaObj = typeof schema === "string" ? JSON.parse(schema) : schema;
        generationConfig.responseMimeType = "application/json";
        generationConfig.responseSchema = schemaObj;
      } catch (e) {
        logger.warn("Schema inválido recebido, ignorando validação estruturada:", e);
      }
    }

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: systemInstruction,
      generationConfig: generationConfig,
    });

    const result = await model.generateContent(content);
    const responseText = result.response.text();

    // Tenta parsear se for JSON esperado, senão retorna texto
    let data;
    try {
      data = (generationConfig.responseMimeType === "application/json") ? JSON.parse(responseText) : responseText;
    } catch {
      data = responseText;
    }

    return {data};
  } catch (error: unknown) {
    const err = error as Error;
    logger.error("Erro crítico na função callGeminiAgent:", err);
    // Retorna erro estruturado para o frontend não receber apenas "Internal Error"
    throw new HttpsError("internal", `Erro no processamento de IA: ${err.message}`);
  }
});