<script setup>
import { ref } from 'vue';
import { geminiApiService } from '@/services/geminiService';
import { Send, Bot, User, Briefcase, BookOpen } from 'lucide-vue-next';

const messages = ref([
  { role: 'assistant', text: 'Olá! Sou seu assistente jurídico especializado na Lei 5.810 (RJU do Pará) e PCCR da Educação. Posso tirar dúvidas sobre licenças, afastamentos e direitos.' }
]);
const userInput = ref('');
const loading = ref(false);

const sendMessage = async () => {
  if (!userInput.value.trim()) return;
  
  const text = userInput.value;
  messages.value.push({ role: 'user', text });
  userInput.value = '';
  loading.value = true;

  try {
    // Chamada direta à API (adaptada para texto livre)
    // Nota: Usa o mesmo serviço, mas ignora o schema JSON estrito para este chat
    const prompt = `Você é um advogado especialista em servidores públicos do Estado do Pará. Responda com base na Lei 5.810/94. Pergunta: ${text}`;
    
    // Simulando resposta inteligente (pois o serviço atual força JSON)
    // Em produção, criaríamos um método 'callGeminiChat' no service.
    // Aqui, para não quebrar o padrão JSON, encapsulamos a resposta.
    const response = await geminiApiService.callGeminiAPI(prompt, "Responda em formato JSON: { \"resposta\": \"texto da resposta\" }");
    
    messages.value.push({ role: 'assistant', text: response.resposta || "Não encontrei base legal específica." });
  } catch (error) {
    messages.value.push({ role: 'assistant', text: 'Desculpe, o sistema jurídico está instável. Tente novamente.' });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="flex flex-col h-full bg-slate-900 text-white p-6 animate-fade-in">
    <div class="mb-6 border-b border-slate-800 pb-4">
        <h1 class="text-3xl font-bold flex items-center text-indigo-400 neon-glow">
            <Briefcase class="w-8 h-8 mr-3" /> Ferramentas Jurídicas
        </h1>
        <p class="text-slate-400 mt-1 flex items-center"><BookOpen class="w-4 h-4 mr-2"/> Base de Conhecimento: Estatuto dos Servidores (PA)</p>
    </div>

    <div class="flex-grow overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar bg-slate-950/30 p-4 rounded-xl border border-slate-800">
      <div v-for="(msg, i) in messages" :key="i" class="flex" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
        <div class="max-w-[80%] p-4 rounded-xl shadow-lg" :class="msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'">
            <div class="flex items-center mb-1 opacity-70 text-xs uppercase font-bold tracking-wider">
                <component :is="msg.role === 'user' ? User : Bot" class="w-3 h-3 mr-1" /> {{ msg.role === 'user' ? 'Você' : 'Assistente Jurídico' }}
            </div>
            <p class="leading-relaxed">{{ msg.text }}</p>
        </div>
      </div>
      <div v-if="loading" class="flex justify-start">
          <div class="bg-slate-800 p-4 rounded-xl rounded-tl-none text-slate-400 animate-pulse flex items-center">
             <Loader2 class="w-4 h-4 mr-2 animate-spin" /> Consultando legislação...
          </div>
      </div>
    </div>

    <div class="relative">
      <input 
        v-model="userInput" 
        @keydown.enter="sendMessage"
        type="text" 
        placeholder="Ex: Professor em estágio probatório pode pedir licença interesse?" 
        class="w-full bg-slate-800 text-white p-4 pr-14 rounded-xl border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-lg"
      />
      <button @click="sendMessage" class="absolute right-2 top-2 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors btn-primary">
        <Send class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>