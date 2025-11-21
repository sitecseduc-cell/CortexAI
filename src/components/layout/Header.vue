<script setup>
import { Briefcase, LayoutDashboard, Bell, MessageSquare, Sun } from 'lucide-vue-next';
</script>

<template>
  <header class="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900 shadow-md z-10 shrink-0">
    <div class="flex items-center space-x-6">
      <div class="flex items-center">
        <Briefcase class="w-7 h-7 mr-2 text-indigo-400 neon-glow" />
        <h1 class="text-xl font-bold text-white">CortexIA</h1>
      </div>
      
      <div class="h-8 border-l border-slate-800"></div>
      
      <nav class="flex items-center space-x-2">
        <button class="flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white shadow-md transition-all">
          <LayoutDashboard class="w-5 h-5 mr-2" />
          <span>Plataforma de Processos</span>
        </button>
      </nav>
    </div>

    <div class="flex items-center space-x-4">
      <button class="p-2 rounded-full hover:bg-slate-800 text-gray-400 hover:text-white transition-colors">
        <Bell class="w-5 h-5"/>
      </button>
      <button class="p-2 rounded-full hover:bg-slate-800 text-gray-400 hover:text-white transition-colors">
        <MessageSquare class="w-5 h-5"/>
      </button>
      
      <button class="p-2 rounded-full bg-slate-700 text-yellow-300 hover:opacity-80 transition-opacity">
        <Sun class="w-5 h-5" />
      </button>
      
      <div class="relative">
        <img src="https://placehold.co/40x40/a78bfa/ffffff?text=A" alt="Avatar" class="w-10 h-10 rounded-full cursor-pointer border-2 border-slate-700"/>
        <span class="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-slate-900"></span>
      </div>
    </div>
  </header>
</template>