import { db, auth } from '@/firebase/init'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export function useAudit() {
  
  /**
   * Grava um log imutável na subcoleção 'logs' do documento
   */
  const logAction = async (docId, action, details = {}) => {
    try {
      // Tenta pegar usuário logado ou define como 'Sistema/Anonimo'
      const user = auth.currentUser;
      const actorInfo = user 
        ? { uid: user.uid, email: user.email }
        : { uid: 'system', email: 'automacao@cortex.gov' };

      const logsRef = collection(db, 'documents', docId, 'logs');

      await addDoc(logsRef, {
        action, // Ex: 'APROVADO', 'REJEITADO', 'VISUALIZADO'
        actor: actorInfo,
        details: {
          previousValue: details.previousValue || null,
          newValue: details.newValue || null,
          notes: details.notes || ''
        },
        timestamp: serverTimestamp(), // Data oficial do servidor
        clientAgent: navigator.userAgent // Metadado extra de segurança
      });

      console.log(`[AUDIT] ✅ Ação ${action} registrada.`);
    } catch (error) {
      console.error("❌ Falha Crítica de Auditoria:", error);
      // Em govtech real, talvez você quisesse bloquear a ação se o log falhar
      throw error; 
    }
  };

  return { logAction };
}