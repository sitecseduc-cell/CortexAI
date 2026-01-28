<script setup>
import { computed } from 'vue';
import { ArrowRight, AlertCircle, Check } from 'lucide-vue-next';

const props = defineProps({
  original: { type: Object, required: true }, // Dados da IA (IDP)
  current: { type: Object, required: true }   // Dados Validados (Atuais)
});

// Calcula as diferenças campo a campo
const differences = computed(() => {
  const diffs = [];
  
  // Normaliza arrays de keyFields para objetos para facilitar comparação
  const orgMap = {};
  props.original.keyFields?.forEach(f => orgMap[f.field] = f.value);
  
  const currMap = {};
  props.current.keyFields?.forEach(f => currMap[f.field] = f.value);

  // Compara
  for (const key in currMap) {
    const originalVal = orgMap[key];
    const currentVal = currMap[key];

    if (originalVal !== currentVal) {
      diffs.push({
        field: key,
        old: originalVal || '(Vazio)',
        new: currentVal,
        isNew: !originalVal
      });
    }
  }
  return diffs;
});
</script>

<template>
  <div class="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
    <div class="bg-slate-800/50 p-3 border-b border-slate-700 flex justify-between items-center">
      <h3 class="text-sm font-bold text-slate-300 flex items-center">
        <AlertCircle class="w-4 h-4 mr-2 text-orange-400" />
        Histórico de Correções
      </h3>
      <span class="text-xs bg-slate-700 px-2 py-1 rounded text-slate-400">
        {{ differences.length }} alterações
      </span>
    </div>

    <div v-if="differences.length === 0" class="p-6 text-center text-slate-500 text-sm">
      <Check class="w-8 h-8 mx-auto mb-2 text-green-500/50" />
      <p>Dados validados sem alterações.</p>
    </div>

    <div v-else class="divide-y divide-slate-800">
      <div v-for="diff in differences" :key="diff.field" class="p-4 hover:bg-white/5 transition-colors grid grid-cols-1 md:grid-cols-7 gap-4 items-center group">
        
        <!-- Campo -->
        <div class="md:col-span-2">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Campo</span>
          <span class="text-sm text-indigo-300 font-mono">{{ diff.field }}</span>
        </div>

        <!-- Valor Original (IA) -->
        <div class="md:col-span-2 relative p-2 rounded bg-red-500/10 border border-red-500/20 text-red-300 line-through decoration-red-500/50 decoration-2">
           <span class="text-[10px] absolute -top-2 left-2 bg-slate-900 px-1 text-red-500 font-bold">IA (OCR)</span>
           {{ diff.old }}
        </div>

        <!-- Seta -->
        <div class="hidden md:flex justify-center md:col-span-1 text-slate-600">
          <ArrowRight class="w-5 h-5 group-hover:text-indigo-400 transition-colors" />
        </div>

        <!-- Novo Valor (Humano) -->
        <div class="md:col-span-2 relative p-2 rounded bg-green-500/10 border border-green-500/20 text-green-300 font-bold">
           <span class="text-[10px] absolute -top-2 left-2 bg-slate-900 px-1 text-green-500 font-bold">Humano</span>
           {{ diff.new }}
        </div>

      </div>
    </div>
  </div>
</template>