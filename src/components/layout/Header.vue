<script setup>
import { inject } from 'vue';
import { Briefcase, LayoutDashboard, Bell, Sun, Moon } from 'lucide-vue-next';

// Injeta as funções providas pelo App.vue
const toggleTheme = inject('toggleTheme');
const isDark = inject('isDark');
</script>

<template>
  <header class="flex items-center justify-between p-3 border-b shadow-md z-10 shrink-0 transition-colors duration-300 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
    <div class="flex items-center space-x-6">
      <div class="flex items-center">
        <Briefcase class="w-7 h-7 mr-2 text-indigo-600 dark:text-indigo-400" />
        <h1 class="text-xl font-bold text-slate-800 dark:text-white">CortexIA</h1>
      </div>
      
      <div class="h-8 border-l border-slate-300 dark:border-slate-800"></div>
      
      <nav class="flex items-center space-x-2">
        <button class="flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white shadow-md transition-all hover:bg-indigo-700">
          <LayoutDashboard class="w-5 h-5 mr-2" />
          <span>Plataforma</span>
        </button>
      </nav>
    </div>

    <div class="flex items-center space-x-4">
      <button class="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-slate-800 transition-colors">
        <Bell class="w-5 h-5"/>
      </button>
      
      <button @click="toggleTheme" class="p-2 rounded-full transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
        <Sun v-if="isDark" class="w-5 h-5 text-yellow-400" />
        <Moon v-else class="w-5 h-5 text-slate-600" />
      </button>
      
      <div class="relative">
        <img src="https://placehold.co/40x40/a78bfa/ffffff?text=A" alt="Avatar" class="w-10 h-10 rounded-full cursor-pointer border-2 border-white dark:border-slate-700 shadow-sm"/>
        <span class="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-slate-900"></span>
      </div>
    </div>
  </header>
</template>