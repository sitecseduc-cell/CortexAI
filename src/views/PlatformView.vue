<script setup>
import { ref, computed } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useSupabaseCollection } from '@/composables/useFirestore'; // MANTIDO NOME DO ARQUIVO PARA COMPATIBILIDADE
import { supabase } from '@/libs/supabase'; 
import { useToastStore } from '@/stores/toast';

// Componentes
import { LayoutDashboard, FileText, Shield, Wrench, Settings, PlusCircle } from 'lucide-vue-next';
import Header from '@/components/layout/Header.vue';
import Sidebar from '@/components/layout/Sidebar.vue';
import Dashboard from '@/components/dashboard/Dashboard.vue';
import DocumentViewer from '@/components/documents/DocumentViewer.vue';
import RuleManager from '@/components/rules/RuleManager.vue';
import UploadModal from '@/components/modals/UploadModal.vue';
import SettingsView from './SettingsView.vue';
import ToolsView from './ToolsView.vue';

// --- ESTADO ---
const { user } = useAuth();
const toastStore = useToastStore();
const currentView = ref('dashboard');
const selectedDocId = ref(null);
const isUploadModalOpen = ref(false);

const appId = 'default-autonomous-agent';

// Caminhos/Tabelas (Ajustado para Supabase)
const docsTable = 'processos';
const rulesTable = 'regras'; 

// Dados (Reativos via Supabase)
const { data: documents } = useSupabaseCollection(docsTable);
const { data: rules } = useSupabaseCollection(rulesTable);

// --- AÇÕES ---

// Validação Humana (Atualiza Supabase)
const onHumanValidation = async ({ docId, data }) => {
    // Usando Supabase
    const { error } = await supabase
        .from('processos')
        .update({ 
            resultado_ia: data, 
            status: 'Raciocinio Pendente'
        })
        .eq('id', docId);

    if (error) {
        toastStore.addToast('Erro ao validar: ' + error.message, 'error');
    } else {
        toastStore.addToast('Validado! Agente retomando análise...', 'success');
    }
};

const handleManualAdvance = async ({ docId }) => {
    // Usando Supabase
    const { error } = await supabase
        .from('processos')
        .update({ 
            status: 'Validacao Pendente'
        })
        .eq('id', docId);
    
    if (error) {
        toastStore.addToast('Erro ao avançar: ' + error.message, 'error');
    } else {
        toastStore.addToast('Avançado para validação manual.', 'warning');
    }
};

const handleDelete = async (id) => {
    if(confirm("Tem certeza que deseja excluir este processo?")) {
        // Usando Supabase
        const { error } = await supabase
            .from('processos')
            .delete()
            .eq('id', id);

        if (error) {
            toastStore.addToast('Erro ao excluir: ' + error.message, 'error');
        } else {
            selectedDocId.value = null;
            currentView.value = 'dashboard';
            toastStore.addToast('Processo excluído.', 'success');
        }
    }
};

// Função auxiliar para abrir upload de qualquer lugar
const openUpload = () => { isUploadModalOpen.value = true; };
</script>

<template>
  <div class="flex flex-col h-screen font-sans overflow-hidden bg-gray-100 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
    <Header/>

    <div class="flex-grow flex overflow-hidden">
        <aside class="w-24 border-r flex flex-col items-center py-6 space-y-4 shrink-0 z-30 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <button @click="openUpload" class="flex flex-col items-center justify-center w-full py-3 px-1 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
                <PlusCircle class="w-7 h-7 mb-1" />
                <span class="text-[10px] font-bold tracking-wide">NOVO</span>
            </button>
            <div class="w-full h-px bg-slate-200 dark:bg-slate-800"></div>
            
            <button @click="currentView = 'dashboard'" 
                    class="nav-btn" :class="currentView === 'dashboard' ? 'active' : ''">
                <LayoutDashboard class="w-6 h-6 mb-1.5" />
                <span class="text-[10px] font-medium tracking-wide">Dashboard</span>
            </button>

            <button @click="currentView = 'documents'" 
                    class="nav-btn" :class="currentView === 'documents' ? 'active' : ''">
                <FileText class="w-6 h-6 mb-1.5" />
                <span class="text-[10px] font-medium tracking-wide">Processos</span>
            </button>

            <button @click="currentView = 'rules'" 
                    class="nav-btn" :class="currentView === 'rules' ? 'active' : ''">
                <Shield class="w-6 h-6 mb-1.5" />
                <span class="text-[10px] font-medium tracking-wide">Regras</span>
            </button>
            
            <div class="flex-grow"></div>
            
            <button @click="currentView = 'tools'" 
                    class="nav-btn" :class="currentView === 'tools' ? 'active' : ''">
                 <Wrench class="w-6 h-6 mb-1.5" />
                 <span class="text-[10px] font-medium tracking-wide">Ferramentas</span>
            </button>

            <button @click="currentView = 'settings'" 
                class="nav-btn" :class="currentView === 'settings' ? 'active' : ''">
                 <Settings class="w-6 h-6 mb-1.5" />
                 <span class="text-[10px] font-medium tracking-wide">Ajustes</span>
            </button>
        </aside>

        <div class="flex-grow flex overflow-hidden relative bg-gray-50 dark:bg-slate-950">
            
            <div v-if="currentView === 'settings'" class="absolute inset-0 p-6 z-20">
                <div class="h-full rounded-2xl shadow-2xl overflow-hidden bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 border">
                    <SettingsView />
                </div>
            </div>

            <div v-if="currentView === 'tools'" class="absolute inset-0 p-6 z-20">
                <div class="h-full rounded-2xl shadow-2xl overflow-hidden bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 border">
                    <ToolsView />
                </div>
            </div>

            <div v-if="['dashboard', 'documents', 'rules'].includes(currentView)" class="flex w-full h-full">
                <div v-show="currentView === 'documents'" class="w-80 min-w-[320px] border-r flex flex-col z-10 transition-all bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                    <Sidebar 
                        :documents="documents" 
                        :selectedId="selectedDocId"
                        @select="id => { selectedDocId = id; }" 
                        @upload="openUpload"
                    />
                </div>

                <main class="flex-grow overflow-hidden flex flex-col relative">
                    <div v-if="currentView === 'dashboard'" class="absolute inset-0 p-6 overflow-y-auto custom-scrollbar">
                        <Dashboard :documents="documents" />
                    </div>

                    <div v-if="currentView === 'rules'" class="absolute inset-0 p-6 overflow-y-auto custom-scrollbar">
                        <RuleManager :rules="rules" :rulesTable="rulesTable" />
                    </div>

                    <div v-if="currentView === 'documents'" class="h-full flex flex-col bg-white dark:bg-slate-950">
                        <DocumentViewer 
                            :doc="documents?.find(d => d.id === selectedDocId)" 
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

<style scoped>
.nav-btn {
    @apply flex flex-col items-center justify-center w-full py-3 px-1 transition-all border-l-2 border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800/30;
}
.nav-btn.active {
    @apply border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-slate-800/50 dark:text-indigo-400;
}
</style>