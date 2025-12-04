<script setup>
import { ref, computed, watch } from 'vue';
import { safeParse } from '@/utils/helpers';
import VuePdfEmbed from 'vue-pdf-embed';
import { CheckCircle, XCircle, AlertTriangle, User, FileText, Save, Loader2, FileSignature } from 'lucide-vue-next';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/libs/firebase';
import { geminiApiService } from '@/services/geminiService'; // Adicionado se faltar
import { useTypewriter } from '@/composables/useTypewriter';

const props = defineProps(['doc']);
const emit = defineEmits(['delete', 'validate', 'manual-advance']); // Adicionado emits usados no template

// Dados
const idpData = computed(() => safeParse(props.doc?.idpResult) || {});
const analiseData = computed(() => safeParse(props.doc?.rarResult));

// --- LÓGICA DE EDIÇÃO ---
const isEditing = ref(false);
const editForm = ref({});

watch(() => props.doc, (newDoc) => {
    if (newDoc) {
        isEditing.value = false;
        // Resetar texto da portaria se necessário
    }
}, { immediate: true });

const startValidation = () => {
    editForm.value = { ...idpData.value }; // Clona para edição
    isEditing.value = true;
};

const confirmValidation = async () => {
    if(!props.doc.id || !auth.currentUser) return;
    
    // Emite o evento para o pai (PlatformView) lidar com a atualização
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
            // Proteção extra aqui no .find
            nome: idpData.value?.keyFields?.find(f => f.field?.includes('Nome'))?.value || "Interessado",
            documento: props.doc.name,
            decisao: analiseData.value
        };
        
        const result = await geminiApiService.generateDraft(processContext, analiseData.value);
        const fullText = typeof result === 'string' ? result : result.response;
        
        await streamText(fullText);
    } catch (e) {
        console.error(e);
    } finally {
        isGeneratingPortaria.value = false;
    }
};
</script>

<template>
  <div v-if="doc" class="flex h-full bg-slate-950 text-white">
    
    <div class="w-1/2 border-r border-slate-800 bg-slate-900/50 p-6 overflow-y-auto custom-scrollbar flex flex-col items-center">
       <div v-if="doc.fileUrl">
           <VuePdfEmbed :source="doc.fileUrl" class="shadow-xl border border-slate-700 rounded w-full max-w-[500px]" />
       </div>
       <div v-else class="text-slate-500 mt-20 flex flex-col items-center">
           <FileText class="w-16 h-16 mb-4 opacity-50"/>
           <p>Visualização não disponível</p>
       </div>
    </div>

    <div class="w-1/2 flex flex-col h-full overflow-hidden">
        
        <div class="p-6 border-b border-slate-800">
            <h1 class="text-2xl font-bold mb-1">{{ doc.name }}</h1>
            <div class="flex items-center gap-2">
                <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                      :class="{
                          'bg-yellow-500/20 text-yellow-400': (doc.status || '').includes('Aguardando') || (doc.status || '').includes('Pendente'),
                          'bg-green-500/20 text-green-400': doc.status === 'Aprovado',
                          'bg-red-500/20 text-red-400': doc.status === 'Rejeitado',
                          'bg-blue-500/20 text-blue-400': (doc.status || '').includes('Processing') || doc.status === 'Em Análise'
                      }">
                    {{ doc.status || 'Pendente' }}
                </span>
                <span class="text-slate-500 text-xs">{{ new Date(doc.timestamp || Date.now()).toLocaleDateString() }}</span>
            </div>
        </div>

        <div class="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
            
            <div class="bg-slate-900 rounded-xl border border-slate-800 p-5">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-indigo-400 flex items-center"><FileText class="w-4 h-4 mr-2"/> Dados do Pedido</h3>
                    <button v-if="doc.status === 'Validacao Pendente' && !isEditing" @click="startValidation" class="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded text-white transition">
                        Validar Dados
                    </button>
                </div>

                <div v-if="isEditing" class="space-y-3 animate-fade-in">
                    <template v-if="editForm.keyFields && Array.isArray(editForm.keyFields)">
                        <div v-for="(fieldObj, index) in editForm.keyFields" :key="index">
                            <label class="text-[10px] uppercase text-slate-500 font-bold">{{ fieldObj.field }}</label>
                            <input v-model="fieldObj.value" class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none" />
                        </div>
                    </template>
                    <template v-else>
                         <div v-for="(val, key) in editForm" :key="key">
                            <label class="text-[10px] uppercase text-slate-500 font-bold">{{ key }}</label>
                            <input v-model="editForm[key]" class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none" />
                        </div>
                    </template>

                    <button @click="confirmValidation" class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded mt-2 flex items-center justify-center">
                        <CheckCircle class="w-4 h-4 mr-2"/> Confirmar e Analisar
                    </button>
                </div>

                <div v-else class="grid grid-cols-2 gap-4">
                    <template v-if="idpData.keyFields && Array.isArray(idpData.keyFields)">
                        <div v-for="(item, idx) in idpData.keyFields" :key="idx">
                            <span class="block text-[10px] uppercase text-slate-500">{{ item.field }}</span>
                            <span class="text-sm font-medium">{{ item.value }}</span>
                        </div>
                    </template>
                    <template v-else>
                        <div v-for="(val, key) in idpData" :key="key">
                            <span class="block text-[10px] uppercase text-slate-500">{{ key }}</span>
                            <span class="text-sm font-medium">{{ val }}</span>
                        </div>
                    </template>
                </div>
            </div>

            <div v-if="analiseData" class="rounded-xl border p-6 shadow-2xl transition-all animate-slide-up"
                 :class="analiseData.veredicto?.status === 'Aprovado' ? 'bg-green-900/20 border-green-500/50' : 'bg-red-900/20 border-red-500/50'">
                
                <h2 class="text-2xl font-black mb-2 flex items-center" 
                    :class="analiseData.veredicto?.status === 'Aprovado' ? 'text-green-400' : 'text-red-400'">
                    {{ analiseData.veredicto?.status }}
                </h2>
                
                <p class="text-sm text-slate-200 leading-relaxed mb-4 bg-black/20 p-4 rounded-lg">
                    {{ analiseData.veredicto?.parecer }}
                </p>
                <div v-if="analiseData.chainOfThought" class="text-xs text-slate-500 italic mt-2">
                    {{ analiseData.chainOfThought }}
                </div>
            </div>
            
            <div v-if="doc.status === 'Aprovado'" class="pt-4 border-t border-slate-800">
                <button @click="generateOfficialAct" :disabled="isGeneratingPortaria || isTyping" 
                        class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center">
                    <Loader2 v-if="isGeneratingPortaria" class="w-5 h-5 mr-2 animate-spin" />
                    <FileSignature v-else class="w-5 h-5 mr-2" />
                    {{ isGeneratingPortaria ? 'Redigindo...' : 'Gerar Minuta de Portaria' }}
                </button>

                <div v-if="displayedText || isGeneratingPortaria" class="mt-4 bg-white text-slate-900 p-8 rounded-lg shadow-xl font-serif text-sm leading-relaxed relative min-h-[200px]">
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
    </div>
  </div>
</template>