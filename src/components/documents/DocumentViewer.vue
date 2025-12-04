<script setup>
import { ref, computed, watch } from 'vue';
import { safeParse } from '@/utils/helpers';
import VuePdfEmbed from 'vue-pdf-embed';
import { CheckCircle, XCircle, AlertTriangle, User, FileText, Save, FileSignature, Loader2 } from 'lucide-vue-next';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/libs/firebase';
import { useTypewriter } from '@/composables/useTypewriter';
import { geminiApiService } from '@/services/geminiService';
import DiffViewer from '@/composables/DiffViewer.vue';

const props = defineProps(['doc']);
const emit = defineEmits(['delete', 'validate', 'manual-advance']);

// Dados
const idpData = computed(() => safeParse(props.doc?.idpResult) || {});
// Usa o raw se existir, senão usa o result atual como base para diff
const originalData = computed(() => safeParse(props.doc?.idpResultRaw) || idpData.value); 
const analiseData = computed(() => safeParse(props.doc?.rarResult));

// --- LÓGICA DE EDIÇÃO ---
const isEditing = ref(false);
const editForm = ref({});

watch(() => props.doc, (newDoc) => {
    if (newDoc) {
        isEditing.value = false;
        // Limpa texto da portaria ao trocar de doc
        displayedText.value = '';
    }
}, { immediate: true });

const startValidation = () => {
    editForm.value = { ...idpData.value }; // Clona para edição
    isEditing.value = true;
};

const confirmValidation = async () => {
    if(!props.doc.id || !auth.currentUser) return;
    
    // Atualiza documento com dados validados
    // Importante: status 'Raciocinio Pendente' dispara a Cloud Function de análise
    emit('validate', { docId: props.doc.id, data: editForm.value });
    isEditing.value = false;
};

// --- PORTARIA ---
const { displayedText, isTyping, streamText } = useTypewriter();
const isGeneratingPortaria = ref(false);

const generateOfficialAct = async () => {
    if (displayedText.value) return;
    
    isGeneratingPortaria.value = true;
    try {
        const processContext = {
            nome: idpData.value?.keyFields?.find(f => f.field.includes('Nome'))?.value || "Interessado",
            documento: props.doc.name,
            decisao: analiseData.value,
        };
        
        const result = await geminiApiService.generateDraft(processContext, analiseData.value);
        const fullText = typeof result === 'string' ? result : result.response;
        
        await streamText(fullText);
    } catch (e) {
        console.error(e);
        displayedText.value = "Erro ao gerar minuta. Tente novamente.";
    } finally {
        isGeneratingPortaria.value = false;
    }
};
</script>

