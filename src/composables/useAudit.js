import { supabase } from '@/libs/supabase';
import { useAuth } from '@/composables/useAuth';

export function useAudit() {
  const { user } = useAuth();

  // Função nativa do browser para hash SHA-256 (SubtleCrypto)
  const generateHash = async (message) => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const logAction = async (docId, action, details = {}) => {
    try {
      const actorInfo = user.value 
        ? { uid: user.value.id, email: user.value.email }
        : { uid: 'system', email: 'automacao@cortex.gov' };

      // 1. Buscar o Hash do último bloco (log)
      const { data: lastLogs } = await supabase
        .from('audit_trail')
        .select('current_hash')
        .eq('doc_id', docId)
        .order('created_at', { ascending: false })
        .limit(1);

      let previousHash = 'GENESIS_BLOCK_HASH_000000000000000000';

      if (lastLogs && lastLogs.length > 0) {
        previousHash = lastLogs[0].current_hash;
      }

      // 2. Preparar payload
      const timestamp = new Date().toISOString();
      const payload = {
        action,
        doc_id: docId,
        actor: actorInfo.uid,
        details: JSON.stringify(details),
        previous_hash: previousHash,
        timestamp
      };

      // 3. Gerar Hash
      const payloadString = JSON.stringify(payload);
      const currentHash = await generateHash(payloadString);

      // 4. Salvar no Supabase
      const { error } = await supabase.from('audit_trail').insert({
        action,
        doc_id: docId,
        actor: actorInfo, 
        details,          
        current_hash: currentHash,      
        previous_hash: previousHash
      });

      if (error) throw error;

      console.log(`[AUDIT] ⛓️ Bloco Hash gerado: ${currentHash.substring(0, 10)}...`);

    } catch (error) {
      console.error("❌ Falha Crítica de Auditoria:", error);
    }
  };

  return { logAction };
}