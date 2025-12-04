import { ref } from 'vue';
import { supabase } from '@/libs/supabase';
import { useToastStore } from '@/stores/toast';
import { useAuth } from '@/composables/useAuth';

/**
 * Gerencia todo o fluxo de vida de um processo, desde o upload até a finalização.
 */
export function useDocumentWorkflow() {
  const isProcessing = ref(false);
  const error = ref(null);
  const toast = useToastStore();
  const { user } = useAuth();

  /**
   * Inicia um novo processo: faz upload, chama a API de IA e salva no banco.
   * @param {File} file - O arquivo selecionado pelo usuário.
   * @param {string} processId - O ID do processo (ex: 'solicitacao_ferias').
   * @param {string} userCategory - A categoria do usuário (ex: 'ADMINISTRATIVO').
   */
  const startNewProcess = async (file, processId, userCategory) => {
    if (!file) return;
    isProcessing.value = true;
    error.value = null;

    try {
      // 1. Converter arquivo para Base64
      const base64String = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = (err) => reject(err);
      });

      // 2. Chamar a API Serverless de processamento
      const apiEndpoint = `/api/${processId.replace(/_/g, '-')}`;
      const apiResponse = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: base64String,
          mimeType: file.type,
          userCategory: userCategory,
        }),
      });

      if (!apiResponse.ok) {
        const errorBody = await apiResponse.text();
        throw new Error(`Falha na análise da IA: ${errorBody}`);
      }
      const resultadoIA = await apiResponse.json();

      // 3. Fazer upload do arquivo para o Supabase Storage
      const fileName = `${user.value.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      // 4. Obter URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('documentos')
        .getPublicUrl(fileName);

      // 5. Inserir o registro completo na tabela 'processos'
      const { error: dbError } = await supabase
        .from('processos')
        .insert([{
          nome_arquivo: file.name,
          url_arquivo: publicUrl,
          status: resultadoIA.veredicto.status, // O status já vem do motor de regras
          resultado_ia: resultadoIA, // JSON completo com dados e veredito
          categoria_usuario: userCategory,
          user_id: user.value.id, // Associa o processo ao usuário
        }]);
      if (dbError) throw dbError;

      toast.addToast('Processo iniciado com sucesso!', 'success');
      return true; // Sucesso

    } catch (err) {
      error.value = err.message;
      console.error("Erro no fluxo de trabalho:", err);
      toast.addToast(`Erro ao processar: ${err.message}`, 'error');
      return false; // Falha
    } finally {
      isProcessing.value = false;
    }
  };

  // Futuramente, você pode adicionar outras funções aqui, como:
  // - validateAndFinalize(docId, correctedData)
  // - advanceWorkflowStep(docId, nextStep)

  return {
    isProcessing,
    error,
    startNewProcess,
  };
}