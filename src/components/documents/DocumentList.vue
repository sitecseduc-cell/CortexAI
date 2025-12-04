<script setup>
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSupabaseCollection } from '@/composables/useFirestore'; // Corrigido para o nome de arquivo existente
import { useAuth } from '@/composables/useAuth';
import Sidebar from '@/components/layout/Sidebar.vue';

const { user } = useAuth();
const router = useRouter();
const route = useRoute();

// O ID do processo selecionado é pego da URL
const selectedDocId = computed(() => route.params.id || null);

// Busca os documentos do Supabase
const { data: documents } = useSupabaseCollection('processos');

const handleSelect = (docId) => {
  // Navega para a rota de detalhe do processo
  router.push({ name: 'detalhe-processo', params: { id: docId } });
};

</script>

<template>
  <div class="flex w-full h-full">
    <!-- Sidebar com a lista de documentos -->
    <div class="w-80 min-w-[320px] border-r border-slate-800 bg-slate-900 flex flex-col z-10">
      <Sidebar 
        :documents="documents" 
        :selectedId="selectedDocId"
        @select="handleSelect" 
        @upload="$emit('upload')"
      />
    </div>

    <!-- Área onde o DocumentViewer será renderizado pelo router -->
    <main class="flex-grow overflow-hidden flex flex-col relative bg-slate-950">
      <!-- O RouterView aninhado renderizará o DocumentViewer quando a URL for /processos/:id -->
      <RouterView :key="route.path" />
    </main>
  </div>
</template>