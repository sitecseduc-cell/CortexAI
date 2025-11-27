<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useFirestoreCollection } from '@/composables/useFirestore';
import { useAuth } from '@/composables/useAuth';
import Sidebar from '@/components/layout/Sidebar.vue';

const { user } = useAuth();
const router = useRouter();
const route = useRoute();

const appId = 'default-autonomous-agent';

// O ID do processo selecionado é pego da URL
const selectedDocId = computed(() => route.params.id || null);

// Busca os documentos do Firestore
const docsPath = computed(() => user.value ? `artifacts/${appId}/users/${user.value.uid}/intelligent_platform_docs` : null);
const { data: documents } = useFirestoreCollection(docsPath);

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