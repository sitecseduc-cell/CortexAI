/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import {defineSecret} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import {GoogleGenerativeAI} from "@google/generative-ai";
import {initializeApp} from "firebase-admin/app";
import {getFirestore, Firestore} from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

// --- SEGREDOS ---
const ergonUrl = defineSecret("ERGON_API_URL");
const ergonUser = defineSecret("ERGON_USER");
const ergonPass = defineSecret("ERGON_PASSWORD");
const geminiKey = defineSecret("GEMINI_API_KEY");

const MODEL_NAME = "gemini-1.5-flash";

// --- HELPERS ---

/**
 * Obtém o cliente Gemini autenticado.
 * @return {GoogleGenerativeAI} Cliente Gemini.
 */
function getGenAIClient(): GoogleGenerativeAI {
  return new GoogleGenerativeAI(geminiKey.value());
}

/**
 * Registra auditoria no Firestore.
 * @param {Firestore} dbInstance Instância do Firestore.
 * @param {object} data Dados para logar.
 */
async function logAudit(dbInstance: Firestore, data: any) {
  await dbInstance.collection("audit_logs").add({
    ...data,
    timestamp: new Date(),
  });
  logger.info(`[AUDIT] Decisão para ${data.docId}: ${data.decision}`);
}

/**
 * Simula recuperação de contexto jurídico (RAG).
 * @param {string} query Pergunta do usuário.
 * @return {Promise<string>} Contexto relevante.
 */
async function retrieveLegalContext(query: string): Promise<string> {
  const q = query.toLowerCase();
  let context = "";

  if (q.includes("férias") || q.includes("dias")) {
    context += `
    [LEI 5.810/94 - Art. 105] O servidor terá direito a 30 dias de férias.
    [PCCR EDUCAÇÃO] Professor: 45 dias anuais (conforme calendário).
    `;
  }

  if (q.includes("prêmio") || q.includes("licença")) {
    context += `
    [LEI 5.810/94] Após cada quinquênio, 3 meses de licença-prêmio.
    `;
  }

  return context || "Nenhuma legislação específica encontrada.";
}

/**
 * Integração real com a API do Ergon.
 * @param {string} termoBusca Nome ou matrícula.
 * @return {Promise<any>} Dados do servidor ou objeto de erro.
 */
async function realErgonIntegration(termoBusca: string): Promise<any> {
  logger.info(`[ERGON] Buscando: ${termoBusca}`);
  if (!termoBusca) return {erro: "Termo inválido"};

  const url = ergonUrl.value();
  const user = ergonUser.value();
  const pass = ergonPass.value();
  const auth = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");

  try {
    const response = await fetch(
      `${url}/servidores?nome=${encodeURIComponent(termoBusca)}`,
      {
        method: "GET",
        headers: {
          "Authorization": auth,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      return {erro: `Erro HTTP Ergon: ${response.status}`};
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const s = data[0];
      const cargo = s.CARGO_DESCRICAO || "";
      const isProf = cargo.toUpperCase().includes("PROFESSOR");

      return {
        nome: s.NOME_COMPLETO,
        cargo: cargo,
        categoria: s.CATEGORIA || (isProf ? "MAGISTERIO" : "ADMINISTRATIVO"),
        matricula: s.MATRICULA,
        tempo_servico_anos: s.TEMPO_SERVICO_ANOS || 0,
        lotacao: s.LOTACAO_ATUAL,
        status_funcional: s.SITUACAO_FUNCIONAL,
      };
    }
    return {erro: "Servidor não encontrado."};
  } catch (error) {
    logger.error("[ERGON] Falha:", error);
    return {erro: "Falha de conexão com RH."};
  }
}

// --- TRIGGERS ---

export const onProcessCreated = onDocumentCreated(
  {
    document:
      "artifacts/{appId}/users/{userId}/intelligent_platform_docs/{docId}",
    secrets: [geminiKey],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot || snapshot.data().status !== "Uploaded") return;

    try {
      await snapshot.ref.update({status: "Processing IDP"});
      const data = snapshot.data();

      const response = await fetch(data.fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString("base64");

      const genAI = getGenAIClient();
      const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: {responseMimeType: "application/json"},
      });

      const prompt = `
      Analise o documento.
      Extraia: Tipo, Nome, Matrícula, Cargo, Dias Solicitados.
      Saída JSON: { keyFields: [{field, value}] }
      `;

      const result = await model.generateContent([
        {inlineData: {mimeType: "application/pdf", data: base64Data}},
        {text: prompt},
      ]);

      const idpResult = JSON.parse(result.response.text());

      await snapshot.ref.update({
        idpResult: JSON.stringify(idpResult),
        status: "Enriquecimento Pendente",
      });
    } catch (error) {
      logger.error("Erro IDP:", error);
      await snapshot.ref.update({status: "Failed"});
    }
  }
);

