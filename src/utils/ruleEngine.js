/**
 * Executa o motor de regras (RAR - Rules as Reasoning) sobre os dados extraídos.
 * @param {object} idpData - O objeto com os dados extraídos pela IA (resultado_ia).
 * @param {Array} rules - A lista de regras de negócio vindas do banco de dados.
 * @returns {Array} - Uma lista de resultados da aplicação das regras.
 */
export const executeRAR = (idpData, rules) => {
    if (!idpData || !rules) return [];
 
    // Helper para buscar valor extraído
    const getField = (name) => idpData.keyFields?.find(f => f.field.toUpperCase().includes(name))?.value || '';
    
    const cargo = getField('CARGO');
    const matricula = getField('MATRICULA');
    const dataInicio = getField('DATA_INICIO');
    const diasGozo = parseInt(getField('DIAS_GOZO')) || 0;
  
    const results = [];
  
    rules.forEach(rule => {
      if (rule.status !== 'Ativa') return;
  
      let status = "SUCESSO";
      let triggerValue = "N/A";
      let action = "Deferido";
  
      // Lógica de mapeamento das regras (Hardcoded logic mapping to dynamic rules)
      // Idealmente, as regras no banco teriam um campo 'codigo_logica' para mapear aqui
      if (rule.nome.includes('Professor') && cargo.toLowerCase().includes('professor')) {
          // Exemplo simples de validação de mês
          if (dataInicio && !dataInicio.includes('/01/') && !dataInicio.includes('/07/')) {
               status = "ALERTA";
               triggerValue = dataInicio;
               action = rule.acao;
          }
      }
      
      if (rule.nome.includes('Limite') && diasGozo > 30) {
          status = "FALHA";
          triggerValue = `${diasGozo} dias`;
          action = rule.acao;
      }
  
      if (rule.nome.includes('Matrícula') && (!matricula || matricula.length < 3)) {
          status = "FALHA";
          triggerValue = "Vazio";
          action = rule.acao;
      }
  
      results.push({ rule: rule.nome, status, action, triggerValue });
    });
  
    return results;
  };
  
  export const determineVerdict = (rarResults) => {
    if (rarResults.some(r => r.status === 'FALHA')) return 'Failed';
    if (rarResults.some(r => r.status === 'ALERTA')) return 'Requires Review';
    return 'Completed'; // Deferido
  };