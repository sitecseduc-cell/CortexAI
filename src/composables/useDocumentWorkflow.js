import { ref } from 'vue';
import { supabase } from '@/libs/supabase';
import { useToastStore } from '@/stores/toast';
import { useAuth } from '@/composables/useAuth';
import { geminiApiService } from '@/services/geminiService'; //
import { executeRAR, determineVerdict } from '@/utils/ruleEngine'; //
 
export function useDocumentWorkflow() {
  const isProcessing = ref(false);
  const error = ref(null);
  const toast = useToastStore();
  const { user } = useAuth();
 
  const startNewProcess = async (file, processId, userCategory) => {
    if (!file || !user.value) return;
    isProcessing.value = true;
    error.value = null;
 
    try {
      // 1. Converter arquivo para Base64 (Necessário para o Gemini)
      const base64String = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = (err) => reject(err);
      });
 
      // 2. Upload para Supabase Storage
      const fileName = `${user.value.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documentos') // Certifique-se que este bucket existe no Supabase
        .upload(fileName, file);
      if (uploadError) throw uploadError;
 
      const { data: { publicUrl } } = supabase.storage
        .from('documentos')
        .getPublicUrl(fileName);
 
      // 3. Processamento IA (IDP) - Cliente Side
      toast.addToast('Enviando para IA...', 'info');
      const idpResult = await geminiApiService.processDocument(base64String, file.type);
      
      // 4. Buscar Regras do Supabase e Executar (RAR)
      const { data: rules } = await supabase.from('regras').select('*');
      const rarResults = executeRAR(idpResult, rules || []);
      const finalStatus = determineVerdict(rarResults);
 
      // 5. Salvar Resultado na Tabela 'processos'
      const { error: dbError } = await supabase
        .from('processos')
        .insert([{
          user_id: user.value.id,
          nome_arquivo: file.name,
          url_arquivo: publicUrl,
          categoria_usuario: userCategory,
          resultado_ia: idpResult,
          resultado_rar: rarResults, // Salva o detalhe das regras
          status: finalStatus
        }]);
 
      if (dbError) throw dbError;
 
      toast.addToast(`Processo finalizado: ${finalStatus}`, 'success');
      return true;
 
    } catch (err) {
      error.value = err.message;
      console.error("Erro no workflow:", err);
      toast.addToast(`Erro: ${err.message}`, 'error');
      return false;
    } finally {
      isProcessing.value = false;
    }
  };
 
  return {
    isProcessing,
    error,
    startNewProcess,
  };
}