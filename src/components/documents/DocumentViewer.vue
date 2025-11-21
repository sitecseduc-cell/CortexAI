<script setup>
import { ref, computed, watch } from 'vue';
import { safeParse, getStatusDisplay } from '@/utils/helpers';
import { 
  Trash2, Brain, FileSearch, UserCheck, ListChecks, 
  GraduationCap, AlertTriangle, FileText, Loader2, FileSignature 
} from 'lucide-vue-next';
import VuePdfEmbed from 'vue-pdf-embed';
import { geminiApiService } from '@/services/geminiService';

const props = defineProps(['doc']);
const emit = defineEmits(['validate', 'delete']);

// --- PARSING DE DADOS ---
const idpData = computed(() => safeParse(props.doc?.idpResult));
const nlpData = computed(() => safeParse(props.doc?.nlpResult));
const rarData = computed(() => safeParse(props.doc?.rarResult));
const enrichedData = computed(() => safeParse(props.doc?.enrichedData));

// --- LÓGICA DE VALIDAÇÃO HUMANA (HIL) ---
const editableData = ref(null);

watch(() => props.doc, (newDoc) => {
  if (newDoc?.status === 'Validacao Pendente' && idpData.value) {
    editableData.value = JSON.parse(JSON.stringify(idpData.value));
  } else {
    editableData.value = null;
  }
}, { immediate: true, deep: true });

const handleHILSubmit = () => {
  if (editableData.value) {
    emit('validate', { docId: props.doc.id, data: editableData.value });
  }
};

// --- LÓGICA DE GERAÇÃO DE PORTARIA (NOVA) ---
const portariaText = ref('');
const isGeneratingPortaria = ref(false);

const generateOfficialAct = async () => {
    if (portariaText.value) return; // Evita re-gerar se já existe
    
    isGeneratingPortaria.value = true;
    try {
        // Prepara os dados para a IA
        const processContext = {
            nome: enrichedData.value?.nome || idpData.value?.keyFields?.find(f => f.field === 'Nome')?.value || "Servidor",
            cargo: enrichedData.value?.cargo || "Cargo não informado",
            matricula: enrichedData.value?.matricula || "Matrícula pendente",
            assunto: idpData.value?.documentType || "Assunto Administrativo"
        };

        // Chama o serviço (garanta que o método generateDraft existe no seu geminiService.js)
        // Se você nomeou como 'generatePortaria' no serviço, ajuste aqui.
        const text = await geminiApiService.generateDraft(
            processContext, 
            rarData.value?.veredicto
        );
        
        // Tratamento se a resposta vier como objeto ou string
        portariaText.value = typeof text === 'string' ? text : text.response || JSON.stringify(text);
        
    } catch (e) {
        console.error(e);
        alert("Erro ao gerar a minuta da portaria. Verifique o console.");
    } finally {
        isGeneratingPortaria.value = false;
    }
};

// --- HELPERS VISUAIS ---
const statusDisplay = computed(() => getStatusDisplay(props.doc?.status));

const getConfidenceColor = (c) => {
  if (!c) return 'text-gray-500';
  return c >= 0.95 ? 'text-green-400' : c >= 0.85 ? 'text-yellow-400' : 'text-red-400';
};
</script>

