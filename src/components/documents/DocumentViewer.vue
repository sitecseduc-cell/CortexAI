<script setup>
import { ref, computed, watch } from 'vue';
import { safeParse } from '@/utils/helpers';
import VuePdfEmbed from 'vue-pdf-embed';
import { CheckCircle, XCircle, AlertTriangle, User, FileText, Save } from 'lucide-vue-next';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/libs/firebase';

const props = defineProps(['doc']);
const emit = defineEmits(['delete']);

// Dados
const idpData = computed(() => safeParse(props.doc?.idpResult) || {});
const analiseData = computed(() => safeParse(props.doc?.analiseIA));
const rhData = computed(() => safeParse(props.doc?.dadosRH));

// Edição Manual dos dados extraídos (Caso a IA erre o OCR)
const isEditing = ref(false);
const editForm = ref({});

watch(() => props.doc, (newDoc) => {
    if (newDoc) {
        isEditing.value = false;
    }
}, { immediate: true });

const startValidation = () => {
    editForm.value = { ...idpData.value };
    isEditing.value = true;
};

const confirmValidation = async () => {
    if(!props.doc.id || !auth.currentUser) return;
    
    const docRef = doc(db, `artifacts/default-autonomous-agent/users/${auth.currentUser.uid}/intelligent_platform_docs`, props.doc.id);
    
    // Atualiza com os dados corrigidos pelo humano e muda status para disparar a IA Jurídica
    await updateDoc(docRef, {
        idpResult: JSON.stringify(editForm.value),
        status: 'Em Análise' 
    });
    
    isEditing.value = false;
};
</script>

<template>
  <div v-if="doc" class="flex h-full bg-slate-950 text-white">
    
    <div class="w-1/2 border-r border-slate-800 bg-slate-900/50 p-6 overflow-y-auto custom-scrollbar flex flex-col items-center">
       <div v-if="doc.fileUrl">
           <VuePdfEmbed :source="doc.fileUrl" class="shadow-xl border border-slate-700 rounded w-full max-w-[500px]" />
       </div>
       <div v-else class="text-slate-500 mt-20 flex flex-col items-center">
           <FileText class="w-16 h-16 mb-4 opacity-50"/>
           <p>Visualização não disponível</p>
       </div>
    </div>

    <div class="w-1/2 flex flex-col h-full overflow-hidden">
        
        <div class="p-6 border-b border-slate-800">
            <h1 class="text-2xl font-bold mb-1">{{ doc.name }}</h1>
            <div class="flex items-center gap-2">
                <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                      :class="{
                          'bg-yellow-500/20 text-yellow-400': doc.status.includes('Aguardando'),
                          'bg-green-500/20 text-green-400': doc.status === 'Aprovado',
                          'bg-red-500/20 text-red-400': doc.status === 'Rejeitado',
                          'bg-blue-500/20 text-blue-400': doc.status === 'Em Análise'
                      }">
                    {{ doc.status }}
                </span>
                <span class="text-slate-500 text-xs">{{ new Date(doc.timestamp).toLocaleDateString() }}</span>
            </div>
        </div>

        <div class="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
            
            <div class="bg-slate-900 rounded-xl border border-slate-800 p-5">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-indigo-400 flex items-center"><FileText class="w-4 h-4 mr-2"/> Dados do Pedido</h3>
                    <button v-if="doc.status === 'Aguardando Validação' && !isEditing" @click="startValidation" class="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded text-white transition">
                        Validar Dados
                    </button>
                </div>

                <div v-if="isEditing" class="space-y-3 animate-fade-in">
                    <div v-for="(val, key) in editForm" :key="key">
                        <label class="text-[10px] uppercase text-slate-500 font-bold">{{ key.replace(/_/g, ' ') }}</label>
                        <input v-model="editForm[key]" class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none" />
                    </div>
                    <button @click="confirmValidation" class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded mt-2 flex items-center justify-center">
                        <CheckCircle class="w-4 h-4 mr-2"/> Confirmar e Analisar
                    </button>
                </div>

                <div v-else class="grid grid-cols-2 gap-4">
                    <div v-for="(val, key) in idpData" :key="key">
                        <span class="block text-[10px] uppercase text-slate-500">{{ key.replace(/_/g, ' ') }}</span>
                        <span class="text-sm font-medium">{{ val }}</span>
                    </div>
                </div>
            </div>

            <div v-if="rhData" class="bg-slate-900 rounded-xl border border-slate-800 p-5 relative overflow-hidden">
                <div class="absolute right-0 top-0 p-4 opacity-5"><User class="w-32 h-32"/></div>
                <h3 class="font-bold text-purple-400 mb-4 flex items-center"><User class="w-4 h-4 mr-2"/> Ficha Funcional (Ergon)</h3>
                <div class="grid grid-cols-2 gap-y-3 relative z-10">
                    <div>
                        <span class="block text-[10px] uppercase text-slate-500">Cargo</span>
                        <span class="text-sm">{{ rhData.cargo }}</span>
                    </div>
                    <div>
                        <span class="block text-[10px] uppercase text-slate-500">Tempo de Serviço</span>
                        <span class="text-sm">{{ rhData.tempo_servico_anos }} anos</span>
                    </div>
                    <div>
                        <span class="block text-[10px] uppercase text-slate-500">Estágio Probatório</span>
                        <span class="text-sm" :class="rhData.estagio_probatorio ? 'text-red-400' : 'text-green-400'">
                            {{ rhData.estagio_probatorio ? 'SIM' : 'NÃO' }}
                        </span>
                    </div>
                </div>
            </div>

            <div v-if="analiseData" class="rounded-xl border p-6 shadow-2xl transition-all animate-slide-up"
                 :class="analiseData.parecer === 'DEFERIDO' ? 'bg-green-900/20 border-green-500/50' : 'bg-red-900/20 border-red-500/50'">
                
                <h2 class="text-2xl font-black mb-2 flex items-center" 
                    :class="analiseData.parecer === 'DEFERIDO' ? 'text-green-400' : 'text-red-400'">
                    {{ analiseData.parecer }}
                </h2>
                
                <p class="text-sm text-slate-200 leading-relaxed mb-4 bg-black/20 p-4 rounded-lg">
                    {{ analiseData.justificativa_tecnica }}
                </p>

                <div v-if="analiseData.pendencias?.length" class="bg-yellow-900/20 border border-yellow-500/30 p-3 rounded">
                    <h4 class="text-xs font-bold text-yellow-400 uppercase mb-1 flex items-center">
                        <AlertTriangle class="w-3 h-3 mr-1"/> Pendências
                    </h4>
                    <ul class="list-disc list-inside text-xs text-yellow-200">
                        <li v-for="p in analiseData.pendencias" :key="p">{{ p }}</li>
                    </ul>
                </div>
            </div>

        </div>
    </div>
  </div>
</template>