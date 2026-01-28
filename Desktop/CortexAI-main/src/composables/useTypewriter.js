import { ref } from 'vue';

export function useTypewriter() {
  const displayedText = ref('');
  const isTyping = ref(false);

  /**
   * Simula o streaming de um texto completo.
   * @param {string} fullText - O texto completo retornado pela IA
   * @param {number} speed - Velocidade em ms (padrão 15ms)
   */
  const streamText = async (fullText, speed = 15) => {
    isTyping.value = true;
    displayedText.value = '';
    
    // Pequeno delay inicial para "pensar"
    await new Promise(r => setTimeout(r, 300));

    for (let i = 0; i < fullText.length; i++) {
      displayedText.value += fullText[i];
      // Varia levemente a velocidade para parecer humano/processamento real
      const variance = Math.random() * 10;
      await new Promise(resolve => setTimeout(resolve, speed + variance));
    }
    
    isTyping.value = false;
  };

  return {
    displayedText,
    isTyping,
    streamText
  };
}