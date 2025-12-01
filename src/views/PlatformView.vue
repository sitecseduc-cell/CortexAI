<script setup>
import { ref, computed } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useFirestoreCollection } from '@/composables/useFirestore';
import { useSeeder } from '@/composables/useSeeder';
import { useToastStore } from '@/stores/toast';
import { doc, setDoc, deleteDoc, collection, updateDoc } from 'firebase/firestore';
import { db } from '@/libs/firebase';

// Componentes
import { LayoutDashboard, FileText, Shield } from 'lucide-vue-next';
import Header from '@/components/layout/Header.vue';
import Sidebar from '@/components/layout/Sidebar.vue';
import Dashboard from '@/components/dashboard/Dashboard.vue';
import DocumentViewer from '@/components/documents/DocumentViewer.vue';
import RuleManager from '@/components/rules/RuleManager.vue';
import UploadModal from '@/components/modals/UploadModal.vue';
import SettingsView from './SettingsView.vue';

// --- ESTADO ---
const { user } = useAuth();
const toastStore = useToastStore();
const currentView = ref('dashboard');
const selectedDocId = ref(null);
const isUploadModalOpen = ref(false);

const appId = 'default-autonomous-agent';

// Paths
const docsPath = computed(() => user.value ? `artifacts/${appId}/users/${user.value.uid}/intelligent_platform_docs` : null);
const rulesPath = computed(() => user.value ? `artifacts/${appId}/users/${user.value.uid}/rules` : null);

// Dados (Reativos via Firestore)
const { data: documents } = useFirestoreCollection(docsPath);
const { data: rules } = useFirestoreCollection(rulesPath);

// Seed inicial
useSeeder(rulesPath);

// --- AÇÕES ---

// Validação Humana (Único momento que o cliente interfere no fluxo além do upload)
const onHumanValidation = async ({ docId, data }) => {
    if(!docsPath.value) return;
    const docRef = doc(db, docsPath.value, docId);
    // Atualiza dados corrigidos e muda status para disparar o próximo gatilho no backend
    await updateDoc(docRef, { 
        idpResult: JSON.stringify(data), 
        status: 'Raciocinio Pendente' // Gatilho para onProcessUpdated no backend
    });
    toastStore.addToast('Validado! Agente retomando análise...', 'success');
};

const handleManualAdvance = async ({ docId }) => {
    if(!docsPath.value) return;
    
    const docRef = doc(db, docsPath.value, docId);
    
    // Força o status para 'Validacao Pendente' para liberar a edição manual
    await updateDoc(docRef, { 
        status: 'Validacao Pendente'
    });
    
    toastStore.addToast('Avançado para validação manual.', 'warning');
};

const handleDelete = async (id) => {
    if(confirm("Tem certeza que deseja excluir este processo?")) {
        await deleteDoc(doc(db, docsPath.value, id));
        selectedDocId.value = null;
        currentView.value = 'dashboard';
    }
};
</script>

<template>
  <div class="flex flex-col h-screen bg-slate-950 text-white font-sans overflow-hidden">
    <Header />

    <div class="flex-grow flex overflow-hidden">
        <!-- Navegação Lateral Estilo "App" -->
        <aside class="w-24 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-6 space-y-4 shrink-0 z-30">
            
            <button @click="currentView = 'dashboard'" 
                class="flex flex-col items-center justify-center w-full py-3 px-1 transition-all group border-l-2" 
                :class="currentView === 'dashboard' ? 'border-indigo-500 bg-slate-800/50 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'">
                <LayoutDashboard class="w-6 h-6 mb-1.5" />
                <span class="text-[10px] font-medium tracking-wide">Dashboard</span>
            </button>

            <button @click="currentView = 'documents'" 
                class="flex flex-col items-center justify-center w-full py-3 px-1 transition-all group border-l-2" 
                :class="currentView === 'documents' ? 'border-indigo-500 bg-slate-800/50 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'">
                <FileText class="w-6 h-6 mb-1.5" />
                <span class="text-[10px] font-medium tracking-wide">Processos</span>
            </button>

            <button @click="currentView = 'rules'" 
                class="flex flex-col items-center justify-center w-full py-3 px-1 transition-all group border-l-2" 
                :class="currentView === 'rules' ? 'border-indigo-500 bg-slate-800/50 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'">
                <Shield class="w-6 h-6 mb-1.5" />
                <span class="text-[10px] font-medium tracking-wide">Regras</span>
            </button>
            
            <div class="flex-grow"></div>
            
            <button @click="currentView = 'tools'" 
                class="flex flex-col items-center justify-center w-full py-3 px-1 transition-all group border-l-2"
                :class="currentView === 'tools' ? 'border-indigo-500 bg-slate-800/50 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 mb-1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                 <span class="text-[10px] font-medium tracking-wide">Ferramentas</span>
            </button>

            <button @click="currentView = 'settings'" 
                class="flex flex-col items-center justify-center w-full py-3 px-1 transition-all group border-l-2"
                :class="currentView === 'settings' ? 'border-indigo-500 bg-slate-800/50 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 mb-1.5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                 <span class="text-[10px] font-medium tracking-wide">Ajustes</span>
            </button>
        </aside>

        <!-- Área Principal -->
        <div class="flex-grow flex overflow-hidden bg-slate-950 relative">
            
            <!-- Views de Tela Cheia -->
            <div v-if="currentView === 'settings'" class="absolute inset-0 p-6 z-20 bg-slate-950">
                <div class="h-full bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
                    <SettingsView />
                </div>
            </div>

            <!-- Layout Padrão (Sidebar + Main) -->
            <div v-if="['dashboard', 'documents', 'rules'].includes(currentView)" class="flex w-full h-full">
                <!-- Lista de Documentos (Visível apenas em 'documents' ou desktop large se quiser) -->
                <div v-show="currentView === 'documents'" class="w-80 min-w-[320px] border-r border-slate-800 bg-slate-900 flex flex-col z-10 transition-all">
                    <Sidebar 
                        :documents="documents" 
                        :selectedId="selectedDocId"
                        @select="id => { selectedDocId = id; }" 
                        @upload="isUploadModalOpen = true"
                    />
                </div>

                <!-- Conteúdo Central -->
                <main class="flex-grow overflow-hidden flex flex-col relative bg-slate-950">
                    <!-- Dashboard Overlay -->
                    <div v-if="currentView === 'dashboard'" class="absolute inset-0 p-6 overflow-y-auto custom-scrollbar">
                        <Dashboard :documents="documents" />
                    </div>

                    <!-- Rule Manager Overlay -->
                    <div v-if="currentView === 'rules'" class="absolute inset-0 p-6 overflow-y-auto custom-scrollbar">
                        <RuleManager :rules="rules" :rulesCollectionPath="rulesPath" />
                    </div>

                    <!-- Document Viewer -->
                    <div v-if="currentView === 'documents'" class="h-full flex flex-col">
                        <DocumentViewer 
                            :doc="documents.find(d => d.id === selectedDocId)" 
                            @validate="onHumanValidation"
                            @delete="handleDelete"
                            @manual-advance="handleManualAdvance"
                        />
                    </div>
                </main>
            </div>
        </div>
    </div>
    
    <UploadModal v-if="isUploadModalOpen" @close="isUploadModalOpen = false" />
  </div>
</template>