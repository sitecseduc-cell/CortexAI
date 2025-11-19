import { watchEffect } from 'vue';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '@/libs/firebase'; // Caminho corrigido para a pasta libs

export function useSeeder(userPath) {
  // Regras baseadas no Estatuto do Servidor (PA)
  const DEFAULT_RULES = [// --- DIREITOS DE CARREIRA ---
    { 
      id: "REGRA_ESTAB_01", 
      nome: "Verificar Estágio Probatório", 
      processo: "progressao_funcional", 
      status: "Ativa", 
      // Regra: Estabilidade adquirida após 3 anos
      condicoes: [{ fato: "tempo_de_servico_em_anos", operador: "<", valor: 3 }], 
      acao_se_verdadeiro: { status: "REJEITADO", mensagem: "Servidor ainda em estágio probatório (menos de 3 anos)." },
      descricao: "A estabilidade e progressão dependem do fim do estágio probatório."
    },
    
    // --- LICENÇAS E AFASTAMENTOS ---
    { 
      id: "REGRA_FERIAS_01", 
      nome: "Limite Constitucional (Férias)", 
      processo: "solicitacao_ferias", 
      status: "Ativa", 
      // Regra: Direito a 30 dias
      condicoes: [{ fato: "dias_solicitados", operador: ">", valor: 30 }], 
      acao_se_verdadeiro: { status: "FALHA", mensagem: "Solicitação excede o limite de 30 dias anuais." },
      descricao: "O gozo de férias não pode exceder 30 dias por período."
    },
    { 
      id: "REGRA_MAT_01", 
      nome: "Prazo Licença Maternidade", 
      processo: "licenca_maternidade", 
      status: "Ativa", 
      // Regra: Mencionada como até 180 dias
      condicoes: [{ fato: "dias_solicitados", operador: ">", valor: 180 }], 
      acao_se_verdadeiro: { status: "FALHA", mensagem: "Solicitação excede o limite legal de 180 dias." },
      descricao: "Verifica se o atestado ou pedido excede o teto de 180 dias."
    },
    { 
      id: "REGRA_PREMIO_01", 
      nome: "Interstício Licença Prêmio", 
      processo: "licenca_premio", 
      status: "Ativa", 
      // Regra: Licença prêmio a cada 5 anos (Quinquênio)
      condicoes: [{ fato: "tempo_de_servico_em_anos", operador: "<", valor: 5 }], 
      acao_se_verdadeiro: { status: "REJEITADO", mensagem: "Servidor não completou o quinquênio (5 anos)." },
      descricao: "Exige 5 anos de efetivo exercício para concessão."
    },
    { 
      id: "REGRA_CAPACIT_01", 
      nome: "Interstício Capacitação", 
      processo: "licenca_capacitacao", 
      status: "Ativa", 
      // Regra: A cada 5 anos
      condicoes: [{ fato: "tempo_de_servico_em_anos", operador: "<", valor: 5 }], 
      acao_se_verdadeiro: { status: "REJEITADO", mensagem: "Necessário 5 anos de serviço para licença de aprimoramento." },
      descricao: "Licença para aprimoramento profissional exige interstício de 5 anos."
    },

    // --- ADICIONAIS E GRATIFICAÇÕES ---
    { 
      id: "REGRA_TITUL_01", 
      nome: "Comprovação de Titulação", 
      processo: "adicional_titulacao", 
      status: "Ativa", 
      // Regra: Pagos por pós, mestrado ou doutorado
      condicoes: [{ fato: "titulacao", operador: "==", valor: "Nenhuma" }], // Assumindo que o IDP retorna "Nenhuma" se não achar
      acao_se_verdadeiro: { status: "FALHA", mensagem: "Nenhuma titulação (Pós/Mestrado/Doutorado) identificada." },
      descricao: "Verifica a existência de título acadêmico válido."
    },
    
    // --- AUXÍLIOS ---
    { 
      id: "REGRA_FAMILIA_01", 
      nome: "Elegibilidade Salário-Família", 
      processo: "salario_familia", 
      status: "Ativa", 
      // Regra: Para servidores com dependentes
      condicoes: [{ fato: "qtd_dependentes", operador: "==", valor: 0 }], 
      acao_se_verdadeiro: { status: "REJEITADO", mensagem: "Não há dependentes cadastrados/identificados." },
      descricao: "Benefício exclusivo para quem possui dependentes."
    }
  ];

  // 2. Definição dos Processos (Para o dropdown do Frontend)
  const DEFAULT_PROCESSES = [
    {
      id: "progressao_funcional",
      nome: "Progressão Funcional (Estabilidade)",
      descricao: "Análise de tempo de serviço e avaliação para mudança de classe.",
      icon: "Shield", // String para ser resolvida dinamicamente no componente ou o componente direto se não salvar no banco
      simulatedContent: "Requeiro progressão funcional. Admissão: 10/01/2024. Declaro cumprido o estágio probatório."
    },
    {
      id: "solicitacao_ferias",
      nome: "Solicitação de Férias",
      descricao: "Análise de período aquisitivo e limite de 30 dias.",
      icon: "Sun",
      simulatedContent: "Solicito 30 dias de férias referente ao exercício 2024/2025."
    },
    {
      id: "licenca_maternidade",
      nome: "Licença Maternidade",
      descricao: "Concessão de até 180 dias para gestantes.",
      icon: "Baby",
      simulatedContent: "Atestado médico indicando início da licença maternidade por 180 dias."
    },
    {
      id: "licenca_premio",
      nome: "Licença Prêmio",
      descricao: "Licença especial por assiduidade (Quinquênio).",
      icon: "Award",
      simulatedContent: "Requeiro gozo de licença prêmio referente ao quinquênio 2019-2024."
    },
    {
      id: "licenca_capacitacao",
      nome: "Licença para Capacitação",
      descricao: "Afastamento para aprimoramento profissional.",
      icon: "BookOpen",
      simulatedContent: "Solicito afastamento para curso de Mestrado (Capacitação)."
    },
    {
      id: "adicional_titulacao",
      nome: "Adicional de Titulação",
      descricao: "Inclusão de gratificação por titulação acadêmica.",
      icon: "BookOpen",
      simulatedContent: "Encaminho diploma de Pós-Graduação para fins de adicional."
    },
    {
      id: "salario_familia",
      nome: "Salário-Família",
      descricao: "Auxílio para dependentes.",
      icon: "Users",
      simulatedContent: "Solicito salário-família. Anexo certidão de nascimento do dependente."
    }
  ];

  // 3. Lógica de Seeding (Vue WatchEffect)
  watchEffect(async () => {
    if (!userPath.value) return;

    // Seed Regras
    const rulesRef = collection(db, `${userPath.value}/rules`);
    try {
        const snapshot = await getDocs(rulesRef);
        if (snapshot.empty) {
            console.log("Populando regras CCM...");
            const batchPromises = DEFAULT_RULES.map(rule => 
                setDoc(doc(rulesRef, rule.id), rule)
            );
            await Promise.all(batchPromises);
        }
    } catch (e) {
        console.error("Erro ao semear regras:", e);
    }

    // Seed Processos (Opcional: se você salvar os tipos de processo no banco)
    // Se os processos forem estáticos no código ("hardcoded"), ignore esta parte.
    // Mas se quiser dinâmico:
    /*
    const processesRef = collection(db, `${userPath.value}/process_types`);
    try {
        const snapProc = await getDocs(processesRef);
        if (snapProc.empty) {
             const procPromises = DEFAULT_PROCESSES.map(proc => 
                setDoc(doc(processesRef, proc.id), proc)
            );
            await Promise.all(procPromises);
        }
    } catch(e) { console.error(e) }
    */
  });
}