import { ref } from 'vue';
import { supabase } from '@/libs/supabase';
import { functions } from '@/libs/firebase';
import { httpsCallable } from 'firebase/functions';
import { useToastStore } from '@/stores/toast';
import { useAuth } from '@/composables/useAuth';
import { executeRAR, determineVerdict } from '@/utils/ruleEngine';

export function useDocumentWorkflow() {
  const isProcessing = ref(false);
  const error = ref(null);
  const toast = useToastStore();
  const { user } = useAuth();

  const startNewProcess = async (file, processId, userCategory) => {
    // Validação inicial
    if (!file) return false;
    if (!user.value) {
        toast.addToast('Usuário não autenticado.', 'error');
        return false;
    }
    
    isProcessing.value = true;
    error.value = null;
 
    try {
      // 1. Converter arquivo para Base64 (Necessário para enviar à Cloud Function)
      const base64String = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = (err) => reject(err);
      });
 
      // 2. Upload para Supabase Storage
      const fileName = `${user.value.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(fileName, file);
      
      if (uploadError) throw new Error(`Erro no upload para o Supabase: ${uploadError.message}`);
 
      // Obter URL pública para salvar no banco
      const { data: { publicUrl } } = supabase.storage
        .from('documentos')
        .getPublicUrl(fileName);
 
      // 3. Processamento IA (Backend)
      // Chama a Firebase Function de forma segura
      toast.addToast('IA analisando documento...', 'info');
      const processDocumentAI = httpsCallable(functions, 'processDocumentWithAI');
      const aiResponse = await processDocumentAI({ base64Content: base64String, mimeType: file.type });
      const idpResult = aiResponse.data;
      
      // Adiciona a categoria selecionada pelo usuário ao objeto para validação
      idpResult.categoria_usuario = userCategory;

      // 4. Executar Regras de Negócio
      // Busca regras ativas do banco
      const { data: dbRules } = await supabase.from('regras').select('*');
      
      // Aplica as regras
      const rarResults = executeRAR(idpResult, dbRules || []);
      const finalStatus = determineVerdict(rarResults);
 
      // 5. Salvar Resultado no Banco de Dados
      const { error: dbError } = await supabase
        .from('processos')
        .insert([{
          user_id: user.value.id,
          nome_arquivo: file.name,
          url_arquivo: publicUrl,
          categoria_usuario: userCategory,
          status: finalStatus,
          resultado_ia: idpResult,
          resultado_rar: rarResults
        }]);
 
      if (dbError) throw new Error(`Erro ao salvar no banco: ${dbError.message}`);
 
      toast.addToast('Documento analisado com sucesso!', 'success');
      return true;
 
    } catch (err) {
      error.value = err.message;
      console.error("Erro no fluxo:", err);
      toast.addToast(`Erro: ${err.message}`, 'error');
      return false;
    } finally {
      isProcessing.value = false;
    }
  };

  return {
    isProcessing, error, startNewProcess
  };
}