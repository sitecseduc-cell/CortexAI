<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
        <ListChecks class="w-6 h-6 text-blue-600" />
        Fila de Processos
      </h2>
      <span class="text-sm text-gray-500">
        {{ sortedDocuments.length }} documentos aguardando análise
      </span>
    </div>

    <div v-if="loading" class="flex justify-center py-10">
      <Loader2 class="w-8 h-8 animate-spin text-blue-600" />
    </div>

    <div v-else-if="sortedDocuments.length === 0" class="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
      <p class="text-gray-500">Nenhum documento pendente na fila.</p>
    </div>

    <div v-else class="space-y-3">
      <div 
        v-for="doc in sortedDocuments" 
        :key="doc.id"
        class="p-4 bg-white rounded-r-lg shadow-sm border border-gray-100 transition-all hover:shadow-md flex justify-between items-center group"
        :class="getPriorityConfig(doc.type).class" 
      >
        <div class="flex items-start gap-4">
          <div class="mt-1 p-2 rounded-full bg-white/50">
             <component :is="getIcon(getPriorityConfig(doc.type).icon)" class="w-5 h-5 text-gray-700" />
          </div>

          <div>
            <h3 class="font-bold text-gray-800 text-lg">{{ doc.title }}</h3>
            
            <div class="flex items-center gap-2 mt-1">
              <span 
                class="text-xs font-bold px-2 py-0.5 rounded border shadow-sm"
                :class="[getPriorityConfig(doc.type).class, 'bg-white bg-opacity-60']"
              >
                {{ getPriorityConfig(doc.type).label }}
              </span>
              
              <span class="text-xs text-gray-500 flex items-center gap-1">
                <Clock class="w-3 h-3" />
                {{ formatDate(doc.createdAt) }}
              </span>
            </div>
            
            <p class="text-sm text-gray-600 mt-1 line-clamp-1">
              {{ doc.description || 'Sem descrição prévia.' }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button 
            @click="handleAnalyze(doc)"
            class="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors flex items-center gap-2 shadow-sm"
          >
            <FileSearch class="w-4 h-4" />
            Analisar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  Loader2, 
  ListChecks, 
  Clock, 
  FileSearch, 
  AlertTriangle, 
  FileText 
} from 'lucide-vue-next';

// Importando nossos helpers testados
import { getPriorityConfig, sortDocumentsByPriority } from '@/utils/priorityHelpers';
// import { useCollection } from 'vuefire'; // Se for usar Firestore direto depois
// import { collection } from 'firebase/firestore';
// import { db } from '@/firebase/init';

// --- ESTADO ---
const loading = ref(false);
const documents = ref([]); // Lista crua de documentos

// --- COMPUTAÇÃO INTELIGENTE (A Mágica da Ordenação) ---
// Esta computed property garante que sempre que a lista mudar, 
// os itens urgentes "saltam" para o topo automaticamente.
const sortedDocuments = computed(() => {
  return sortDocumentsByPriority(documents.value);
});

// --- FUNÇÕES AUXILIARES ---

// Helper para mapear string do config para componente de ícone real
const getIcon = (iconName) => {
  const icons = {
    'AlertTriangle': AlertTriangle,
    'Clock': Clock,
    'FileText': FileText
  };
  return icons[iconName] || FileText;
};

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  // Se for timestamp do Firestore
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('pt-BR', { 
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
  }).format(date);
};

const handleAnalyze = (doc) => {
  console.log('Abrindo documento:', doc.id);
  // Aqui você navegaria para a rota de detalhes:
  // router.push(`/documents/${doc.id}`);
};

// --- SIMULAÇÃO DE DADOS (MOCK) ---
// Use isso para testar o visual "GovTech" imediatamente sem precisar do Firestore conectado
onMounted(async () => {
  loading.value = true;
  
  // Simulando um delay de rede
  setTimeout(() => {
    documents.value = [
      {
        id: '1',
        title: 'Solicitação de Férias - João Silva',
        type: 'FERIAS',
        createdAt: new Date('2023-10-10T10:00:00'),
        description: 'Férias regulares de 30 dias referentes a 2023.'
      },
      {
        id: '2',
        title: 'Licença Maternidade - Maria Oliveira',
        type: 'MATERNIDADE', // Deve ficar VERMELHO e ir para o TOPO
        createdAt: new Date('2023-10-12T14:00:00'),
        description: 'Início imediato solicitado conforme atestado anexo.'
      },
      {
        id: '3',
        title: 'Aposentadoria - Carlos Souza',
        type: 'APOSENTADORIA', // Deve ficar AMARELO
        createdAt: new Date('2023-10-11T09:30:00'),
        description: 'Processo de tempo de contribuição finalizado.'
      }
    ];
    loading.value = false;
  }, 800);
});
</script>