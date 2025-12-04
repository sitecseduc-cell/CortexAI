import { GoogleGenerativeAI } from "@google/generative-ai";

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
    const { fileBase64, userCategory } = req.body;
    
    // A chave deve estar configurada nas variáveis de ambiente da Vercel
    const apiKey = process.env.GEMINI_API_KEY; 
    
    if (!apiKey) {
        return res.status(500).json({ error: "Chave API não configurada no servidor." });
    }

    // 2. Lógica Determinística (A mesma que criamos antes)
    const limite = userCategory === 'MAGISTERIO' ? 45 : 30;

    // 3. Prompt do Especialista
    const prompt = `
      ATUE COMO ANALISTA DE FÉRIAS DA SEDUC-PA.
      
      DADOS:
      - Categoria: ${userCategory}
      - Limite Legal: ${limite} DIAS
      
      TAREFA:
      Analise o documento (OCR). Extraia: Nome, Matrícula, Cargo, Dias Solicitados.
      
      REGRA:
      - Se "Dias Solicitados" > ${limite} -> REJEITAR.
      - Se "Dias Solicitados" <= ${limite} -> APROVAR.
      
      Retorne estritamente JSON:
      {
        "keyFields": [
            {"field": "Nome", "value": "..."},
            {"field": "Dias", "value": "..."}
        ],
        "veredicto": {
            "status": "Aprovado" ou "Rejeitado",
            "parecer": "Texto curto justificando com base no limite de ${limite} dias."
        }
      }
    `;

    // 4. Chamada ao Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      { inlineData: { mimeType: "application/pdf", data: fileBase64 } },
      { text: prompt }
    ]);

    const responseText = result.response.text();
    
    // Limpeza de Markdown json se houver
    const jsonStr = responseText.replace(/```json|```/g, "").trim();
    
    return res.status(200).json(JSON.parse(jsonStr));

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro interno no processamento da IA" });
  }
}