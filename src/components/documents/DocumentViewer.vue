<script setup>
import { ref, computed, watch } from 'vue';
import { safeParse, getStatusDisplay } from '@/utils/helpers';
import { 
  Trash2, Brain, FileSearch, UserCheck, ListChecks, 
  Check, FileSignature, Loader2, Clock, ShieldAlert 
} from 'lucide-vue-next';
import VuePdfEmbed from 'vue-pdf-embed';
import { geminiApiService } from '@/services/geminiService';

const props = defineProps(['doc']);
const emit = defineEmits(['validate', 'delete']);

// --- PARSING ---
const idpData = computed(() => safeParse(props.doc?.idpResult));
const rarData = computed(() => safeParse(props.doc?.rarResult));
const enrichedData = computed(() => safeParse(props.doc?.enrichedData));

// --- STEPPER LOGIC ---
const steps = [
  { id: 'upload', label: 'Upload', statusKey: ['Uploaded'] },
  { id: 'idp', label: 'Leitura IA', statusKey: ['Processing IDP'] },
  { id: 'enrich', label: 'Dados RH', statusKey: ['Enriquecimento Pendente'] },
  { id: 'human', label: 'Validação', statusKey: ['Validacao Pendente'] },
  { id: 'agent', label: 'Análise Jurídica', statusKey: ['Raciocinio Pendente'] },
  { id: 'final', label: 'Conclusão', statusKey: ['Aprovado', 'Rejeitado', 'Finalizado'] }
];

const currentStepIndex = computed(() => {
  if (!props.doc) return 0;
  const status = props.doc.status;
  // Mapeia status para índice
  if (status === 'Uploaded') return 1;
  if (status === 'Processing IDP') return 1;
  if (status === 'Enriquecimento Pendente') return 2;
  if (status === 'Validacao Pendente') return 3;
  if (status === 'Raciocinio Pendente') return 4;
  if (['Aprovado', 'Rejeitado', 'Finalizado'].includes(status)) return 5;
  return 0;
});

// --- VALIDAÇÃO HUMANA ---
const editableData = ref(null);
watch(() => props.doc, (newDoc) => {
  if (newDoc?.status === 'Validacao Pendente' && idpData.value) {
    // Se já tivermos feito edições locais e o doc não mudou, mantemos (evita reset ao digitar)
    if (!editableData.value || editableData.value.docId !== newDoc.id) {
       editableData.value = JSON.parse(JSON.stringify(idpData.value));
       editableData.value.docId = newDoc.id; // Marca d'água interna
    }
  } else {
    editableData.value = null;
  }
}, { immediate: true, deep: true });

const handleHILSubmit = () => {
  if (editableData.value) {
    // Remove a marca interna antes de emitir
    const { docId, ...cleanData } = editableData.value;
    emit('validate', { docId: props.doc.id, data: cleanData });
  }
};

// --- PORTARIA ---
const portariaText = ref('');
const isGeneratingPortaria = ref(false);

const generateOfficialAct = async () => {
    if (portariaText.value) return;
    isGeneratingPortaria.value = true;
    try {
        const processContext = {
            nome: enrichedData.value?.nome || idpData.value?.keyFields?.find(f => f.field.includes('Nome'))?.value,
            cargo: enrichedData.value?.cargo,
            assunto: idpData.value?.documentType
        };
        // Chama a Cloud Function
        const text = await geminiApiService.generateDraft(processContext, rarData.value?.veredicto);
        portariaText.value = typeof text === 'string' ? text : text.response;
    } catch (e) {
        console.error(e);
        portariaText.value = "Erro na geração. Tente novamente.";
    } finally {
        isGeneratingPortaria.value = false;
    }
};
</script>

