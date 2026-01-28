// src/utils/helpers.js

import { z } from 'zod'; // Certifique-se que o zod está instalado

/**
 * Tenta fazer o parse de uma string JSON.
 * Retorna o objeto se for válido, ou null se falhar.
 */
export const safeParse = (jsonString) => {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Erro ao fazer parse do JSON:", e);
    return null;
  }
};

// ... (o resto do seu código helpers existente)// src/utils/priorityHelpers.js

export const PRIORITY_TYPES = {
  'LICENCA_SAUDE': 3,    // Alta prioridade (Vermelho)
  'MATERNIDADE': 3,      // Alta prioridade (Vermelho)
  'FERIAS': 1,           // Baixa prioridade (Cinza)
  'APOSENTADORIA': 2     // Média prioridade (Amarelo)
};

export const getPriorityConfig = (processType) => {
  // Se não tiver tipo definido, assume prioridade baixa (1)
  const level = PRIORITY_TYPES[processType] || 1;
  
  if (level === 3) {
    return { 
      label: 'URGENTE', 
      class: 'border-l-4 border-red-500 bg-red-50', 
      icon: 'AlertTriangle' 
    };
  }
  if (level === 2) {
    return { 
      label: 'ATENÇÃO', 
      class: 'border-l-4 border-yellow-500 bg-yellow-50', 
      icon: 'Clock' 
    };
  }
  return { 
    label: 'NORMAL', 
    class: 'border-l-4 border-gray-300', 
    icon: 'FileText' 
  };
};

export const sortDocumentsByPriority = (docs) => {
  if (!docs) return [];
  return docs.sort((a, b) => {
    const prioA = PRIORITY_TYPES[a.type] || 1;
    const prioB = PRIORITY_TYPES[b.type] || 1;

    if (prioB !== prioA) return prioB - prioA;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
};