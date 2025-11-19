<script setup>
import { ref, computed, watch } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useFirestoreCollection } from '@/composables/useFirestore';
import { useSeeder } from '@/composables/useSeeder'; // Importante para criar as regras
import { useToastStore } from '@/stores/toast';
import { geminiApiService } from '@/services/geminiService';
import { doc, setDoc, deleteDoc, collection } from 'firebase/firestore';
import { db } from '@/libs/firebase';
import { safeParse } from '@/utils/helpers';

// Ícones e Componentes
import { LayoutDashboard, FileText, Shield } from 'lucide-vue-next';
import Header from '@/components/layout/Header.vue';
import Sidebar from '@/components/layout/Sidebar.vue';
import Dashboard from '@/components/dashboard/Dashboard.vue';
import DocumentViewer from '@/components/documents/DocumentViewer.vue';
import RuleManager from '@/components/rules/RuleManager.vue';
import UploadModal from '@/components/modals/UploadModal.vue';
import ToolsView from './ToolsView.vue';
import SettingsView from './SettingsView.vue';

// --- ESTADO ---
const { user, isAuthReady } = useAuth();
const toastStore = useToastStore();
const currentView = ref('dashboard');
const selectedDocId = ref(null);
const isUploadModalOpen = ref(false);

const appId = 'default-autonomous-agent';

// --- CORREÇÃO DO ERRO CRÍTICO ---
// O path deve terminar em 'rules'. O seeder usará isso para criar a coleção.
const docsPath = computed(() => user.value ? `artifacts/${appId}/users/${user.value.uid}/intelligent_platform_docs` : null);
const rulesPath = computed(() => user.value ? `artifacts/${appId}/users/${user.value.uid}/rules` : null);
const servidoresPath = computed(() => user.value ? `artifacts/${appId}/users/${user.value.uid}/servidores` : null);

// --- DADOS ---
const { data: documents } = useFirestoreCollection(docsPath);
const { data: rules } = useFirestoreCollection(rulesPath);
const { data: servidores } = useFirestoreCollection(servidoresPath);

// Popula o banco com regras padrão se estiver vazio
useSeeder(rulesPath);

// --- LÓGICA DE ORQUESTRAÇÃO (AGENTE) ---
// 1. IDP
const startIDPChain = async (docToProcess) => {
    const docRef = doc(db, docsPath.value, docToProcess.id);
    try {
      await setDoc(docRef, { status: 'Processing IDP' }, { merge: true });
      const mlOutput = await geminiApiService.callGeminiAPIForProcessing(docToProcess.content);
      await setDoc(docRef, { 
        status: 'Enriquecimento Pendente', 
        idpResult: JSON.stringify(mlOutput.idpResult), 
        nlpResult: JSON.stringify(mlOutput.nlpResult) 
      }, { merge: true });
    } catch (error) {
      await setDoc(docRef, { status: 'Failed' }, { merge: true });
    }
};

// 2. Enriquecimento
const executeEnrichment = async (docToProcess) => {
    const docRef = doc(db, docsPath.value, docToProcess.id);
    try {
        const idpData = safeParse(docToProcess.idpResult);
        const personName = idpData?.keyFields?.find(f => f.field === "PESSOA" || f.field === "Nome")?.value;
        let enrichedData = {};
        if (personName && servidores.value.length) {
            const servidor = servidores.value.find(s => s.nome && personName.includes(s.nome.split(' ')[0]));
            if (servidor) enrichedData = { cargo: servidor.cargo, tempo_de_servico: servidor.tempo_de_servico_em_anos, matricula: servidor.matricula };
        }
        await setDoc(docRef, { status: 'Validacao Pendente', enrichedData: JSON.stringify(enrichedData) }, { merge: true });
    } catch (e) {
        await setDoc(docRef, { status: 'Validacao Pendente', enrichedData: '{}' }, { merge: true });
    }
};

// 3. Raciocínio
const startReasoningChain = async (docToProcess) => {
    const docRef = doc(db, docsPath.value, docToProcess.id);
    try {
         const idpData = safeParse(docToProcess.idpResult);
         const enrichedData = safeParse(docToProcess.enrichedData);
         const activeRules = rules.value.filter(r => r.status === 'Ativa').map(r => `- ${r.nome}: ${JSON.stringify(r.condicoes)}`).join('\n');
         const prompt = `Analise: DADOS: ${JSON.stringify(idpData)} RH: ${JSON.stringify(enrichedData)} REGRAS: ${activeRules}`;
         const rarResult = await geminiApiService.callGeminiAPIForReasoning(prompt);
         await setDoc(docRef, { status: rarResult.veredicto?.status || 'Finalizado', rarResult: JSON.stringify(rarResult) }, { merge: true });
         toastStore.addToast(`Processo ${rarResult.veredicto?.status}!`, 'success');
    } catch (e) {
        await setDoc(docRef, { status: 'Failed' }, { merge: true });
    }
};

// Callback Validação Humana
const onHumanValidation = async ({ docId, data }) => {
    const docRef = doc(db, docsPath.value, docId);
    await setDoc(docRef, { idpResult: JSON.stringify(data), status: 'Raciocinio Pendente' }, { merge: true });
    toastStore.addToast('Validado. Agente iniciado!', 'info');
};