<template>
  <div v-if="!doc" class="flex flex-col items-center justify-center h-full text-gray-500 p-8 animate-fade-in">
    <div class="bg-slate-900 p-6 rounded-full mb-6 border border-slate-800">
        <FileSearch class="w-16 h-16 text-slate-700" />
    </div>
    <h2 class="text-xl font-bold text-slate-300">Área de Trabalho Vazia</h2>
    <p class="text-sm">Selecione um processo na barra lateral para começar.</p>
  </div>

  <div v-else class="flex flex-col h-full overflow-hidden bg-slate-950">
    
    <!-- STEPPER HEADER -->
    <div class="bg-slate-900 border-b border-slate-800 p-4 shrink-0 overflow-x-auto">
        <div class="flex items-center justify-between min-w-[600px] max-w-4xl mx-auto">
            <div v-for="(step, idx) in steps" :key="step.id" class="flex items-center relative">
                <!-- Linha conectora -->
                <div v-if="idx > 0" class="h-0.5 w-10 mx-2 transition-colors duration-500" 
                     :class="idx <= currentStepIndex ? 'bg-indigo-500' : 'bg-slate-700'"></div>
                
                <div class="flex flex-col items-center group">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all duration-500 z-10"
                         :class="[
                            idx < currentStepIndex ? 'bg-indigo-600 border-indigo-600 text-white' : 
                            idx === currentStepIndex ? 'bg-slate-900 border-indigo-500 text-indigo-400 animate-pulse' : 
                            'bg-slate-800 border-slate-600 text-slate-500'
                         ]">
                        <Check v-if="idx < currentStepIndex" class="w-4 h-4" />
                        <span v-else>{{ idx + 1 }}</span>
                    </div>
                    <span class="absolute top-9 text-[10px] font-medium uppercase tracking-wide whitespace-nowrap transition-colors duration-300"
                          :class="idx <= currentStepIndex ? 'text-indigo-300' : 'text-slate-600'">
                        {{ step.label }}
                    </span>
                </div>
            </div>
        </div>
    </div>

    <!-- MAIN CONTENT GRID -->
    <div class="flex-grow grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        
        <!-- LEFT: DOCUMENTO -->
        <div class="bg-slate-900/50 border-r border-slate-800 overflow-y-auto custom-scrollbar p-6 flex flex-col items-center">
            <VuePdfEmbed v-if="doc.fileUrl" :source="doc.fileUrl" class="shadow-2xl rounded-lg w-full max-w-xl border border-slate-700" />
            <div v-else class="text-center mt-20 w-full max-w-md">
                <div class="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-inner text-left">
                    <div class="flex items-center justify-between mb-4 border-b border-slate-600 pb-2">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Pré-visualização Texto</span>
                        <FileText class="w-4 h-4 text-slate-500"/>
                    </div>
                    <p class="whitespace-pre-wrap text-sm text-slate-300 font-mono leading-relaxed opacity-80">{{ doc.content }}</p>
                </div>
                <p class="text-xs text-slate-500 mt-4">Visualização PDF indisponível neste modo demo.</p>
            </div>
        </div>

        <!-- RIGHT: ANÁLISE E AÇÕES -->
        <div class="overflow-y-auto custom-scrollbar p-6 space-y-6 bg-slate-950">
            
            <!-- Header Status -->
            <div class="flex justify-between items-start">
                <div>
                    <h1 class="text-2xl font-bold text-white mb-1">{{ doc.name }}</h1>
                    <span class="text-xs text-slate-400 font-mono">{{ doc.id }}</span>
                </div>
                <div class="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 flex items-center text-xs font-bold uppercase tracking-wider" :class="getStatusDisplay(doc.status).color">
                    <component :is="getStatusDisplay(doc.status).icon" class="w-4 h-4 mr-2" :class="getStatusDisplay(doc.status).animate" />
                    {{ getStatusDisplay(doc.status).text }}
                </div>
            </div>

            <!-- CARD: DADOS EXTRAÍDOS (IDP) -->
            <div v-if="idpData" class="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div class="px-4 py-3 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center">
                    <h3 class="text-sm font-bold text-indigo-400 flex items-center"><Brain class="w-4 h-4 mr-2"/> Dados Extraídos (IA)</h3>
                    <span class="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">{{ idpData.documentType }}</span>
                </div>
                
                <!-- Modo Validação (HUMAN IN THE LOOP) -->
                <div v-if="editableData" class="p-4 bg-orange-900/10 border-b border-orange-500/30">
                    <div class="flex items-center mb-4 text-orange-400 text-sm font-bold">
                        <ListChecks class="w-5 h-5 mr-2" /> Validação Necessária
                    </div>
                    <div class="space-y-2">
                        <div v-for="(field, i) in editableData.keyFields" :key="i" class="flex items-center gap-2">
                            <span class="w-1/3 text-xs text-slate-400 text-right truncate">{{ field.field }}:</span>
                            <input v-model="field.value" class="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:border-orange-500 outline-none transition-colors" />
                        </div>
                    </div>
                    <button @click="handleHILSubmit" class="mt-4 w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 rounded-lg text-sm transition-colors shadow-lg">
                        Confirmar e Enviar para Agente
                    </button>
                </div>

                <!-- Modo Leitura (Read Only) -->
                <div v-else class="p-4 grid grid-cols-2 gap-4">
                    <div v-for="(field, i) in idpData.keyFields" :key="i" class="border-l-2 border-slate-700 pl-3">
                        <span class="block text-[10px] text-slate-500 uppercase">{{ field.field }}</span>
                        <span class="text-sm text-slate-200 font-medium">{{ field.value }}</span>
                    </div>
                </div>
            </div>

            <!-- CARD: ENRIQUECIMENTO (RH) -->
            <div v-if="enrichedData && Object.keys(enrichedData).length" class="bg-slate-900 rounded-xl border border-slate-800 p-4 relative overflow-hidden group">
                <div class="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ShieldAlert class="w-24 h-24 text-purple-500" />
                </div>
                <h3 class="text-sm font-bold text-purple-400 mb-3 flex items-center relative z-10">
                    <UserCheck class="w-4 h-4 mr-2"/> Dados Funcionais (Ergon/RH)
                </h3>
                <div class="grid grid-cols-2 gap-y-2 relative z-10">
                    <div v-for="(val, key) in enrichedData" :key="key">
                        <span class="text-[10px] text-slate-500 block uppercase">{{ key.replace(/_/g, ' ') }}</span>
                        <span class="text-sm text-white">{{ val }}</span>
                    </div>
                </div>
            </div>

            <!-- CARD: VEREDITO (RACIONAL) -->
            <div v-if="rarData?.veredicto" class="rounded-xl border p-5 shadow-lg transition-all"
                 :class="rarData.veredicto.status === 'Aprovado' ? 'bg-gradient-to-br from-green-900/20 to-slate-900 border-green-500/50' : 'bg-gradient-to-br from-red-900/20 to-slate-900 border-red-500/50'">
                
                <div class="flex justify-between items-start mb-4">
                    <h2 class="text-xl font-bold flex items-center" :class="rarData.veredicto.status === 'Aprovado' ? 'text-green-400' : 'text-red-400'">
                        <component :is="rarData.veredicto.status === 'Aprovado' ? Check : ShieldAlert" class="w-6 h-6 mr-2" />
                        {{ rarData.veredicto.status }}
                    </h2>
                    <span class="text-xs text-slate-500 border border-slate-700 rounded px-2 py-1">IA Confidence: High</span>
                </div>

                <div class="bg-black/20 rounded-lg p-4 mb-4 backdrop-blur-sm">
                    <p class="text-sm text-slate-200 leading-relaxed">{{ rarData.veredicto.parecer }}</p>
                </div>

                <!-- Chain of Thought Expansível -->
                <details class="group">
                    <summary class="text-xs text-slate-500 cursor-pointer hover:text-slate-300 list-none flex items-center">
                        <Brain class="w-3 h-3 mr-1" /> Ver Raciocínio da IA (Chain of Thought)
                        <span class="ml-auto opacity-0 group-hover:opacity-100 text-[10px] transition-opacity">Mostrar mais</span>
                    </summary>
                    <div class="mt-2 p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono text-slate-400 whitespace-pre-wrap leading-normal">
                        {{ rarData.chainOfThought }}
                    </div>
                </details>
            </div>

            <!-- AÇÕES FINAIS -->
            <div v-if="rarData?.veredicto?.status === 'Aprovado'" class="pt-4 border-t border-slate-800">
                <button @click="generateOfficialAct" :disabled="isGeneratingPortaria" 
                        class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                    <Loader2 v-if="isGeneratingPortaria" class="w-5 h-5 mr-2 animate-spin" />
                    <FileSignature v-else class="w-5 h-5 mr-2" />
                    {{ isGeneratingPortaria ? 'Redigindo...' : 'Gerar Minuta de Portaria' }}
                </button>

                <div v-if="portariaText" class="mt-4 bg-white text-slate-900 p-6 rounded-lg shadow-xl font-serif text-sm leading-relaxed animate-slide-up relative">
                    <div class="absolute top-0 left-0 w-full h-1 bg-green-500 rounded-t-lg"></div>
                    <h3 class="text-center font-bold mb-4 uppercase text-xs tracking-widest text-slate-500">Minuta Oficial</h3>
                    <div class="whitespace-pre-wrap">{{ portariaText }}</div>
                </div>
            </div>

            <div class="flex justify-end pt-6">
                <button @click="emit('delete', doc.id)" class="text-xs text-red-400 hover:text-red-300 flex items-center transition-colors">
                    <Trash2 class="w-3 h-3 mr-1" /> Excluir Registro
                </button>
            </div>

        </div>
    </div>
  </div>
</template>