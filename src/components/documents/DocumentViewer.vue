<script setup>
import { ref, computed, watch } from 'vue';
import { safeParse, getStatusDisplay } from '@/utils/helpers';
import { Trash2, Brain, FileSearch, UserCheck, ListChecks, GraduationCap, AlertTriangle } from 'lucide-vue-next';
import VuePdfEmbed from 'vue-pdf-embed'

const props = defineProps(['doc']);
const emit = defineEmits(['validate', 'delete']);

// --- PARSING DE DADOS ---
// Transforma as strings JSON do banco de dados em objetos JavaScript usáveis
const idpData = computed(() => safeParse(props.doc?.idpResult));
const nlpData = computed(() => safeParse(props.doc?.nlpResult));
const rarData = computed(() => safeParse(props.doc?.rarResult)); // Dados do Agente (Raciocínio)
const enrichedData = computed(() => safeParse(props.doc?.enrichedData)); // Dados de RH

// --- LÓGICA DE VALIDAÇÃO HUMANA (HIL) ---
const editableData = ref(null);

// Monitora o documento para ativar o modo de edição se necessário
watch(() => props.doc, (newDoc) => {
  if (newDoc?.status === 'Validacao Pendente' && idpData.value) {
    // Clona os dados para permitir edição sem alterar o original imediatamente
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

  <div v-else class="p-6 pb-20 animate-fade-in">
    
    <div class="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
      <h1 class="text-3xl font-extrabold text-white truncate pr-4">{{ doc.name }}</h1>
      <div class="flex items-center text-lg font-medium shrink-0" :class="statusDisplay.color">
        <component :is="statusDisplay.icon" class="w-6 h-6 mr-2" :class="statusDisplay.animate" />
        <span>{{ statusDisplay.text }}</span>
  <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-full overflow-hidden animate-fade-in">
    <!-- Coluna Esquerda: Visualizador de Documento -->
    <div class="bg-slate-900 rounded-xl border border-slate-700 overflow-y-auto custom-scrollbar p-4 flex flex-col">
      <h3 class="text-sm font-bold text-slate-400 mb-4 flex items-center sticky top-0 bg-slate-900 py-2 z-10 shrink-0">
        <FileText class="w-4 h-4 mr-2" /> Documento Original
      </h3>
      <div class="flex-grow flex items-center justify-center">
        <VuePdfEmbed v-if="doc.fileUrl" :source="doc.fileUrl" class="shadow-lg w-full" />
        <div v-else class="text-center text-slate-500">
          <p class="mb-2">Pré-visualização indisponível.</p>
          <h4 class="text-sm font-semibold mb-2 text-white">Conteúdo Simulado:</h4>
          <p class="whitespace-pre-wrap text-sm text-slate-300 italic leading-relaxed max-w-md mx-auto bg-slate-800 p-4 rounded-lg">{{ doc.content }}</p>
        </div>
      </div>
    </div>

    <div v-if="rarData?.veredicto" class="p-6 rounded-xl mb-6 shadow-xl border transition-all duration-500"
         :class="rarData.veredicto.status === 'Aprovado' ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500'">
      <h2 class="text-2xl font-bold mb-3 flex items-center" 
          :class="rarData.veredicto.status === 'Aprovado' ? 'text-green-400' : 'text-red-400'">
        <UserCheck class="w-7 h-7 mr-3" /> Veredito Final: {{ rarData.veredicto.status }}
      </h2>
      <p class="text-gray-200 text-lg leading-relaxed">{{ rarData.veredicto.parecer }}</p>
    </div>
    <!-- Coluna Direita: Detalhes e Metadados -->
    <div class="overflow-y-auto custom-scrollbar pr-2 pb-20">
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
              <p class="text-orange-200/80 text-sm">A IA processou os dados, mas precisa da sua confirmação antes de enviar para o Agente de Análise.</p>
          </div>
      <div v-if="rarData?.veredicto" class="p-6 rounded-xl mb-6 shadow-xl border transition-all duration-500"
           :class="rarData.veredicto.status === 'Aprovado' ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500'">
        <h2 class="text-2xl font-bold mb-3 flex items-center"
            :class="rarData.veredicto.status === 'Aprovado' ? 'text-green-400' : 'text-red-400'">
          <UserCheck class="w-7 h-7 mr-3" /> Veredito Final: {{ rarData.veredicto.status }}
        </h2>
        <p class="text-gray-200 text-lg leading-relaxed">{{ rarData.veredicto.parecer }}</p>
      </div>

      <div class="bg-slate-900/50 p-4 rounded-lg space-y-3 border border-orange-500/30">
        <div v-if="enrichedData && Object.keys(enrichedData).length" class="mb-4 p-3 bg-purple-900/30 rounded border border-purple-500/30">
            <h4 class="text-xs uppercase tracking-wide text-purple-300 mb-2 font-bold flex items-center"><GraduationCap class="w-4 h-4 mr-1"/> Dados RH Encontrados</h4>
            <div v-for="(value, key) in enrichedData" :key="key" class="flex justify-between text-sm mb-1 last:mb-0">
                <span class="text-purple-200 font-medium capitalize">{{ key.replace(/_/g, ' ') }}:</span>
                <span class="text-white font-bold">{{ value }}</span>
      <div v-if="editableData" class="bg-orange-900/20 border border-orange-500 p-6 rounded-xl mb-6 shadow-lg animate-slide-up">
        <div class="flex items-start mb-4">
            <ListChecks class="w-8 h-8 mr-3 text-orange-400 shrink-0" />
            <div>
                <h2 class="text-2xl font-bold text-orange-400">Validação Humana Requerida</h2>
                <p class="text-orange-200/80 text-sm">A IA processou os dados, mas precisa da sua confirmação antes de enviar para o Agente de Análise.</p>
            </div>
        </div>

        <h4 class="text-xs uppercase tracking-wide text-slate-400 mb-2 font-bold">Dados Extraídos (Editável)</h4>
        <div v-for="(field, index) in editableData.keyFields" :key="index" class="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-800 p-3 rounded border border-slate-700 hover:border-indigo-500 transition-colors">
          <label class="text-slate-300 font-medium w-full sm:w-1/3 mb-1 sm:mb-0 flex items-center">
            {{ field.field }} 
            <span class="text-xs ml-2 font-mono" :class="getConfidenceColor(field.confidence)" v-if="field.confidence">
                {{ Math.round(field.confidence * 100) }}%
            </span>
          </label>
          <input v-model="field.value" class="w-full sm:w-2/3 p-2 rounded bg-slate-950 border border-slate-600 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
        <div class="bg-slate-900/50 p-4 rounded-lg space-y-3 border border-orange-500/30">
          <div v-if="enrichedData && Object.keys(enrichedData).length" class="mb-4 p-3 bg-purple-900/30 rounded border border-purple-500/30">
              <h4 class="text-xs uppercase tracking-wide text-purple-300 mb-2 font-bold flex items-center"><GraduationCap class="w-4 h-4 mr-1"/> Dados RH Encontrados</h4>
              <div v-for="(value, key) in enrichedData" :key="key" class="flex justify-between text-sm mb-1 last:mb-0">
                  <span class="text-purple-200 font-medium capitalize">{{ key.replace(/_/g, ' ') }}:</span>
                  <span class="text-white font-bold">{{ value }}</span>
              </div>
          </div>

          <h4 class="text-xs uppercase tracking-wide text-slate-400 mb-2 font-bold">Dados Extraídos (Editável)</h4>
          <div v-for="(field, index) in editableData.keyFields" :key="index" class="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-800 p-3 rounded border border-slate-700 hover:border-indigo-500 transition-colors">
            <label class="text-slate-300 font-medium w-full sm:w-1/3 mb-1 sm:mb-0 flex items-center">
              {{ field.field }}
              <span class="text-xs ml-2 font-mono" :class="getConfidenceColor(field.confidence)" v-if="field.confidence">
                  {{ Math.round(field.confidence * 100) }}%
              </span>
            </label>
            <input v-model="field.value" class="w-full sm:w-2/3 p-2 rounded bg-slate-950 border border-slate-600 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
          </div>
        </div>
      </div>
      
      <button @click="handleHILSubmit" class="mt-4 w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-lg flex items-center justify-center">
        <Brain class="w-5 h-5 mr-2" /> Confirmar e Enviar para Análise
      </button>
    </div>

    <div v-if="rarData?.chainOfThought" class="bg-slate-800 p-5 rounded-xl border border-slate-700 mb-6 shadow-lg">
      <h3 class="text-xl font-semibold mb-3 text-white flex items-center">
        <Brain class="w-6 h-6 mr-2 text-yellow-400" /> Raciocínio do Agente (Chain of Thought)
      </h3>
      <div class="bg-slate-950 p-4 rounded-lg border border-slate-800 overflow-x-auto">
          <pre class="whitespace-pre-wrap text-sm font-mono text-slate-300 leading-relaxed">{{ rarData.chainOfThought }}</pre>
        <button @click="handleHILSubmit" class="mt-4 w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-lg flex items-center justify-center">
          <Brain class="w-5 h-5 mr-2" /> Confirmar e Enviar para Análise
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-md h-fit">
            <h3 class="text-lg font-semibold mb-3 text-white border-b border-slate-700 pb-2">Conteúdo Original (Simulado)</h3>
            <p class="whitespace-pre-wrap text-sm text-slate-300 italic leading-relaxed">{{ doc.content }}</p>
      <div v-if="rarData?.chainOfThought" class="bg-slate-800 p-5 rounded-xl border border-slate-700 mb-6 shadow-lg">
        <h3 class="text-xl font-semibold mb-3 text-white flex items-center">
          <Brain class="w-6 h-6 mr-2 text-yellow-400" /> Raciocínio do Agente (Chain of Thought)
        </h3>
        <div class="bg-slate-950 p-4 rounded-lg border border-slate-800 overflow-x-auto">
            <pre class="whitespace-pre-wrap text-sm font-mono text-slate-300 leading-relaxed">{{ rarData.chainOfThought }}</pre>
        </div>
        
        <div class="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-md h-fit">
             <h3 class="text-lg font-semibold mb-3 text-white border-b border-slate-700 pb-2 flex items-center">
                <FileSearch class="w-5 h-5 mr-2 text-indigo-400"/> Metadados da IA
             </h3>
             <div v-if="idpData" class="space-y-3 text-sm">
                <div class="flex justify-between">
                    <span class="text-slate-400">Tipo de Documento:</span>
                    <span class="text-indigo-300 font-bold">{{ idpData.documentType }}</span>
                </div>
                <div class="border-t border-slate-700 pt-2">
                    <p class="text-slate-500 text-xs uppercase font-bold mb-2">Campos Chave</p>
                    <ul class="space-y-1">
                        <li v-for="(f, i) in idpData.keyFields" :key="i" class="flex justify-between">
                            <span class="text-slate-300">{{ f.field }}:</span>
                            <span class="text-white font-medium">{{ f.value }}</span>
                        </li>
                    </ul>
                </div>
                <div v-if="nlpData?.sentiment" class="border-t border-slate-700 pt-2 flex justify-between">
                     <span class="text-slate-400">Sentimento Detectado:</span>
                     <span :class="nlpData.sentiment === 'Positivo' ? 'text-green-400' : 'text-red-400'">{{ nlpData.sentiment }}</span>
                </div>
             </div>
             <p v-else class="text-slate-500 text-center py-4">Aguardando processamento...</p>
        </div>
    </div>
      </div>

    <div class="mt-8 pt-4 border-t border-slate-800 flex justify-end">
      <div class="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-md h-fit">
           <h3 class="text-lg font-semibold mb-3 text-white border-b border-slate-700 pb-2 flex items-center">
              <FileSearch class="w-5 h-5 mr-2 text-indigo-400"/> Metadados da IA
           </h3>
           <div v-if="idpData" class="space-y-3 text-sm">
              <div class="flex justify-between">
                  <span class="text-slate-400">Tipo de Documento:</span>
                  <span class="text-indigo-300 font-bold">{{ idpData.documentType }}</span>
              </div>
              <div class="border-t border-slate-700 pt-2">
                  <p class="text-slate-500 text-xs uppercase font-bold mb-2">Campos Chave</p>
                  <ul class="space-y-1">
                      <li v-for="(f, i) in idpData.keyFields" :key="i" class="flex justify-between">
                          <span class="text-slate-300">{{ f.field }}:</span>
                          <span class="text-white font-medium">{{ f.value }}</span>
                      </li>
                  </ul>
              </div>
              <div v-if="nlpData?.sentiment" class="border-t border-slate-700 pt-2 flex justify-between">
                   <span class="text-slate-400">Sentimento Detectado:</span>
                   <span :class="nlpData.sentiment === 'Positivo' ? 'text-green-400' : 'text-red-400'">{{ nlpData.sentiment }}</span>
              </div>
           </div>
           <p v-else class="text-slate-500 text-center py-4">Aguardando processamento...</p>
      </div>

      <div class="mt-8 pt-4 border-t border-slate-800 flex justify-end">
        <button @click="emit('delete', doc.id)" class="flex items-center px-4 py-2 bg-red-900/50 text-red-200 border border-red-800 rounded-lg hover:bg-red-900 transition-colors">
            <Trash2 class="w-4 h-4 mr-2" /> Deletar Processo
          <Trash2 class="w-4 h-4 mr-2" /> Deletar Processo
        </button>
      </div>
    </div>

  </div>
</template>

</script>
<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
      
      <div class="bg-slate-900 rounded-xl border border-slate-700 overflow-y-auto custom-scrollbar p-4">
          <h3 class="text-sm font-bold text-slate-400 mb-4 flex items-center sticky top-0 bg-slate-900 py-2 z-10">
              <FileText class="w-4 h-4 mr-2"/> Documento Original
          </h3>
          <VuePdfEmbed v-if="doc.fileUrl" :source="doc.fileUrl" class="shadow-lg" />
          <div v-else class="text-center text-slate-500 mt-10">
              Pré-visualização indisponível para este arquivo.
          </div>
      </div>

      <div class="overflow-y-auto custom-scrollbar pr-2">
          </div>
  </div>
</template>