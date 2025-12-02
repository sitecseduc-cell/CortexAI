<script setup>
import { ref } from 'vue';
import { Shield, Plus, Trash, Save, X, Check } from 'lucide-vue-next';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/libs/firebase'; 
import { useToastStore } from '@/stores/toast';

const props = defineProps(['rules', 'rulesCollectionPath']);
const toast = useToastStore();

const editingId = ref(null);
const tempRule = ref({});

const OPERATORS = ['==', '!=', '>', '<', '>=', '<=', 'contém'];

const startEdit = (rule) => {
  editingId.value = rule.id;
  // Clona o objeto profundamente para evitar mutação direta antes de salvar
  tempRule.value = JSON.parse(JSON.stringify(rule));
  // Garante que arrays existam
  if (!tempRule.value.condicoes) tempRule.value.condicoes = [];
  // Garante que objeto de ação exista
  if (!tempRule.value.acao_se_verdadeiro) tempRule.value.acao_se_verdadeiro = { status: '', mensagem: '' };
};

const cancelEdit = () => {
  editingId.value = null;
  tempRule.value = {};
};

const addCondition = () => {
    tempRule.value.condicoes.push({ fato: '', operador: '==', valor: '' });
};

const removeCondition = (index) => {
    tempRule.value.condicoes.splice(index, 1);
};

const saveRule = async () => {
  if (!props.rulesCollectionPath) {
      toast.addToast('Erro: Caminho das regras não definido.', 'error');
      return;
  }

  try {
    // Converte valores numéricos se necessário para garantir comparação correta
    const cleanConditions = tempRule.value.condicoes.map(c => ({
        ...c,
        valor: !isNaN(c.valor) && c.valor !== '' ? Number(c.valor) : c.valor
    }));

    const ruleToSave = {
        ...tempRule.value,
        condicoes: cleanConditions
    };

    const ruleRef = doc(db, props.rulesCollectionPath, editingId.value);
    await setDoc(ruleRef, ruleToSave, { merge: true });
    
    toast.addToast('Regra atualizada com sucesso!', 'success');
    editingId.value = null;
  } catch (e) {
    console.error(e);
    toast.addToast('Erro ao salvar regra.', 'error');
  }
};
</script>

