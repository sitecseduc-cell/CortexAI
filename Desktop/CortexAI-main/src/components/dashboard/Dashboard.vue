<script setup>
import { computed } from 'vue';
import StatCard from './StatCard.vue';
import { FileText, CheckCircle, ListChecks, AlertTriangle, LayoutDashboard } from 'lucide-vue-next';

const props = defineProps(['documents']);

// Cálculo automático das estatísticas com base nos documentos
const stats = computed(() => {
  const docs = props.documents || [];
  const total = docs.length;
  
  // Contagem por status (considerando variações do fluxo)
  const approved = docs.filter(d => d.status === 'Aprovado' || d.status === 'Finalizado').length;
  const pending = docs.filter(d => ['Validacao Pendente', 'Enriquecimento Pendente', 'Processing IDP', 'Raciocinio Pendente'].includes(d.status)).length;
  const rejected = docs.filter(d => ['Rejeitado', 'Failed'].includes(d.status)).length;

  // Taxas
  const completionRate = total > 0 ? (approved / total) * 100 : 0;
  const rejectionRate = total > 0 ? (rejected / total) * 100 : 0;

  return { total, approved, pending, rejected, completionRate, rejectionRate };
});
</script>

<template>
  <div class="p-6 text-white animate-fade-in">
    <h1 class="text-3xl font-extrabold mb-6 flex items-center text-indigo-400">
      <LayoutDashboard class="w-8 h-8 mr-3" /> Dashboard de Performance
    </h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard 
        title="Processos no Sistema" 
        :value="stats.total" 
        unit="" 
        :icon="FileText" 
        colorClass="text-indigo-400" 
      />
      
      <StatCard 
        title="Aprovados pelo Agente" 
        :value="stats.approved" 
        :unit="`/${stats.total}`" 
        :icon="CheckCircle" 
        colorClass="text-green-400" 
        :rate="stats.completionRate" 
        rateLabel="Taxa de Aprovação" 
      />
      
      <StatCard 
        title="Em Andamento / Validação" 
        :value="stats.pending" 
        unit="" 
        :icon="ListChecks" 
        colorClass="text-orange-400" 
      />
      
      <StatCard 
        title="Rejeitados / Falhas" 
        :value="stats.rejected" 
        unit="" 
        :icon="AlertTriangle" 
        colorClass="text-red-400" 
        :rate="stats.rejectionRate" 
        rateLabel="Taxa de Rejeição" 
      />
    </div>
  </div>
</template>