import { supabase } from '@/libs/supabase';
import { useAuth } from '@/composables/useAuth';

export function useAudit() {
  const { user } = useAuth(); // Já usa Supabase

  // Função nativa do browser para hash SHA-256 (SubtleCrypto)
  const generateHash = async (message) => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const logAction = async (docId, action, details = {}) => {
    try {
      const actorId = user.value ? user.value.id : 'system';

      // 1. Buscar o Hash do último bloco (log)
      const { data: lastLog } = await supabase
        .from('audit_logs')
        .select('current_hash')
        .eq('doc_id', docId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let previousHash = 'GENESIS_BLOCK_HASH_000000000000000000';

      if (lastLog) {
        previousHash = lastLog.current_hash;
      }

      // 2. Preparar payload
      const timestamp = new Date().toISOString();
      const payloadString = JSON.stringify({
        action,
        docId,
        actor: actorId,
        details,
        previousHash,
        timestamp
      });

      // 3. Gerar Hash
      const currentHash = await generateHash(payloadString);

      // 4. Salvar no Supabase
      const { error } = await supabase
        .from('audit_logs')
        .insert([{
            doc_id: docId,
            action,
            actor_id: actorId,
            details: details, // Coluna JSONB
            previous_hash: previousHash,
            current_hash: currentHash,
            // created_at é gerado automaticamente pelo banco
        }]);

      if (error) throw error;

      console.log(`[AUDIT] ⛓️ Bloco Hash gerado: ${currentHash.substring(0, 10)}...`);

    } catch (error) {
      console.error("❌ Falha Crítica de Auditoria:", error);
    }
  };

  return { logAction };
}