<template>
  <div v-if="doc" class="flex h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
    
    <div class="w-1/2 border-r border-slate-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 p-6 overflow-y-auto custom-scrollbar flex flex-col items-center">
       <div v-if="doc.fileUrl">
           <VuePdfEmbed :source="doc.fileUrl" class="shadow-xl border border-slate-200 dark:border-slate-700 rounded w-full max-w-[500px]" />
       </div>
       <div v-else class="text-slate-400 mt-20 flex flex-col items-center">
           <FileText class="w-16 h-16 mb-4 opacity-50"/>
           <p>Visualização não disponível</p>
       </div>
    </div>

    <div class="w-1/2 flex flex-col h-full overflow-hidden">
        
        <div class="p-6 border-b border-slate-200 dark:border-slate-800">
            <h1 class="text-2xl font-bold mb-1">{{ doc.name }}</h1>
            <div class="flex items-center gap-2">
                <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                      :class="{
                          'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400': (doc.status || '').includes('Aguardando') || (doc.status || '').includes('Pendente'),
                          'bg-green-500/20 text-green-600 dark:text-green-400': doc.status === 'Aprovado',
                          'bg-red-500/20 text-red-600 dark:text-red-400': doc.status === 'Rejeitado',
                          'bg-blue-500/20 text-blue-600 dark:text-blue-400': (doc.status || '').includes('Processing') || doc.status === 'Em Análise'
                      }">
                    {{ doc.status || 'Desconhecido' }}
                </span>
                <span class="text-slate-500 text-xs">{{ new Date(doc.timestamp).toLocaleDateString() }}</span>
            </div>
        </div>

        <div class="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
            
            <div v-if="doc.status !== 'Validacao Pendente' && doc.status !== 'Processing IDP' && originalData" class="animate-slide-up">
                <DiffViewer :original="originalData" :current="idpData" />
            </div>

            <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-indigo-600 dark:text-indigo-400 flex items-center"><FileText class="w-4 h-4 mr-2"/> Dados do Requerimento</h3>
                    <button v-if="doc.status === 'Validacao Pendente' && !isEditing" @click="startValidation" class="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded text-white transition shadow-sm">
                        Corrigir Dados
                    </button>
                </div>

                <div v-if="isEditing" class="space-y-3 animate-fade-in">
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 mb-4 text-xs text-blue-700 dark:text-blue-300">
                        <strong>Sistema de Correção:</strong> Verifique se os dados extraídos conferem com o documento original ao lado. Corrija qualquer erro antes de enviar para análise.
                    </div>
                    <div v-if="editForm.keyFields && Array.isArray(editForm.keyFields)">
                        <div v-for="(fieldObj, index) in editForm.keyFields" :key="index">
                            <label class="text-[10px] uppercase text-slate-500 font-bold">{{ fieldObj.field }}</label>
                            <input v-model="fieldObj.value" class="w-full bg-gray-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 outline-none" />
                        </div>
                    </div>
                    <div v-else>
                         <div v-for="(val, key) in editForm" :key="key">
                            <label class="text-[10px] uppercase text-slate-500 font-bold">{{ key }}</label>
                            <input v-model="editForm[key]" class="w-full bg-gray-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 outline-none" />
                        </div>
                    </div>

                    <button @click="confirmValidation" class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded mt-2 flex items-center justify-center">
                        <CheckCircle class="w-4 h-4 mr-2"/> Confirmar e Analisar
                    </button>
                </div>

                <div v-else-if="idpData.keyFields" class="grid grid-cols-2 gap-4">
                    <div v-for="(item, idx) in idpData.keyFields" :key="idx">
                        <span class="block text-[10px] uppercase text-slate-500">{{ item.field }}</span>
                        <span class="text-sm font-medium">{{ item.value }}</span>
                    </div>
                </div>
                <div v-else class="grid grid-cols-2 gap-4">
                    <div v-for="(val, key) in idpData" :key="key">
                        <span class="block text-[10px] uppercase text-slate-500">{{ key }}</span>
                        <span class="text-sm font-medium">{{ val }}</span>
                    </div>
                </div>
            </div>

            <div v-if="analiseData" class="rounded-xl border p-6 shadow-md transition-all animate-slide-up"
                 :class="analiseData.veredicto?.status === 'Aprovado' 
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-500/50' 
                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-500/50'">
                
                <h2 class="text-2xl font-black mb-2 flex items-center" 
                    :class="analiseData.veredicto?.status === 'Aprovado' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                    {{ analiseData.veredicto?.status }}
                </h2>
                
                <p class="text-sm text-slate-700 dark:text-slate-200 leading-relaxed mb-4 bg-white/50 dark:bg-black/20 p-4 rounded-lg">
                    {{ analiseData.veredicto?.parecer }}
                </p>
                
                <div v-if="analiseData.chainOfThought" class="text-xs text-slate-500 italic mt-2 border-t border-slate-200 dark:border-slate-700 pt-2">
                    <strong>Raciocínio:</strong> {{ analiseData.chainOfThought }}
                </div>
            </div>

            <div v-if="doc.status === 'Aprovado'" class="pt-4 border-t border-slate-200 dark:border-slate-800">
                <button @click="generateOfficialAct" :disabled="isGeneratingPortaria || isTyping" 
                        class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center disabled:opacity-50">
                    <Loader2 v-if="isGeneratingPortaria" class="w-5 h-5 mr-2 animate-spin" />
                    <FileSignature v-else class="w-5 h-5 mr-2" />
                    {{ isGeneratingPortaria ? 'Redigindo...' : 'Gerar Minuta de Portaria' }}
                </button>

                <div v-if="displayedText || isGeneratingPortaria" class="mt-4 bg-white text-slate-900 p-8 rounded-lg shadow-xl font-serif text-sm leading-relaxed relative min-h-[200px] border border-slate-200">
                    <div class="border-b-2 border-green-800 pb-4 mb-6 flex justify-center opacity-80">
                       <div class="text-center ml-4">
                           <h2 class="font-bold text-xs uppercase">Governo do Estado do Pará</h2>
                           <h3 class="text-[10px] uppercase tracking-widest">Secretaria de Estado de Educação</h3>
                       </div>
                    </div>
                    <div class="whitespace-pre-wrap text-justify">
                        {{ displayedText }}<span v-if="isTyping" class="inline-block w-2 h-4 bg-black ml-1 animate-pulse"></span>
                    </div>
                </div>
            </div>

        </div>

        <!-- Footer Actions -->
        <div class="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <button @click="$emit('delete', doc.id)" class="w-full py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 dark:bg-red-800/20 dark:hover:bg-red-800/40 dark:text-red-400 rounded-xl font-bold transition-colors">
                Excluir Processo
            </button>
        </div>
    </div>
  </div>
</template>