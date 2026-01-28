import { Loader2, ListChecks, Brain, CheckCircle, X, AlertTriangle, FileText, Upload } from 'lucide-vue-next';
import { z } from 'zod';
/**
 * Helper seguro para parsear JSON do Firestore.
 * Evita que a aplicação quebre se o JSON vier nulo ou mal formatado.
 */
export const safeParse = (jsonString) => {
  if (!jsonString) return null;
  try {
    // Se já for objeto, retorna ele mesmo. Se for string, faz o parse.
    return typeof jsonString === 'object' ? jsonString : JSON.parse(jsonString);
  } catch (e) {
    console.error("Erro ao parsear JSON:", e);
    return null;
  }
};

/**
 * Helper Visual para Status e Cores.
 * Centraliza a lógica de qual ícone e cor mostrar para cada etapa do processo.
 */
export const getStatusDisplay = (status) => {
  const statusMap = {
    'Uploaded': { 
        text: 'Upload Concluído', 
        color: 'text-indigo-400', 
        icon: Upload, 
        animate: '' 
    },
    'Processing IDP': { 
        text: 'Executando IDP...', 
        color: 'text-sky-400', 
        icon: Loader2, 
        animate: 'animate-spin' 
    },
    'Enriquecimento Pendente': { 
        text: 'Buscando Dados RH...', 
        color: 'text-purple-400', 
        icon: Loader2, 
        animate: 'animate-spin' 
    },
    'Validacao Pendente': { 
        text: 'Validação Humana', 
        color: 'text-orange-400', 
        icon: ListChecks, 
        animate: '' 
    },
    'Raciocinio Pendente': { 
        text: 'Agente Analisando...', 
        color: 'text-yellow-400', 
        icon: Brain, 
        animate: 'animate-spin' 
    },
    'Aprovado': { 
        text: 'Aprovado', 
        color: 'text-green-400', 
        icon: CheckCircle, 
        animate: '' 
    },
    'Rejeitado': { 
        text: 'Rejeitado', 
        color: 'text-red-400', 
        icon: X, 
        animate: '' 
    },
    'Failed': { 
        text: 'Falha', 
        color: 'text-red-400', 
        icon: AlertTriangle, 
        animate: '' 
    },
    'Finalizado': { // Fallback para status genérico de sucesso
        text: 'Finalizado', 
        color: 'text-green-400', 
        icon: CheckCircle, 
        animate: '' 
    }
  };

  // Retorna o status correspondente ou um padrão "Desconhecido"
  return statusMap[status] || { 
      text: 'Desconhecido', 
      color: 'text-gray-400', 
      icon: FileText, 
      animate: '' 
  };
};

