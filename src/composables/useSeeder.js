import { watchEffect } from 'vue';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '@/libs/firebase'; 

// Renomeei o argumento para 'collectionPath' para ficar mais claro
export function useSeeder(collectionPath) {
  // Regras baseadas no Estatuto do Servidor (PA)
  const DEFAULT_RULES = [
    // --- DIREITOS DE CARREIRA ---
    { 
      id: "REGRA_ESTAB_01", 
      nome: "Verificar Estágio Probatório", 
      processo: "progressao_funcional", 
      status: "Ativa", 
      condicoes: [{ fato: "tempo_de_servico_em_anos", operador: "<", valor: 3 }], 
      acao_se_verdadeiro: { status: "REJEITADO", mensagem: "Servidor ainda em estágio probatório (menos de 3 anos)." },
      descricao: "A estabilidade e progressão dependem do fim do estágio probatório."
    },
    
    // --- LICENÇAS E AFASTAMENTOS ---
    // --- FÉRIAS (Regra Refatorada) ---
    { 
      id: "REGRA_FERIAS_GERAL", 
      nome: "Limite Padrão de Férias (Admin)", 
      processo: "solicitacao_ferias", 
      status: "Ativa", 
      // Esta regra visual apenas alerta. O backend fará a validação final baseada no cargo.
      condicoes: [{ fato: "dias_solicitados", operador: ">", valor: 45 }], 
      acao_se_verdadeiro: { status: "FALHA", mensagem: "Solicitação excede o teto máximo absoluto (45 dias)." },
      descricao: "Limite máximo do sistema. Admin: 30 dias / Prof: 45 dias (validado pelo Agente).",
    },
    { 
      id: "REGRA_MAT_01", 
      nome: "Prazo Licença Maternidade", 
      processo: "licenca_maternidade", 
      status: "Ativa", 
      condicoes: [{ fato: "dias_solicitados", operador: ">", valor: 180 }], 
      acao_se_verdadeiro: { status: "FALHA", mensagem: "Solicitação excede o limite legal de 180 dias." },
      descricao: "Verifica se o atestado ou pedido excede o teto de 180 dias."
    },
    { 
      id: "REGRA_PREMIO_01", 
      nome: "Interstício Licença Prêmio", 
      processo: "licenca_premio", 
      status: "Ativa", 
      condicoes: [{ fato: "tempo_de_servico_em_anos", operador: "<", valor: 5 }], 
      acao_se_verdadeiro: { status: "REJEITADO", mensagem: "Servidor não completou o quinquênio (5 anos)." },
      descricao: "Exige 5 anos de efetivo exercício para concessão."
    },
    { 
      id: "REGRA_CAPACIT_01", 
      nome: "Interstício Capacitação", 
      processo: "licenca_capacitacao", 
      status: "Ativa", 
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
      condicoes: [{ fato: "titulacao", operador: "==", valor: "Nenhuma" }], 
      acao_se_verdadeiro: { status: "FALHA", mensagem: "Nenhuma titulação (Pós/Mestrado/Doutorado) identificada." },
      descricao: "Verifica a existência de título acadêmico válido."
    },
    
    // --- AUXÍLIOS ---
    { 
      id: "REGRA_FAMILIA_01", 
      nome: "Elegibilidade Salário-Família", 
      processo: "salario_familia", 
      status: "Ativa", 
      condicoes: [{ fato: "qtd_dependentes", operador: "==", valor: 0 }], 
      acao_se_verdadeiro: { status: "REJEITADO", mensagem: "Não há dependentes cadastrados/identificados." },
      descricao: "Benefício exclusivo para quem possui dependentes."
    }
  ];

  // Lógica de Seeding (Vue WatchEffect)
  watchEffect(async () => {
    if (!collectionPath.value) return;

    // CORREÇÃO AQUI: Usamos o path direto, sem adicionar '/rules' novamente
    const rulesRef = collection(db, collectionPath.value);
    
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
  });
}