<template>
  <div class="p-6 pb-20 text-slate-900 dark:text-white">
    <h1 class="text-3xl font-extrabold flex items-center mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
      <Shield class="w-8 h-8 mr-3 text-indigo-500" /> Editor de Regras No-Code
    </h1>
    
    <div v-if="!rules || rules.length === 0" class="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <Shield class="w-12 h-12 mb-3 opacity-20" />
        <p>Nenhuma regra de negócio configurada.</p>
        <span class="text-xs">O sistema irá gerar as regras padrão em instantes...</span>
    </div>

    <div v-else class="grid gap-6">
      <div v-for="rule in rules" :key="rule.id" class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg animate-slide-up">
        
        <!-- Modo Edição -->
        <div v-if="editingId === rule.id" class="space-y-4">
          <div class="flex justify-between mb-2">
              <label class="text-xs text-slate-400 uppercase font-bold">Nome da Regra</label>
              <span class="text-xs text-orange-400 font-mono flex items-center"><Shield class="w-3 h-3 mr-1"/> Editando...</span>
          </div>
          <input v-model="tempRule.nome" class="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-bold mb-4 focus:ring-2 focus:ring-indigo-500 outline-none" />
          
          <!-- Construtor de Condições Visual -->
          <div class="bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-300 dark:border-slate-600">
              <div class="flex justify-between items-center mb-3 ">
                  <h3 class="text-sm font-bold text-indigo-300">Condições (Se...)</h3>
                  <button @click="addCondition" class="text-xs flex items-center bg-indigo-600 px-2 py-1 rounded hover:bg-indigo-500 text-white transition-colors">
                      <Plus class="w-3 h-3 mr-1"/> Adicionar
                  </button>
              </div>
              
              <div v-if="tempRule.condicoes.length === 0" class="text-center py-4 text-slate-600 text-xs italic">
                  Nenhuma condição definida. Adicione uma para começar.
              </div>

              <div v-for="(cond, idx) in tempRule.condicoes" :key="idx" class="flex gap-2 mb-2 items-center animate-fade-in">
                  <input v-model="cond.fato" placeholder="Campo (ex: tempo_servico)" class="flex-1 p-2 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs text-slate-900 dark:text-white focus:border-indigo-500 outline-none" />
                  <select v-model="cond.operador" class="w-24 p-2 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs text-slate-900 dark:text-white focus:border-indigo-500 outline-none">
                      <option v-for="op in OPERATORS" :key="op" :value="op">{{ op }}</option>
                  </select>
                  <input v-model="cond.valor" placeholder="Valor" class="flex-1 p-2 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs text-slate-900 dark:text-white focus:border-indigo-500 outline-none" />
                  <button @click="removeCondition(idx)" class="p-2 text-slate-500 hover:text-red-400 transition-colors"><Trash class="w-4 h-4"/></button>
              </div>
          </div>

          <!-- Ação -->
          <div class="bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-300 dark:border-slate-600">
              <h3 class="text-sm font-bold text-indigo-500 dark:text-indigo-300 mb-2">Então (Resultado)</h3>
              <div class="flex flex-col md:flex-row gap-4">
                  <div class="w-full md:w-1/3">
                      <label class="text-xs text-slate-500 block mb-1">Status Final</label>
                      <select v-model="tempRule.acao_se_verdadeiro.status" class="w-full p-2 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-indigo-500 outline-none">
                          <option value="Aprovado">Aprovado</option>
                          <option value="REJEITADO">Rejeitado</option>
                          <option value="FALHA">Falha / Atenção</option>
                      </select>
                  </div>
                  <div class="w-full md:w-2/3">
                      <label class="text-xs text-slate-500 block mb-1">Mensagem de Justificativa</label>
                      <input v-model="tempRule.acao_se_verdadeiro.mensagem" class="w-full p-2 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-indigo-500 outline-none" />
                  </div>
              </div>
          </div>

          <div class="flex justify-end space-x-3 mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
             <button @click="cancelEdit" class="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 text-sm font-medium text-slate-800 dark:text-white transition-colors flex items-center">
                <X class="w-4 h-4 mr-1"/> Cancelar
             </button>
             <button @click="saveRule" class="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-500 flex items-center text-white font-bold shadow-lg shadow-green-900/20 transition-all hover:-translate-y-0.5 text-sm">
                <Save class="w-4 h-4 mr-2"/> Salvar Regra
             </button>
          </div>
        </div>

        <!-- Modo Visualização (Read-Only) -->
        <div v-else class="flex justify-between items-start">
          <div class="flex-1 pr-4">
            <div class="flex items-center gap-3 mb-2 ">
                <h3 class="text-xl font-bold text-indigo-400">{{ rule.nome }}</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border" :class="rule.status === 'Ativa' ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-gray-500/30 text-gray-400 bg-gray-500/10'">
                    {{ rule.status || 'Inativa' }}
                </span>
            </div>
            
            <div class="mt-3 space-y-2">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-slate-500 uppercase w-16 shrink-0">Se:</span>
                    <div class="flex-1 flex flex-wrap gap-2 ">
                        <div v-for="(c, i) in rule.condicoes" :key="i" class="text-xs flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1">
                            <span class="text-indigo-300 font-mono mr-1">{{ c.fato }}</span>
                            <span class="text-yellow-500 font-bold mr-1">{{ c.operador }}</span>
                            <span class="text-slate-800 dark:text-white font-semibold">{{ c.valor }}</span>
                        </div>
                        <span v-if="!rule.condicoes?.length" class="text-slate-600 text-xs italic">Sem condições</span>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-slate-500 uppercase w-16 shrink-0">Então:</span>
                    <div class="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 rounded px-2 py-1">
                        <span :class="rule.acao_se_verdadeiro?.status === 'Aprovado' ? 'text-green-400' : rule.acao_se_verdadeiro?.status === 'REJEITADO' ? 'text-red-400' : 'text-orange-400'" class="font-bold text-xs uppercase">
                            {{ rule.acao_se_verdadeiro?.status || 'N/A' }}
                        </span>
                        <span class="text-slate-400 text-xs hidden sm:inline">-</span>
                        <span class="text-slate-300 text-xs italic truncate max-w-[200px] sm:max-w-md">
                            "{{ rule.acao_se_verdadeiro?.mensagem }}"
                        </span>
                    </div>
                </div>
            </div>
          </div>
          
          <button @click="startEdit(rule)" class="px-3 py-2 text-xs font-semibold bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-600 hover:text-white transition-all hover:shadow-indigo-500/20 hover:shadow-lg flex items-center shrink-0">
              Editar
          </button>
        </div>

      </div>
    </div>
  </div>
</template>