export const onProcessUpdated = onDocumentUpdated(
  {
    document:
      "artifacts/{appId}/users/{userId}/intelligent_platform_docs/{docId}",
    secrets: [ergonUrl, ergonUser, ergonPass, geminiKey],
  },
  async (event) => {
    const newData = event.data?.after.data();
    const previousData = event.data?.before.data();
    if (!newData || newData.status === previousData?.status) return;

    const docRef = event.data?.after.ref;
    if (!docRef) return;

    // A. Enriquecimento
    if (newData.status === "Enriquecimento Pendente") {
      const idpData = JSON.parse(newData.idpResult || "{}");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const findField = (k: string) => idpData.keyFields?.find(
        (f: any) => f.field.includes(k)
      )?.value;

      const termo = findField("Matrícula") || findField("Nome") || "";
      const dadosRH = await realErgonIntegration(termo);

      await docRef.update({
        enrichedData: JSON.stringify(dadosRH),
        status: "Validacao Pendente",
      });
    }

    // B. Raciocínio (Férias)
    if (newData.status === "Raciocinio Pendente") {
      const idpData = JSON.parse(newData.idpResult || "{}");
      const dadosRH = JSON.parse(newData.enrichedData || "{}");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const findVal = (k: string) => idpData.keyFields?.find(
        (f: any) => f.field.includes(k)
      )?.value;

      const diasSolicitados = parseInt(findVal("Dias") || "0");
      const userCategory = newData.userCategory ||
                           dadosRH.categoria ||
                           "ADMINISTRATIVO";

      // Regra Determinística
      const limite = userCategory === "MAGISTERIO" ? 45 : 30;

      const prompt = `
      ATUE COMO ANALISTA DE RH.
      Categoria: "${userCategory}". Limite Legal: ${limite} DIAS.
      Pedido: ${diasSolicitados} dias.
      
      REGRA:
      - Se dias > ${limite}: REJEITAR.
      - Se dias <= ${limite}: APROVAR (salvo outro impedimento).
      
      Saída JSON: { veredicto: { status, parecer }, chainOfThought }
      `;

      const genAI = getGenAIClient();
      const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: {responseMimeType: "application/json"},
      });

      const result = await model.generateContent(prompt);
      const rarResult = JSON.parse(result.response.text());

      // Auditoria
      await logAudit(db, {
        docId: event.params.docId,
        action: "AUTO_DECISION",
        prompt: prompt,
        response: result.response.text(),
        decision: rarResult.veredicto?.status,
      });

      await docRef.update({
        status: rarResult.veredicto?.status === "Aprovado" ?
          "Aprovado" : "Rejeitado",
        rarResult: JSON.stringify(rarResult),
      });
    }
  }
);

// --- CALLABLES ---

export const callGeminiAgent = onCall(
  {cors: true, secrets: [geminiKey]},
  async (request) => {
    try {
      const genAI = getGenAIClient();
      const {content} = request.data;

      const legalContext = await retrieveLegalContext(content);

      const augmentedPrompt = `
      CONTEXTO JURÍDICO: ${legalContext}
      PERGUNTA: ${content}
      Responda com base na lei acima.
      `;

      const model = genAI.getGenerativeModel({model: MODEL_NAME});
      const result = await model.generateContent(augmentedPrompt);

      return {data: result.response.text()};
    } catch (error) {
      const err = error as Error;
      logger.error("Erro Chat:", err);
      throw new HttpsError("internal", err.message);
    }
  }
);

export const generateDraft = onCall(
  {cors: true, secrets: [geminiKey]},
  async (request) => {
    const {context, veredicto} = request.data;
    const genAI = getGenAIClient();
    const model = genAI.getGenerativeModel({model: MODEL_NAME});

    const prompt = `
    Contexto: ${JSON.stringify(context)}
    Decisão: ${JSON.stringify(veredicto)}
    Gere uma minuta de portaria formal.
    `;

    const result = await model.generateContent(prompt);
    return {response: result.response.text()};
  }
);