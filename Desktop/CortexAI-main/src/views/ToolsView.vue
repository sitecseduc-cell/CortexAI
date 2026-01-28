<script setup>
import { ref, watch, nextTick } from 'vue';
import { geminiApiService } from '@/services/geminiService';
// Adicionado Loader2 que estava faltando
import { Send, Bot, User, Briefcase, BookOpen, Loader2 } from 'lucide-vue-next';

// 1. Declaração de Estado (deve vir antes das funções que as usam)
const userInput = ref('');
const loading = ref(false);
const chatContainer = ref(null); // Referência para o scroll

const messages = ref([
  { 
    role: 'assistant', 
    text: 'Olá! Sou seu assistente jurídico especializado na Lei 5.810 (RJU do Pará) e PCCR da Educação. Posso tirar dúvidas sobre licenças, afastamentos e direitos.' 
  }
]);

// 2. Função de Scroll Automático
const scrollToBottom = async () => {
  await nextTick();
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

// Observa mudanças nas mensagens para rolar a tela
watch(messages, () => {
  scrollToBottom();
}, { deep: true });

// 3. Função de Envio Unificada
const sendMessage = async () => {
  if (!userInput.value.trim()) return;
  
  const text = userInput.value;
  
  // Adiciona mensagem do usuário
  messages.value.push({ role: 'user', text });
  userInput.value = '';
  loading.value = true;

  try {
    // Prompt Engenharia para o contexto jurídico
    const prompt = `Você é um advogado especialista em servidores públicos do Estado do Pará. Responda com base na Lei 5.810/94. Pergunta: ${text}`;
    
    // Chamada à API
    // Nota: Solicitando JSON para manter padrão, mas extraindo o texto para a UI
    const jsonInstruction = "Responda estritamente em formato JSON com a chave 'resposta': { \"resposta\": \"texto da resposta\" }";
    
    const response = await geminiApiService.callGeminiAPI(prompt, jsonInstruction);
    
    // Tratamento robusto caso a resposta venha como objeto ou string
    const replyText = response.resposta || response.text || "Não encontrei base legal específica para esta consulta.";

    messages.value.push({ role: 'assistant', text: replyText });

  } catch (error) {
    console.error(error);
    messages.value.push({ role: 'assistant', text: 'Desculpe, o sistema jurídico está instável no momento. Tente novamente.' });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="flex flex-col h-full bg-slate-900 text-white p-6 animate-fade-in">
    <!-- Header -->
    <div class="mb-6 border-b border-slate-800 pb-4">
        <h1 class="text-3xl font-bold flex items-center text-indigo-400 neon-glow">
            <Briefcase class="w-8 h-8 mr-3" /> Ferramentas Jurídicas
        </h1>
        <p class="text-slate-400 mt-1 flex items-center">
          <BookOpen class="w-4 h-4 mr-2"/> Base de Conhecimento: Estatuto dos Servidores (PA)
        </p>
    </div>

    <!-- Chat Area -->
    <!-- Adicionado ref="chatContainer" para o auto-scroll -->
    <div ref="chatContainer" class="flex-grow overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar bg-slate-950/30 p-4 rounded-xl border border-slate-800">
      <div v-for="(msg, i) in messages" :key="i" class="flex" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
        <div class="max-w-[80%] p-4 rounded-xl shadow-lg" :class="msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'">
            <div class="flex items-center mb-1 opacity-70 text-xs uppercase font-bold tracking-wider">
                <component :is="msg.role === 'user' ? User : Bot" class="w-3 h-3 mr-1" /> 
                {{ msg.role === 'user' ? 'Você' : 'Assistente Jurídico' }}
            </div>
            <!-- whitespace-pre-wrap preserva quebras de linha da resposta da IA -->
            <p class="leading-relaxed whitespace-pre-wrap">{{ msg.text }}</p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-start">
          <div class="bg-slate-800 p-4 rounded-xl rounded-tl-none text-slate-400 animate-pulse flex items-center">
             <Loader2 class="w-4 h-4 mr-2 animate-spin" /> Consultando legislação...
          </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="relative">
      <input 
        v-model="userInput" 
        @keydown.enter="sendMessage"
        :disabled="loading"
        type="text" 
        placeholder="Ex: Professor em estágio probatório pode pedir licença interesse?" 
        class="w-full bg-slate-800 text-white p-4 pr-14 rounded-xl border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-lg disabled:opacity-50"
      />
      <button 
        @click="sendMessage" 
        :disabled="loading || !userInput.trim()"
        class="absolute right-2 top-2 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 rounded-lg text-white transition-colors btn-primary">
        <Send class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Adicionei estilos simples para as classes customizadas que você usou */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.5);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #4f46e5;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #4338ca;
}

.neon-glow {
  text-shadow: 0 0 10px rgba(129, 140, 248, 0.3);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}
</style>