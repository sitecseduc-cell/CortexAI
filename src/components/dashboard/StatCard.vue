<script setup>
import { computed } from 'vue';
import { TrendingUp } from 'lucide-vue-next';

const props = defineProps(['title', 'value', 'unit', 'icon', 'colorClass', 'rate', 'rateLabel']);

// Define a cor da setinha de tendência baseada na porcentagem
const rateColor = computed(() => {
    if (props.rate > 75) return 'text-green-400';
    if (props.rate > 40) return 'text-yellow-400';
    return 'text-red-400';
});
</script>

<template>
  <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg hover:translate-y-[-2px] transition-all duration-300">
    <div class="flex justify-between items-start">
      <div>
        <p class="text-sm font-medium text-gray-400">{{ title }}</p>
        <h2 class="text-3xl font-bold mt-1 text-white">
            {{ value }} <span class="text-lg text-gray-500">{{ unit }}</span>
        </h2>
      </div>
      <component :is="icon" class="w-8 h-8" :class="colorClass" />
    </div>
    
    <div v-if="rate !== undefined" class="mt-4 text-xs font-semibold flex items-center">
        <TrendingUp class="w-4 h-4 mr-1" :class="rateColor" />
        <span :class="rateColor">{{ rate.toFixed(1) }}%</span>
        <span class="ml-1 text-gray-500">{{ rateLabel }}</span>
    </div>
  </div>
</template>