<template>
  <div v-if="!doc" class="flex flex-col items-center justify-center h-full text-gray-500 p-8 animate-fade-in">
    <FileSearch class="w-16 h-16 mb-4 text-slate-700" />
    <h2 class="text-2xl font-bold text-slate-400">Selecione um Processo</h2>
    <p>Clique em um item da lista à esquerda para ver os detalhes.</p>
  </div>

  <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-full overflow-hidden animate-fade-in">
    
    <div class="bg-slate-900 rounded-xl border border-slate-700 overflow-y-auto custom-scrollbar p-4 flex flex-col h-full">
      <h3 class="text-sm font-bold text-slate-400 mb-4 flex items-center sticky top-0 bg-slate-900 py-2 z-10 shrink-0">
        <FileText class="w-4 h-4 mr-2" /> Documento Original
      </h3>
      <div class="flex-grow flex items-center justify-center min-h-[300px]">
        <VuePdfEmbed v-if="doc.fileUrl" :source="doc.fileUrl" class="shadow-lg w-full" />
        <div v-else class="text-center text-slate-500 w-full">
          <p class="mb-2">Pré-visualização indisponível.</p>
          <div class="bg-slate-800 p-6 rounded-lg border border-slate-700 text-left max-w-lg mx-auto">
             <h4 class="text-xs font-bold text-slate-400 uppercase mb-2">Conteúdo Extraído (Simulação):</h4>
             <p class="whitespace-pre-wrap text-sm text-slate-300 italic leading-relaxed font-mono">{{ doc.content }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="overflow-y-auto custom-scrollbar pr-2 pb-20 h-full">
      
      <div class="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
        <h1 class="text-3xl font-extrabold text-white truncate pr-4">{{ doc.name }}</h1>
        <div class="flex items-center text-lg font-medium shrink-0" :class="statusDisplay.color">
          <component :is="statusDisplay.icon" class="w-6 h-6 mr-2" :class="statusDisplay.animate" />
          <span>{{ statusDisplay.text }}</span>
        </div>
      </div>

      <div v-if="editableData" class="bg-orange-900/20 border border-orange-500 p-6 rounded-xl mb-6 shadow-lg animate-slide-up">
        <div class="flex items-start mb-4">
            <ListChecks class="w-8 h-8 mr-3 text-orange-400 shrink-0" />
            <div>
                <h2 class="text-2xl font-bold text-orange-400">Validação Humana Requerida</h2>
                <p class="text-orange-200/80 text-sm">Confirme os dados extraídos antes da análise jurídica.</p>
            </div>
        </div>

        <div class="space-y-3">
          <div v-for="(field, index) in editableData.keyFields" :key="index" class="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-800 p-3 rounded border border-slate-700">
            <label class="text-slate-300 font-medium w-full sm:w-1/3 flex items-center text-sm">
              {{ field.field }} 
              <span class="text-[10px] ml-2 px-1 rounded bg-slate-900 text-slate-500">{{ Math.round((field.confidence || 0) * 100) }}%</span>
            </label>
            <input v-model="field.value" class="w-full sm:w-2/3 p-2 rounded bg-slate-950 border border-slate-600 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
        </div>
        
        <button @click="handleHILSubmit" class="mt-4 w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-lg flex items-center justify-center">
          <Brain class="w-5 h-5 mr-2" /> Confirmar Dados
        </button>
      </div>

      <div v-if="rarData?.veredicto" class="p-6 rounded-xl mb-6 shadow-xl border transition-all duration-500"
           :class="rarData.veredicto.status === 'Aprovado' ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500'">
        <h2 class="text-2xl font-bold mb-3 flex items-center" 
            :class="rarData.veredicto.status === 'Aprovado' ? 'text-green-400' : 'text-red-400'">
          <UserCheck class="w-7 h-7 mr-3" /> Veredito: {{ rarData.veredicto.status }}
        </h2>
        <p class="text-gray-200 text-lg leading-relaxed">{{ rarData.veredicto.parecer }}</p>
      </div>

      <div v-if="rarData?.veredicto?.status === 'Aprovado'" class="mb-6 animate-fade-in">
        <div v-if="!portariaText">
            <button 
                @click="generateOfficialAct" 
                :disabled="isGeneratingPortaria"
                class="w-full py-3 bg-slate-800 border border-slate-600 text-indigo-300 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 rounded-xl transition-all flex items-center justify-center font-semibold shadow-lg group"
            >
                <Loader2 v-if="isGeneratingPortaria" class="w-5 h-5 mr-2 animate-spin" />
                <FileSignature v-else class="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                {{ isGeneratingPortaria ? 'Redigindo documento oficial...' : 'Gerar Minuta de Portaria' }}
            </button>
        </div>
        
        <div v-else class="bg-white text-slate-900 p-6 rounded-lg shadow-2xl relative font-serif">
            <div class="absolute top-0 left-0 w-full h-2 bg-green-600 rounded-t-lg"></div>
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-xs font-bold uppercase text-slate-500 tracking-widest">Minuta Oficial</h3>
                <button @click="portariaText = ''" class="text-slate-400 hover:text-red-500"><Trash2 class="w-4 h-4"/></button>
            </div>
            <div class="whitespace-pre-wrap text-sm leading-relaxed border-l-4 border-slate-200 pl-4">
                {{ portariaText }}
            </div>
            <div class="mt-4 pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button class="text-xs font-bold text-indigo-600 hover:underline">Baixar PDF</button>
                <button class="text-xs font-bold text-slate-600 hover:underline">Copiar Texto</button>
            </div>
        </div>
      </div>

      <div v-if="rarData?.chainOfThought" class="bg-slate-800 p-5 rounded-xl border border-slate-700 mb-6 shadow-lg">
        <h3 class="text-lg font-semibold mb-3 text-white flex items-center">
          <Brain class="w-5 h-5 mr-2 text-yellow-400" /> Análise Detalhada (CoT)
        </h3>
        <div class="bg-slate-950 p-4 rounded-lg border border-slate-800 overflow-x-auto max-h-60 overflow-y-auto custom-scrollbar">
            <pre class="whitespace-pre-wrap text-xs font-mono text-slate-400 leading-relaxed">{{ rarData.chainOfThought }}</pre>
        </div>
      </div>

      <div class="mt-8 pt-4 border-t border-slate-800 flex justify-end">
        <button @click="emit('delete', doc.id)" class="flex items-center px-4 py-2 bg-red-900/20 text-red-400 border border-red-900/50 rounded-lg hover:bg-red-900 hover:text-white transition-colors text-sm font-medium">
            <Trash2 class="w-4 h-4 mr-2" /> Deletar Processo
        </button>
      </div>

    </div>
  </div>
</template>