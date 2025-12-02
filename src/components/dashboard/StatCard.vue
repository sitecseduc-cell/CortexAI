<script setup>
import { computed } from 'vue';
import { TrendingUp, FileText } from 'lucide-vue-next'; // Fallback icon

const props = defineProps({
    title: { type: String, default: 'Título' },
    value: { type: [Number, String], default: 0 },
    unit: { type: String, default: '' },
    icon: { type: Object, default: () => FileText },
    colorClass: { type: String, default: 'text-slate-400' }, // Valor padrão seguro
    rate: Number,
    rateLabel: String
});

// Gera classes dinâmicas para o "brilho" baseado na cor do ícone (simplificado)
// CORREÇÃO: Uso de ?. para evitar erro se colorClass for nulo em algum momento
const glowClass = computed(() => {
    if (props.colorClass?.includes('green')) return 'from-green-500/10 to-transparent border-green-500/20';
    if (props.colorClass?.includes('red')) return 'from-red-500/10 to-transparent border-red-500/20';
    if (props.colorClass?.includes('indigo')) return 'from-indigo-500/10 to-transparent border-indigo-500/20';
    return 'from-slate-700/10 to-transparent border-slate-700/20';
});

const rateColor = computed(() => {
    if (props.rate > 75) return 'text-green-400'; // eslint-disable-line
    if (props.rate > 40) return 'text-yellow-400';
    return 'text-red-400';
});
</script>

<template>
  <div class="relative p-6 rounded-2xl border bg-gradient-to-br transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group backdrop-blur-sm bg-slate-900/40"
       :class="[glowClass]">    

    <div class="relative z-10">
      <div class="flex items-center mb-2">
          <div class="p-2 rounded-lg bg-slate-950/50 border border-white/5 mr-3">
              <component :is="icon" class="w-5 h-5" :class="colorClass" />
          </div>
          <p class="text-xs font-bold uppercase tracking-wider text-slate-400">{{ title }}</p>
      </div>
      
      <h2 class="text-4xl font-bold text-white mt-2 flex items-baseline">
          {{ value }} <span class="text-lg text-slate-500 ml-1 font-normal">{{ unit }}</span>
      </h2>
      
      <div v-if="rate !== undefined" class="mt-4 flex items-center">
          <div class="px-2 py-1 rounded-md bg-slate-950/50 border border-white/5 flex items-center">
              <TrendingUp class="w-3 h-3 mr-1.5" :class="rateColor" />
              <span class="text-xs font-bold" :class="rateColor">{{ rate.toFixed(1) }}%</span> <!-- eslint-disable-line -->
          </div>
          <span class="ml-2 text-xs text-slate-500">{{ rateLabel }}</span>
      </div>
    </div>
  </div>
</template>