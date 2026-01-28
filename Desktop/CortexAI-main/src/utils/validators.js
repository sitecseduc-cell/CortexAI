import { z } from 'zod';

// Schema para o resultado do IDP (Exemplo)
export const IDPResultSchema = z.object({
    documentType: z.string(),
    keyFields: z.array(z.object({
        field: z.string(),
        value: z.union([z.string(), z.number(), z.null()]),
        confidence: z.number().optional()
    }))
});

export const validateIDPData = (data) => {
    const result = IDPResultSchema.safeParse(data);
    if (!result.success) {
        console.error("Erro de validação Zod:", result.error);
        return null; // Ou trate o erro
    }
    return result.data;
};