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
 * Recupera contexto jurídico específico para FÉRIAS.
 * @param {string} query Pergunta do usuário.
 * @return {Promise<string>} Contexto relevante.
 */
async function retrieveLegalContext(query: string): Promise<string> {
  // Contexto fixo e especializado para o Analista de Férias
  return `
    [LEI 5.810/94 - RJU PA]
    Art. 105: O servidor terá direito a 30 (trinta) dias consecutivos de férias por ano.
    Art. 106: É proibida a acumulação de férias, salvo por imperiosa necessidade de serviço e no máximo por 2 períodos.
    
    [PCCR EDUCAÇÃO - Lei 7.442/10]
    Art. 42: O ocupante do cargo de Professor fará jus a 45 (quarenta e cinco) dias de férias anuais.
    §1º: O gozo das férias obedecerá ao calendário escolar.
  `;
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
      Você é um especialista em processar requerimentos de FÉRIAS.
      Analise o documento.
      Extraia estritamente:
      - "Nome" (Nome completo do servidor)
      - "Matrícula"
      - "Cargo"
      - "Dias" (Quantidade numérica de dias solicitados, ex: 30, 45)
      - "Exercício" (Ano de referência, ex: 2024)
      - "Inicio" (Data de início das férias)
      
      Saída JSON: { keyFields: [{field, value}] }
      `;

      const result = await model.generateContent([
        {inlineData: {mimeType: "application/pdf", data: base64Data}},
        {text: prompt},
      ]);

      const idpResult = JSON.parse(result.response.text());

      await snapshot.ref.update({
        idpResult: JSON.stringify(idpResult),
        status: "Validacao Pendente",
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
    secrets: [geminiKey],
  },
  async (event) => {
    const newData = event.data?.after.data();
    const previousData = event.data?.before.data();
    if (!newData || newData.status === previousData?.status) return;

    const docRef = event.data?.after.ref;
    if (!docRef) return;

    // Raciocínio (Férias)
    // Este estágio ocorre APÓS o usuário validar/corrigir os dados na interface
    if (newData.status === "Raciocinio Pendente") {
      const idpData = JSON.parse(newData.idpResult || "{}");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const findVal = (k: string) => idpData.keyFields?.find(
        (f: any) => f.field.includes(k)
      )?.value;

      const diasSolicitados = parseInt(findVal("Dias") || "0");
      const nomeServidor = findVal("Nome") || "Não identificado";

      // Validação Determinística baseada na seleção do usuário no Upload
      const userCategory = newData.userCategory || "ADMINISTRATIVO";
      const limite = userCategory === "MAGISTERIO" ? 45 : 30;

      const prompt = `
      ATUE COMO ANALISTA DE FÉRIAS DA SEDUC-PA.
      
      DADOS DO PEDIDO (VALIDADOS):
      - Servidor: ${nomeServidor}
      - Categoria: ${userCategory}
      - Dias Solicitados: ${diasSolicitados}
      
      REGRA RÍGIDA (LEI 5.810/94 e PCCR):
      - O limite legal para ${userCategory} é de ${limite} DIAS.
      
      INSTRUÇÃO:
      1. Verifique se ${diasSolicitados} <= ${limite}.
      2. Se MAIOR, REJEITE. Motivo: "Excede o limite legal de ${limite} dias para o cargo."
      3. Se MENOR ou IGUAL, APROVE. Motivo: "Dentro do limite legal."
      
      Saída JSON: { veredicto: { status: "Aprovado" | "Rejeitado", parecer: "string" }, chainOfThought: "string" }
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
      CONTEXTO DE FÉRIAS (LEGISLAÇÃO): ${legalContext}
      DÚVIDA DO SERVIDOR: ${content}
      Responda focando exclusivamente em regras de férias.
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
    Gere uma minuta de PORTARIA DE FÉRIAS formal para o Diário Oficial.
    `;

    const result = await model.generateContent(prompt);
    return {response: result.response.text()};
  }
);