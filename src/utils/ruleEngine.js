/**
 * Executa o motor de regras (RAR - Rules as Reasoning) sobre os dados extraídos.
 * @param {object} idpData - O objeto com os dados extraídos pela IA (resultado_ia).
 * @param {Array} rules - A lista de regras de negócio vindas do banco de dados.
 * @returns {object} - Um objeto contendo o veredito final e o parecer.
 */
export function executeRAR(idpData, rules) {
  if (!idpData || !rules) {
    return {
      status: 'FALHA',
      parecer: 'Dados de entrada ou regras ausentes para a análise.'
    };
  }

  // Helper para buscar campos extraídos pela IA de forma segura.
  const getField = (fieldName) => {
    const field = idpData.keyFields?.find(f => f.field.toLowerCase().includes(fieldName.toLowerCase()));
    return field?.value || null;
  };

  // Coleta os fatos a partir dos dados da IA.
  const fatos = {
    dias_solicitados: parseInt(getField('dias'), 10) || 0,
    categoria_usuario: idpData.categoria_usuario || 'ADMINISTRATIVO',
    // Adicione outros fatos conforme necessário (ex: tempo_servico, cargo, etc.)
  };

  let parecerFinal = 'Análise concluída sem objeções.';
  let statusFinal = 'Aprovado';

  // Itera sobre as regras ativas.
  rules.filter(r => r.status === 'Ativa').forEach(rule => {
    // Verifica se TODAS as condições da regra são verdadeiras.
    const isRuleTriggered = rule.condicoes.every(cond => {
      const fatoValor = fatos[cond.fato];
      if (fatoValor === undefined) return false; // Fato não encontrado, condição não pode ser atendida.

      switch (cond.operador) {
        case '>': return fatoValor > cond.valor;
        case '<': return fatoValor < cond.valor;
        case '>=': return fatoValor >= cond.valor;
        case '<=': return fatoValor <= cond.valor;
        case '==': return fatoValor == cond.valor;
        case '!=': return fatoValor != cond.valor;
        case 'contém': return String(fatoValor).includes(cond.valor);
        default: return false;
      }
    });

    // Se a regra foi acionada, aplica a ação.
    if (isRuleTriggered) {
      statusFinal = rule.acao_se_verdadeiro.status;
      parecerFinal = rule.acao_se_verdadeiro.mensagem;
    }
  });

  return { status: statusFinal, parecer: parecerFinal };
}