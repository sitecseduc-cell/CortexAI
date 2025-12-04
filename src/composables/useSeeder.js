import { watchEffect } from 'vue';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '@/libs/firebase'; 

// Renomeei o argumento para 'collectionPath' para ficar mais claro
export function useSeeder(collectionPath) {
  // Regras focadas APENAS em Férias
  const DEFAULT_RULES = [
    { 
      id: "REGRA_FERIAS_TETO", 
      nome: "Teto Legal de Férias", 
      processo: "solicitacao_ferias", 
      status: "Ativa", 
      condicoes: [{ fato: "dias_solicitados", operador: ">", valor: 45 }], 
      acao_se_verdadeiro: { status: "FALHA", mensagem: "Solicitação excede o limite máximo absoluto de 45 dias." },
      descricao: "Alerta para valores acima do permitido para qualquer categoria."
    }
  ];

  // Lógica de Seeding (Vue WatchEffect)
  watchEffect(async () => {
    if (!collectionPath.value) return;

    const rulesRef = collection(db, collectionPath.value);
    
    try {
        const snapshot = await getDocs(rulesRef);
        if (snapshot.empty) {
            console.log("Populando regras de Férias...");
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