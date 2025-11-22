<script setup>
import { ref, computed } from 'vue';
import { Upload, Search, FileText, Loader2, Filter, ChevronRight } from 'lucide-vue-next';
import { getStatusDisplay } from '@/utils/helpers';

const props = defineProps(['documents', 'selectedId']);
const emit = defineEmits(['select', 'upload']);

const searchTerm = ref('');
const filterStatus = ref('All');

const filteredDocuments = computed(() => {
  if (!props.documents) return [];
  return props.documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.value.toLowerCase());
    const matchesFilter = filterStatus.value === 'All' || doc.status === filterStatus.value;
    return matchesSearch && matchesFilter;
  });
});

const filters = [
    { label: 'Todos', value: 'All' },
    { label: 'Pendentes', value: 'Validacao Pendente' },
    { label: 'Aprovados', value: 'Aprovado' },
];
</script>

<template>
  <aside class="w-full h-full flex flex-col glass border-r-0 z-20 relative">
    
    <!-- Header de Busca -->
    <div class="p-5 border-b border-white/5 space-y-4">
      <div class="relative group">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
        <input 
            type="text" 
            placeholder="Buscar processo..." 
            v-model="searchTerm"
            class="w-full pl-10 py-2.5 bg-slate-950/50 text-slate-200 rounded-xl border border-white/5 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all text-sm placeholder-slate-600" 
        />
      </div>

      <div class="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
          <button 
              v-for="f in filters" 
              :key="f.value"
              @click="filterStatus = f.value"
              class="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide whitespace-nowrap transition-all border"
              :class="filterStatus === f.value ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-sm' : 'bg-slate-800/30 border-transparent text-slate-500 hover:bg-slate-800 hover:text-slate-300'"
          >
              {{ f.label }}
          </button>
      </div>
    </div>

    <!-- Botão de Ação -->
    <div class="px-5 pt-4 pb-2">
      <button 
        @click="emit('upload')" 
        class="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-900/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5 transition-all duration-300 group"
      >
        <Upload class="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> 
        <span>Novo Processo</span>
      </button>
    </div>

    <!-- Lista de Documentos -->
    <div class="flex-grow overflow-y-auto p-3 space-y-2 custom-scrollbar">
      <div v-if="!documents" class="flex flex-col items-center justify-center py-12 text-indigo-400/50">
          <Loader2 class="w-8 h-8 animate-spin mb-2" />
          <span class="text-xs">Sincronizando...</span>
      </div>

      <div v-else-if="filteredDocuments.length === 0" class="text-center py-12">
          <div class="bg-slate-800/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border border-white/5">
            <FileText class="w-6 h-6 text-slate-600" />
          </div>
          <p class="text-slate-500 text-sm">Nenhum processo encontrado.</p>
      </div>

      <div 
        v-else
        v-for="doc in filteredDocuments" 
        :key="doc.id" 
        @click="emit('select', doc.id)"
        class="p-4 rounded-xl cursor-pointer border transition-all duration-300 group relative overflow-hidden"
        :class="doc.id === selectedId ? 'bg-indigo-900/10 border-indigo-500/30 shadow-md' : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'"
      >
        <!-- Indicador de Seleção -->
        <div v-if="doc.id === selectedId" class="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>

        <div class="flex justify-between items-start mb-2 pl-2">
          <h3 class="font-medium truncate text-sm w-10/12 transition-colors" :class="doc.id === selectedId ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'">
              {{ doc.name }}
          </h3>
          <ChevronRight v-if="doc.id === selectedId" class="w-4 h-4 text-indigo-400" />
        </div>
        
        <div class="flex items-center justify-between pl-2">
            <div class="flex items-center gap-2">
                <component 
                    :is="getStatusDisplay(doc.status).icon" 
                    class="w-3.5 h-3.5" 
                    :class="[getStatusDisplay(doc.status).color, getStatusDisplay(doc.status).animate]" 
                />
                <span class="text-[10px] font-medium" :class="getStatusDisplay(doc.status).color">
                    {{ getStatusDisplay(doc.status).text }}
                </span>
            </div>
            <span class="text-[10px] text-slate-600 font-mono">
                {{ new Date(doc.timestamp || Date.now()).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}) }}
            </span>
        </div>
      </div>
    </div>
  </aside>
</template>

