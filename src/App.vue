<script setup>
import { ref, provide, onMounted } from 'vue';
import PlatformView from '@/views/PlatformView.vue';
import ToastContainer from '@/components/ui/ToastContainer.vue';

// Estado do Tema
const isDark = ref(true);

const toggleTheme = () => {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Inicializa com Dark Mode
onMounted(() => {
  document.documentElement.classList.add('dark');
});

// Disponibiliza para os filhos (Header)
provide('toggleTheme', toggleTheme);
provide('isDark', isDark);
</script>
<template>
  <div class="min-h-screen transition-colors duration-300 bg-gray-100 text-slate-900 dark:bg-slate-950 dark:text-white">
    <ToastContainer />
    <PlatformView @toggle-theme="toggleTheme" />
  </div>
</template>
<style>
/* Removemos o estilo global do body que forçava o fundo escuro */
body {
  margin: 0;
  overflow: hidden;
}
</style>