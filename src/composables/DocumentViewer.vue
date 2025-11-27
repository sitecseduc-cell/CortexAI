<script setup>
import { ref, computed, watch } from 'vue';
import { useTypewriter } from '@/composables/useTypewriter'; // Importa o streaming UX
import DiffViewer from './DiffViewer.vue'; // Importa o componente de Diff
import { safeParse } from '@/utils/helpers';
import { geminiApiService } from '@/services/geminiService';
import { FileSignature, Loader2 } from 'lucide-vue-next';

const props = defineProps({
  doc: {
    type: Object,
    default: null,
  },
});

const idpData = computed(() => safeParse(props.doc?.idpResult));
// Simula dados originais para o diff (em produção, salvaria 'originalIdpResult' separado antes da edição)
// Aqui assumimos que idpResult contém a versão FINAL (humana) e precisamos de um backup da IA.
// Dica: No upload, salve idpResultRaw e idpResultValidated.
const originalData = computed(() => safeParse(props.doc?.idpResultRaw) || idpData.value); 

// --- PORTARIA COM STREAMING ---
const { displayedText, isTyping, streamText } = useTypewriter();
const isGeneratingPortaria = ref(false);

const generateOfficialAct = async () => {
    if (displayedText.value) return; // Já gerou
    
    isGeneratingPortaria.value = true;
    try {
        const processContext = {
            nome: idpData.value?.keyFields?.find(f => f.field.includes('Nome'))?.value,
            // ... outros campos
        };
        
        // Chama Backend
        const result = await geminiApiService.generateDraft(processContext);
        const fullText = typeof result === 'string' ? result : result.response;
        
        // Inicia efeito de digitação suave
        await streamText(fullText);
        
    } catch (e) {
        console.error(e);
        displayedText.value = "Erro na geração. Tente novamente.";
    } finally {
        isGeneratingPortaria.value = false;
    }
};

// Reset portaria when doc changes
watch(() => props.doc?.id, () => {
    displayedText.value = '';
});
</script>

<template>
  <div v-if="!doc" class="flex flex-col items-center justify-center h-full text-slate-500">
    <p>Selecione um processo na lista para ver os detalhes.</p>
  </div>

  <div v-else class="flex flex-col h-full">
    <!-- Header -->
    <div class="p-4 border-b border-slate-800 flex justify-between items-center shrink-0">
      <h2 class="text-lg font-bold text-white truncate">{{ doc.name }}</h2>
    </div>

    <!-- Main Content -->
    <div class="flex-grow p-6 overflow-y-auto custom-scrollbar">
      <!-- CARD DE DIFF (Mostrar apenas se já houve validação humana) -->
      <div v-if="doc.status !== 'Validacao Pendente' && doc.status !== 'Processing IDP' && originalData" class="mb-6 animate-slide-up">
          <DiffViewer :original="originalData" :current="idpData" />
      </div>

      <!-- ... (Card de Veredito mantido) ... -->

      <!-- AÇÕES FINAIS: PORTARIA COM STREAMING -->
      <div v-if="doc.status === 'Aprovado'" class="pt-4 border-t border-slate-800">
          <button @click="generateOfficialAct" :disabled="isGeneratingPortaria || isTyping" 
                  class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center">
              <Loader2 v-if="isGeneratingPortaria" class="w-5 h-5 mr-2 animate-spin" />
              <FileSignature v-else class="w-5 h-5 mr-2" />
              {{ isGeneratingPortaria ? 'Redigindo...' : 'Gerar Minuta de Portaria' }}
          </button>

          <!-- Área de Texto da Portaria -->
          <div v-if="displayedText || isGeneratingPortaria" class="mt-4 bg-white text-slate-900 p-8 rounded-lg shadow-xl font-serif text-sm leading-relaxed relative min-h-[200px]">
              <!-- Papel Timbrado Header -->
              <div class="border-b-2 border-green-800 pb-4 mb-6 flex justify-center opacity-80">
                 
                 <div class="text-center ml-4">
                     <h2 class="font-bold text-xs uppercase">Governo do Estado do Pará</h2>
                     <h3 class="text-[10px] uppercase tracking-widest">Secretaria de Estado de Educação</h3>
                 </div>
              </div>

              <!-- Texto com cursor piscante -->
              <div class="whitespace-pre-wrap text-justify">
                  {{ displayedText }}<span v-if="isTyping" class="inline-block w-2 h-4 bg-black ml-1 animate-pulse"></span>
              </div>
              
              <!-- Carimbo Digital (Aparece no fim) -->
              <div v-if="!isTyping && displayedText" class="mt-12 flex justify-end animate-fade-in">
                  <div class="text-center">
                      <div class="h-px w-48 bg-black mb-2"></div>
                      <p class="font-bold text-xs">Assinatura Digital</p>
                      <p class="text-[10px] text-slate-500">Hash: {{ doc.id }}</p>
                  </div>
              </div>
          </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="p-4 border-t border-slate-800 shrink-0">
      <div v-if="doc.status === 'Validacao Pendente'">
        <button @click="$emit('validate', { docId: doc.id, data: idpData })" class="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold">
          Confirmar e Enviar para Análise
        </button>
      </div>
      <div v-else>
        <button @click="$emit('delete', doc.id)" class="w-full py-3 bg-red-800 hover:bg-red-700 text-white rounded-xl font-bold">
          Excluir Processo
        </button>
      </div>
    </div>
  </div>
</template>