// Watcher Principal
watch(documents, (newDocs) => {
    newDocs.forEach(doc => {
        if (doc.status === 'Uploaded') startIDPChain(doc);
        else if (doc.status === 'Enriquecimento Pendente') executeEnrichment(doc);
        else if (doc.status === 'Raciocinio Pendente') startReasoningChain(doc);
    });
}, { deep: true });

// --- INTERFACE HANDLERS ---
const handleStartProcess = async (payload) => {
    // payload agora contém { processoId, processoNome, fileName, content }
    if(!docsPath.value) return;
    
    try {
        const colRef = collection(db, docsPath.value);
        
        await setDoc(doc(colRef), {
            name: payload.fileName,     // Nome real do arquivo
            content: payload.content,   // Conteúdo (lido ou simulado)
            processo: payload.processoId, // ID correto para ativar as regras
            status: 'Uploaded',         // Gatilho para iniciar a IA
            timestamp: Date.now()
        });
        
        toastStore.addToast(`Upload de ${payload.processoNome} concluído!`, 'success');
        isUploadModalOpen.value = false;
        
        // Opcional: Mudar para a aba de documentos automaticamente
        currentView.value = 'documents';
    } catch (e) {
        console.error(e);
        toastStore.addToast('Erro ao criar processo.', 'error');
    }
};

const handleDelete = async (id) => {
    if(confirm("Excluir?")) {
        await deleteDoc(doc(db, docsPath.value, id));
        selectedDocId.value = null;
        currentView.value = 'dashboard';
    }
};
</script>

<template>
  <div class="flex flex-col h-screen bg-slate-950 text-white font-sans">
    <Header />

    <div class="p-6 bg-slate-950 flex-grow overflow-hidden flex flex-col">
        
        <div class="flex space-x-4 mb-4 shrink-0 px-2">
            <button @click="currentView = 'dashboard'" class="px-4 py-2 rounded-lg text-sm font-bold transition-all" :class="['dashboard', 'documents', 'rules'].includes(currentView) ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-gray-400 hover:bg-slate-800'">
                Plataforma
            </button>
            <button @click="currentView = 'tools'" class="px-4 py-2 rounded-lg text-sm font-bold transition-all" :class="currentView === 'tools' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-gray-400 hover:bg-slate-800'">
                Ferramentas
            </button>
            <button @click="currentView = 'settings'" class="px-4 py-2 rounded-lg text-sm font-bold transition-all" :class="currentView === 'settings' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-gray-400 hover:bg-slate-800'">
                Configurações
            </button>
        </div>

        <div v-if="currentView === 'tools'" class="flex-grow overflow-hidden bg-slate-800 rounded-xl border border-slate-700 shadow-2xl">
            <ToolsView />
        </div>

        <div v-else-if="currentView === 'settings'" class="flex-grow overflow-hidden bg-slate-800 rounded-xl border border-slate-700 shadow-2xl">
            <SettingsView />
        </div>

        <div v-else class="flex-grow flex overflow-hidden gap-4">
            <div class="w-1/4 min-w-80 bg-slate-800 rounded-xl border border-slate-700 flex flex-col overflow-hidden shadow-2xl">
                <Sidebar 
                    :documents="documents" 
                    :selectedId="selectedDocId"
                    @select="id => { selectedDocId = id; currentView = 'documents'; }" 
                    @upload="isUploadModalOpen = true"
                />
            </div>

            <main class="flex-grow overflow-hidden bg-slate-800 rounded-xl border border-slate-700 flex flex-col shadow-2xl relative">
                <div class="flex border-b border-slate-700 bg-slate-900/50 shrink-0">
                    <button @click="currentView = 'dashboard'" class="flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold transition-colors" :class="currentView==='dashboard' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-800' : 'text-gray-400 hover:text-white'">
                        <LayoutDashboard class="w-4 h-4"/> Dashboard
                    </button>
                    <button @click="currentView = 'documents'" class="flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold transition-colors" :class="currentView==='documents' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-800' : 'text-gray-400 hover:text-white'">
                        <FileText class="w-4 h-4"/> Processos
                    </button>
                    <button @click="currentView = 'rules'" class="flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold transition-colors" :class="currentView==='rules' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-800' : 'text-gray-400 hover:text-white'">
                        <Shield class="w-4 h-4"/> Regras
                    </button>
                </div>

                <div class="flex-grow overflow-y-auto custom-scrollbar">
                    <Dashboard v-if="currentView === 'dashboard'" :documents="documents" />
                    
                    <DocumentViewer 
                        v-if="currentView === 'documents'" 
                        :doc="documents.find(d => d.id === selectedDocId)" 
                        @validate="onHumanValidation"
                        @delete="handleDelete"
                    />
                    
                    <RuleManager 
                        v-if="currentView === 'rules'" 
                        :rules="rules" 
                        :rulesCollectionPath="rulesPath"
                    />
                </div>
            </main>
        </div>
    </div>
    
    <UploadModal v-if="isUploadModalOpen" @close="isUploadModalOpen = false" @start="handleStartProcess" />
  </div>
</template>