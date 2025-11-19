<script setup>
import { ref, computed } from 'vue';
import { Upload, Search, FileText, Loader2, Filter } from 'lucide-vue-next';
import { getStatusDisplay } from '@/utils/helpers';

// Recebe a lista completa de documentos do Pai (PlatformView)
const props = defineProps(['documents', 'selectedId']);
const emit = defineEmits(['select', 'upload']);

// Estado local para filtros (igual ao original React)
const searchTerm = ref('');
const filterStatus = ref('All');

// Lógica de Filtragem Local
const filteredDocuments = computed(() => {
  if (!props.documents) return [];
  
  return props.documents.filter(doc => {
    // Filtro por Texto (Nome)
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.value.toLowerCase());
    
    // Filtro por Status
    const matchesFilter = filterStatus.value === 'All' || doc.status === filterStatus.value;
    
    return matchesSearch && matchesFilter;
  });
});

// Opções de filtro rápido
const filters = [
    { label: 'Todos', value: 'All' },
    { label: 'Pendentes', value: 'Validacao Pendente' },
    { label: 'Aprovados', value: 'Aprovado' },
    { label: 'Rejeitados', value: 'Rejeitado' }
];
</script>

<template>
  <aside class="w-1/4 min-w-[320px] bg-slate-800 border-r border-slate-700 flex flex-col h-full shadow-xl z-20">
    
    <div class="p-4 border-b border-slate-700 bg-slate-800/50">
      <div class="relative group">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
        <input 
            type="text" 
            placeholder="Pesquisar processo..." 
            v-model="searchTerm"
            class="w-full pl-10 py-2.5 bg-slate-900 text-slate-200 rounded-lg border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm" 
        />
      </div>
    </div>

    <div class="p-3 border-b border-slate-700 flex gap-2 overflow-x-auto custom-scrollbar">
        <button 
            v-for="f in filters" 
            :key="f.value"
            @click="filterStatus = f.value"
            class="px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors"
            :class="filterStatus === f.value ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'"
        >
            {{ f.label }}
        </button>
    </div>

    <div class="p-4 border-b border-slate-700">
      <button 
        @click="emit('upload')" 
        class="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
      >
        <Upload class="w-5 h-5 mr-2" /> Novo Processo
      </button>
    </div>

    <div class="flex-grow overflow-y-auto p-3 space-y-2 custom-scrollbar">
      <div v-if="!documents" class="flex justify-center py-8">
          <Loader2 class="w-8 h-8 text-indigo-500 animate-spin" />
      </div>

      <div v-else-if="filteredDocuments.length === 0" class="text-center py-8 text-slate-500 text-sm">
          <FileText class="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p>Nenhum processo encontrado.</p>
      </div>

      <div 
        v-else
        v-for="doc in filteredDocuments" 
        :key="doc.id" 
        @click="emit('select', doc.id)"
        class="p-3 rounded-lg cursor-pointer border transition-all duration-200 group relative overflow-hidden"
        :class="doc.id === selectedId ? 'bg-indigo-600/20 border-indigo-500 shadow-md' : 'bg-slate-800 border-transparent hover:bg-slate-700 hover:border-slate-600'"
      >
        <div v-if="doc.id === selectedId" class="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>

        <div class="flex justify-between items-start mb-1 pl-2">
          <h3 class="font-semibold truncate text-sm text-slate-200 w-10/12" :class="{'text-indigo-300': doc.id === selectedId}">
              {{ doc.name }}
          </h3>
          <component 
            :is="getStatusDisplay(doc.status).icon" 
            class="w-4 h-4 shrink-0" 
            :class="[getStatusDisplay(doc.status).color, getStatusDisplay(doc.status).animate]" 
          />
        </div>
        
        <div class="flex items-center justify-between pl-2 mt-2">
            <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-900/50" :class="getStatusDisplay(doc.status).color">
                {{ getStatusDisplay(doc.status).text }}
            </span>
            <span class="text-[10px] text-slate-500">
                {{ new Date(doc.timestamp || Date.now()).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}) }}
            </span>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
/* Scrollbar customizada e fina para a sidebar */
.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
</style>