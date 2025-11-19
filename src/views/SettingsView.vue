<script setup>
import { ref } from 'vue';
import { Settings, Bell, Database, ShieldCheck } from 'lucide-vue-next';

const notifications = ref(true);
const autoProcess = ref(true);
const strictMode = ref(false);

const save = () => alert("Preferências salvas no perfil do usuário.");
</script>

<template>
  <div class="p-6 text-white max-w-4xl mx-auto animate-slide-up">
    <h1 class="text-3xl font-bold mb-8 flex items-center border-b border-slate-800 pb-4 neon-glow">
        <Settings class="w-8 h-8 mr-3 text-indigo-400" /> Configurações do Sistema
    </h1>
    
    <div class="grid gap-6">
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <h3 class="text-xl font-semibold mb-4 flex items-center text-white"><Bell class="w-5 h-5 mr-2 text-indigo-400"/> Notificações</h3>
            <label class="flex items-center justify-between cursor-pointer group">
                <span class="text-slate-300 group-hover:text-white transition-colors">Alertas de novos processos na fila</span>
                <input type="checkbox" v-model="notifications" class="w-5 h-5 accent-indigo-500 rounded cursor-pointer" />
            </label>
        </div>

        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <h3 class="text-xl font-semibold mb-4 flex items-center text-white"><Database class="w-5 h-5 mr-2 text-indigo-400"/> Automação IA (Gemini 2.0)</h3>
            <div class="space-y-4">
                <label class="flex items-center justify-between cursor-pointer group">
                    <div>
                        <span class="block text-slate-300 group-hover:text-white transition-colors">Processamento Automático (IDP)</span>
                        <span class="text-xs text-slate-500">Iniciar leitura assim que o upload for concluído.</span>
                    </div>
                    <input type="checkbox" v-model="autoProcess" class="w-5 h-5 accent-indigo-500 rounded cursor-pointer" />
                </label>
                <hr class="border-slate-700" />
                <label class="flex items-center justify-between cursor-pointer group">
                    <div>
                        <span class="block text-slate-300 group-hover:text-white transition-colors">Modo Estrito (Compliance)</span>
                        <span class="text-xs text-slate-500">Rejeitar automaticamente se a confiança for < 70%.</span>
                    </div>
                    <input type="checkbox" v-model="strictMode" class="w-5 h-5 accent-indigo-500 rounded cursor-pointer" />
                </label>
            </div>
        </div>

        <button @click="save" class="mt-4 px-6 py-4 bg-indigo-600 rounded-xl font-bold text-white hover:bg-indigo-500 transition-all btn-primary w-full md:w-auto self-end flex items-center justify-center">
            <ShieldCheck class="w-5 h-5 mr-2" /> Salvar Alterações
        </button>
    </div>
  </div>
</template>