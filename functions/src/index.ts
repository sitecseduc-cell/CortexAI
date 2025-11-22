import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

const API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// --- 1. PROMPTS & CONFIG ---
const MODEL_NAME = "gemini-1.5-flash";

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
  Saída OBRIGATÓRIA: JSON com chaves 'veredicto' (status, parecer) e 'chainOfThought'.`
};

// --- 2. FUNÇÕES AUXILIARES ---
async function mockErgonIntegration(nome: string) {
    // Em produção: axios.get(ERGON_API + nome)
    logger.info(`Consultando Ergon para: ${nome}`);
    const dbMock = [
        { nome: "MARIA", cargo: "Professor Classe I", matricula: "55221-9", tempo_servico_em_anos: 12, lotacao: "Escola A" },
        { nome: "JOAO", cargo: "Técnico Administrativo", matricula: "11234-1", tempo_servico_em_anos: 2, lotacao: "Seduc Sede" }
    ];
    return dbMock.find(s => nome.toUpperCase().includes(s.nome)) || null;
}

// --- 3. TRIGGERS (O CORAÇÃO DO AGENTE AUTÔNOMO) ---

// Gatilho 1: Assim que um documento é criado -> Inicia IDP
export const onProcessCreated = onDocumentCreated(
  "artifacts/{appId}/users/{userId}/intelligent_platform_docs/{docId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    
    const data = snapshot.data();
    if (data.status !== 'Uploaded') return; // Evita loops

    logger.info(`[AGENTE] Iniciando IDP para doc: ${event.params.docId}`);
    
    try {
        // Atualiza status para dar feedback na UI
        await snapshot.ref.update({ status: 'Processing IDP' });

        const model = genAI.getGenerativeModel({ model: MODEL_NAME, systemInstruction: PROMPTS.IDP });
        const result = await model.generateContent(data.content);
        const responseText = result.response.text();
        
        // Limpeza básica de JSON markdown ```json ... ```
        const jsonStr = responseText.replace(/```json|```/g, '').trim();
        const idpResult = JSON.parse(jsonStr);

        // Avança para o próximo estágio
        await snapshot.ref.update({
            status: 'Enriquecimento Pendente',
            idpResult: JSON.stringify(idpResult)
        });

    } catch (error) {
        logger.error("Erro no IDP:", error);
        await snapshot.ref.update({ status: 'Failed', error: 'Erro na análise do documento.' });
    }
});

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
        if (newData.status === 'Enriquecimento Pendente') {
            logger.info(`[AGENTE] Iniciando Enriquecimento...`);
            try {
                const idpData = JSON.parse(newData.idpResult || '{}');
                // Tenta achar o nome nos campos extraídos
                const nomeField = idpData.keyFields?.find((f: any) => f.field.toLowerCase().includes('nome') || f.field.includes('Interessado'));
                const nome = nomeField ? nomeField.value : "";

                const servidorData = await mockErgonIntegration(nome);
                
                await docRef.update({
                    status: 'Validacao Pendente', // Pausa para o humano confirmar
                    enrichedData: JSON.stringify(servidorData || {})
                });
            } catch (e) {
                logger.error("Erro Enriquecimento", e);
                // Mesmo com erro, avança para validação humana para correção manual
                await docRef.update({ status: 'Validacao Pendente', enrichedData: '{}' });
            }
        }

        // ESTÁGIO: Raciocínio (Após humano validar e mudar status para 'Raciocinio Pendente')
        if (newData.status === 'Raciocinio Pendente') {
            logger.info(`[AGENTE] Iniciando Raciocínio Legal (RAR)...`);
            try {
                // Busca as regras do usuário
                const userId = event.params.userId;
                const appId = event.params.appId;
                const rulesSnap = await db.collection(`artifacts/${appId}/users/${userId}/rules`).where('status', '==', 'Ativa').get();
                
                const activeRules = rulesSnap.docs.map(d => {
                    const r = d.data();
                    return `- ${r.nome}: SE ${JSON.stringify(r.condicoes)} ENTÃO ${JSON.stringify(r.acao_se_verdadeiro)}`;
                }).join('\n');

                const prompt = `
                DADOS EXTRAÍDOS: ${newData.idpResult}
                DADOS RH (ERGON): ${newData.enrichedData}
                REGRAS VIGENTES:
                ${activeRules}
                `;

                const model = genAI.getGenerativeModel({ model: MODEL_NAME, systemInstruction: PROMPTS.RAR });
                const result = await model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                });

                const rarResult = JSON.parse(result.response.text());
                
                await docRef.update({
                    status: rarResult.veredicto?.status === 'Aprovado' ? 'Aprovado' : 'Rejeitado',
                    rarResult: JSON.stringify(rarResult)
                });

            } catch (e) {
                logger.error("Erro RAR", e);
                await docRef.update({ status: 'Failed', error: 'Erro no raciocínio jurídico.' });
            }
        }
    }
);

// --- 4. CALLABLES (Para chamadas diretas da UI, ex: Chat e Portaria) ---

export const generateDraft = onCall({ cors: true }, async (request) => {
    const { context, veredicto } = request.data;
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    const prompt = `
    Atue como Redator Oficial do Estado.
    Contexto: ${JSON.stringify(context)}
    Decisão: ${JSON.stringify(veredicto)}
    Tarefa: Escreva a minuta da Portaria de concessão/indeferimento. Use linguagem formal, "O Secretário de Estado...", "Resolve...".
    Retorne apenas o texto da portaria.
    `;

    const result = await model.generateContent(prompt);
    return { response: result.response.text() };
});

// (Mantenha o chatJuridico existente se desejar, ou melhore com RAG futuramente)
// ... (mantenha todo o código anterior)

// Adicione isto no final do arquivo index.ts:

export const callGeminiAgent = onCall({ cors: true }, async (request) => {
    const { content, systemInstruction, schema } = request.data;

    // Configura o modelo (suporta JSON Schema se fornecido)
    const generationConfig: any = {};
    if (schema) {
        try {
            generationConfig.responseMimeType = "application/json";
            generationConfig.responseSchema = JSON.parse(schema);
        } catch (e) {
            logger.warn("Schema inválido fornecido, ignorando validação estrita.", e);
        }
    }

    const model = genAI.getGenerativeModel({ 
        model: MODEL_NAME,
        systemInstruction: systemInstruction,
        generationConfig: generationConfig
    });

    try {
        const result = await model.generateContent(content);
        const responseText = result.response.text();
        
        // Retorna no formato { data: ... } para casar com o geminiService.js
        // O frontend espera result.data.data
        return { 
            data: schema ? JSON.parse(responseText) : responseText 
        };
    } catch (error) {
        logger.error("Erro na chamada direta do Gemini:", error);
        throw new HttpsError('internal', 'Erro ao processar solicitação com IA.');
    }
});