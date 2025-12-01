<script setup>
import { ref, computed } from 'vue';
import { X, Zap, UploadCloud, FileText, CheckCircle, Loader2 } from 'lucide-vue-next';
// Importa a lista completa de processos que criamos
import { PROCESSOS_CCM } from '@/constants/processes';
// Imports do Firebase Storage e Firestore
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore'; // Use addDoc para criar ID automático
import { storage, db, auth } from '@/libs/firebase';
import { useAuth } from '@/composables/useAuth'; // Para pegar o ID do usuário

const { user } = useAuth();
const emit = defineEmits(['close']);
const isUploading = ref(false);
const selectedProcessId = ref('solicitacao_ferias'); // Define um padrão válido da nova lista
const selectedFile = ref(null);
const isDragOver = ref(false);

const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) selectedFile.value = file;
};

const handleDrop = (event) => {
    event.preventDefault();
    isDragOver.value = false;
    if (event.dataTransfer.files.length) {
        selectedFile.value = event.dataTransfer.files[0];
    }
};

const handleStart = async () => {
    if (!user.value) return alert("Erro: Usuário não autenticado");

    isUploading.value = true;
    const proc = PROCESSOS_CCM.find(p => p.id === selectedProcessId.value);

    try {
        let fileUrl = null;
        let storagePath = null;

        // 1. Upload para o Firebase Storage
        if (selectedFile.value) {
            const fileName = `${Date.now()}_${selectedFile.value.name}`;
            // Caminho: uploads/{userId}/{fileName}
            storagePath = `uploads/${user.value.uid}/${fileName}`;
            const fileRef = storageRef(storage, storagePath);
            
            // Realiza o upload
            const snapshot = await uploadBytes(fileRef, selectedFile.value);
            // Obtém a URL pública para o backend baixar
            fileUrl = await getDownloadURL(snapshot.ref);
        } else {
            // Lógica de template (fallback) se desejar manter
            fileUrl = null; 
        }

        // 2. Salva Metadados no Firestore (Leve)
        // Caminho dinâmico conforme suas regras: artifacts/{appId}/users/{userId}/intelligent_platform_docs
        const appId = 'default-autonomous-agent'; 
        const docsPath = `artifacts/${appId}/users/${user.value.uid}/intelligent_platform_docs`;
        
        await addDoc(collection(db, docsPath), {
            name: selectedFile.value?.name || proc.nome,
            fileUrl: fileUrl,       // URL do arquivo no Storage
            storagePath: storagePath,
            processo: proc.id,
            processoNome: proc.nome,
            uid: user.value.uid, // IMPORTANTE: Salvar o UID no documento para uso na UI
            status: fileUrl ? 'Uploaded' : 'Enriquecimento Pendente',     // Gatilho para a Cloud Function
            timestamp: Date.now(),
        });

        emit('close');

    } catch (error) {
        console.error("Erro no upload:", error);
        alert("Falha ao enviar documento.");
    } finally {
        isUploading.value = false;
    }
};

// Computed para pegar a descrição do processo atual e mostrar na tela
const currentProcessDescription = computed(() => {
    return PROCESSOS_CCM.find(p => p.id === selectedProcessId.value)?.descricao || '';
});
</script>

<template>
  <div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      class="bg-slate-900 p-8 rounded-2xl border border-slate-700 w-full max-w-lg relative text-white shadow-2xl"
    >
      <button @click="emit('close')" class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"><X /></button>
      
      <h2 id="upload-modal-title" class="text-2xl font-bold mb-1 text-white flex items-center">
          <Zap class="w-6 h-6 mr-2 text-indigo-400" /> Novo Processo
      </h2>
      <p class="text-slate-400 text-sm mb-6">Selecione o tipo de requerimento e anexe o documento.</p>
      
      <div class="mb-5">
          <label class="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Tipo de Processo</label>
          <div class="relative">
              <select v-model="selectedProcessId" class="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer hover:bg-slate-750">
                  <option v-for="p in PROCESSOS_CCM" :key="p.id" :value="p.id">{{ p.nome }}</option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <svg class="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
              </div>
          </div>
          <p class="text-xs text-indigo-400 mt-2 ml-1 h-4">
              {{ currentProcessDescription }}
          </p>
      </div>

      <div 
        class="mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer group relative overflow-hidden"
        :class="[
            isDragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-indigo-400 hover:bg-slate-800',
            selectedFile ? 'border-green-500/50 bg-green-500/5' : ''
        ]"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        @drop="handleDrop"
        @click="$refs.fileInput.click()"
      >
          <input type="file" ref="fileInput" class="hidden" @change="handleFileSelect" />
          
          <div v-if="!selectedFile" class="pointer-events-none">
              <UploadCloud class="w-12 h-12 mx-auto mb-3 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              <p class="text-sm font-medium text-slate-300">Clique ou arraste seu documento aqui</p>
              <p class="text-xs text-slate-500 mt-1">PDF, JPG, PNG ou TXT</p>
          </div>

          <div v-else class="flex flex-col items-center animate-slide-up">
              <div class="bg-green-500/20 p-3 rounded-full mb-2">
                  <FileText class="w-8 h-8 text-green-400" />
              </div>
              <p class="text-sm font-bold text-white truncate max-w-[200px]">{{ selectedFile.name }}</p>
              <p class="text-xs text-green-400 mt-1 flex items-center"><CheckCircle class="w-3 h-3 mr-1"/> Arquivo pronto</p>
          </div>
      </div>
      
      <button 
        @click="handleStart" 
        :disabled="isUploading" 
        class="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        <Loader2 v-if="isUploading" class="w-5 h-5 mr-2 animate-spin" />
        {{ isUploading ? 'Enviando e Analisando...' : 'Iniciar Análise IA' }}
      </button>
    </div>
  </div>
</template>