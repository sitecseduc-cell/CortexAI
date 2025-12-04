import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';
import { executeRAR } from './_lib/ruleEngine.js'; // Caminho corrigido para a função serverless

// Configuração para Vercel Serverless
export const config = {
  runtime: 'edge', // Opcional: usa Edge Functions para ser mais rápido (ou remova para Node padrão)
};

export default async function handler(req, res) {
  // 1. Configuração de CORS (Permite que seu front chame o back)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { fileBase64, userCategory, mimeType } = await req.json(); // Use req.json() para Edge runtime
    
    const apiKey = process.env.GEMINI_API_KEY; 
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!apiKey || !supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: "Variáveis de ambiente não configuradas no servidor." });
    }
    if (!fileBase64 || !userCategory || !mimeType) {
        return res.status(400).json({ error: "Dados incompletos: fileBase64, userCategory e mimeType são obrigatórios." });
    }

    // 2. Prompt do Especialista para EXTRAÇÃO DE DADOS (IDP)
    const prompt = `
      ATUE COMO UM ASSISTENTE DE OCR.
      Sua única tarefa é extrair os campos-chave do documento fornecido.
      
      TAREFA:
      Analise o documento (OCR). Extraia: Nome, Matrícula, Cargo, Dias Solicitados.
      Retorne estritamente JSON:
      {
        "keyFields": [
            {"field": "Nome", "value": "EXTRAIA_O_NOME_COMPLETO"},
            {"field": "Matrícula", "value": "EXTRAIA_A_MATRICULA"},
            {"field": "Cargo", "value": "EXTRAIA_O_CARGO"},
            {"field": "Dias", "value": "EXTRAIA_A_QUANTIDADE_DE_DIAS_SOLICITADOS"}
        ]
      }
    `;

    // 3. Chamada ao Gemini para IDP
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const idpResult = await model.generateContent([
      { inlineData: { mimeType: mimeType, data: fileBase64 } },
      { text: prompt }
    ]);

    const idpResponseText = idpResult.response.text();
    const idpJsonStr = idpResponseText.replace(/```json|```/g, "").trim();
    const idpData = JSON.parse(idpJsonStr);
    idpData.categoria_usuario = userCategory; // Adiciona a categoria para o motor de regras

    // 4. Buscar Regras do Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: rules, error: rulesError } = await supabase.from('regras').select('*');
    if (rulesError) throw rulesError;

    // 5. Executar Motor de Regras (RAR)
    const veredicto = executeRAR(idpData, rules);

    // 6. Montar Resposta Final
    const finalResponse = { ...idpData, veredicto };
    
    return res.status(200).json(finalResponse);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro interno no processamento da IA" });
  }
}