<script setup>
import { ref } from 'vue';
import { Shield, Check, X } from 'lucide-vue-next';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/libs/firebase'; 
import { useToastStore } from '@/stores/toast';

const props = defineProps(['rules', 'rulesCollectionPath']);
const toast = useToastStore();

const editingId = ref(null);
const tempRule = ref({});

// Iniciar Edição
const startEdit = (rule) => {
  editingId.value = rule.id;
  // Copia e converte objetos para string para edição no textarea
  tempRule.value = {
    ...rule,
    condicoes: JSON.stringify(rule.condicoes, null, 2),
    acao_se_verdadeiro: JSON.stringify(rule.acao_se_verdadeiro, null, 2)
  };
};

const cancelEdit = () => {
  editingId.value = null;
  tempRule.value = {};
};

// Salvar Regra
const saveRule = async () => {
  if (!props.rulesCollectionPath) return;
  
  try {
    // Parseia de volta para validar JSON
    const ruleToSave = {
      ...tempRule.value,
      condicoes: JSON.parse(tempRule.value.condicoes),
      acao_se_verdadeiro: JSON.parse(tempRule.value.acao_se_verdadeiro)
    };

    const ruleRef = doc(db, props.rulesCollectionPath, editingId.value);
    await setDoc(ruleRef, ruleToSave, { merge: true });
    
    toast.addToast('Regra atualizada com sucesso!', 'success');
    cancelEdit();
  } catch (e) {
    console.error(e);
    toast.addToast('Erro: JSON inválido. Verifique a sintaxe.', 'error');
  }
};
</script>

<template>
  <div class="p-6 pb-20 text-white">
    <h1 class="text-3xl font-extrabold flex items-center mb-6 border-b border-slate-700 pb-4">
      <Shield class="w-8 h-8 mr-3 text-indigo-500" /> Gestão de Regras (Módulo RAR)
    </h1>
    
    <div class="grid gap-4">
      <div v-for="rule in rules" :key="rule.id" class="bg-slate-800 p-4 rounded-xl border border-slate-700 animate-slide-up">
        
        <div v-if="editingId === rule.id" class="space-y-3">
          <input v-model="tempRule.nome" class="w-full p-2 rounded bg-slate-700 border border-slate-600 text-white font-bold" />
          
          <div class="grid grid-cols-2 gap-2">
             <div>
                <label class="text-xs text-gray-400">Condições (JSON)</label>
                <textarea v-model="tempRule.condicoes" rows="5" class="w-full p-2 rounded bg-slate-900 font-mono text-xs border border-slate-600 text-green-400"></textarea>
             </div>
             <div>
                <label class="text-xs text-gray-400">Ação (JSON)</label>
                <textarea v-model="tempRule.acao_se_verdadeiro" rows="5" class="w-full p-2 rounded bg-slate-900 font-mono text-xs border border-slate-600 text-blue-400"></textarea>
             </div>
          </div>

          <div class="flex justify-end space-x-2 mt-2">
             <button @click="cancelEdit" class="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500">Cancelar</button>
             <button @click="saveRule" class="px-3 py-1 bg-green-600 rounded hover:bg-green-500 flex items-center"><Check class="w-4 h-4 mr-1"/> Salvar</button>
          </div>
        </div>

        <div v-else class="flex justify-between items-start">
          <div>
            <h3 class="text-xl font-bold text-indigo-400">{{ rule.nome }}</h3>
            <p class="text-sm text-gray-400">Processo: {{ rule.processo }}</p>
            <p class="text-sm text-gray-500 italic mt-1">{{ rule.descricao }}</p>
            <pre class="mt-2 p-2 bg-slate-900 rounded text-xs text-gray-400 overflow-x-auto max-w-xl">{{ JSON.stringify(rule.condicoes, null, 2) }}</pre>
          </div>
          <div class="flex flex-col items-end space-y-2">
            <span class="px-2 py-1 rounded-full text-xs font-bold" :class="rule.status === 'Ativa' ? 'bg-green-600' : 'bg-gray-600'">{{ rule.status }}</span>
            <button @click="startEdit(rule)" class="text-sm text-indigo-400 hover:underline">Editar</button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>