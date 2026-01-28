import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom', // Define o ambiente de DOM para os testes
    globals: true, // Opcional: para usar describe, it, etc. sem importar
    exclude: [
      '**/node_modules/**',
      '**/functions/**', // Ignora a pasta das Cloud Functions
    ],
  },
});