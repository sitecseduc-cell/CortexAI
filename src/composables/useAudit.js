import { db, auth } from '@/libs/firebase'; 
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';

export function useAudit() {
  
  // Função nativa do browser para hash SHA-256 (SubtleCrypto)
  const generateHash = async (message) => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const logAction = async (docId, action, details = {}) => {
    try {
      const user = auth.currentUser;
      const actorInfo = user 
        ? { uid: user.uid, email: user.email }
        : { uid: 'system', email: 'automacao@cortex.gov' };

      const logsRef = collection(db, 'artifacts', 'default-autonomous-agent', 'users', user?.uid || 'system', 'intelligent_platform_docs', docId, 'audit_trail');

      // 1. Buscar o Hash do último bloco (log) para criar a cadeia
      const lastLogQuery = query(logsRef, orderBy('serverTimestamp', 'desc'), limit(1));
      const lastLogSnap = await getDocs(lastLogQuery);
      let previousHash = 'GENESIS_BLOCK_HASH_000000000000000000'; // Hash inicial

      if (!lastLogSnap.empty) {
        previousHash = lastLogSnap.docs[0].data().currentHash;
      }

      // 2. Preparar payload para hashing
      const timestamp = new Date().toISOString();
      const payload = {
        action,
        docId,
        actor: actorInfo.uid,
        details: JSON.stringify(details),
        previousHash,
        timestamp
      };

      // 3. Gerar o Hash Imutável deste registro
      // Conteúdo + Timestamp + Hash Anterior = Cadeia Segura
      const payloadString = JSON.stringify(payload);
      const currentHash = await generateHash(payloadString);

      // 4. Salvar
      await addDoc(logsRef, {
        ...payload,
        actor: actorInfo, // Salva objeto completo para leitura humana
        details,          // Salva objeto para leitura
        currentHash,      // O "selo" criptográfico
        serverTimestamp: serverTimestamp()
      });

      console.log(`[AUDIT] ⛓️ Bloco Hash gerado: ${currentHash.substring(0, 10)}...`);

    } catch (error) {
      console.error("❌ Falha Crítica de Auditoria:", error);
      // Em produção, falha de auditoria deve bloquear a operação
      throw error; 
    }
  };

  return { logAction };
}