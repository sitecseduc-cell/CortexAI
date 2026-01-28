# CORTEX AI - Plataforma de Inteligência Governamental

**Cortex AI** é uma plataforma *GovTech* de última geração desenhada para automatizar e agilizar a análise de processos administrativos de Recursos Humanos no setor público.

A aplicação utiliza Inteligência Artificial Generativa (Gemini 1.5 Flash) para realizar o Processamento Inteligente de Documentos (IDP), validação de regras estatutárias (RAR) e auxílio à tomada de decisão, com foco específico no Estatuto dos Servidores Públicos (atualmente configurado para o Estado do Pará, Brasil).

![Vue.js](https://img.shields.io/badge/vuejs-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

## 🚀 Funcionalidades Principais

* **Orquestração de Agentes IA:** Fluxo automatizado que passa por:
    1.  **IDP (Extração):** Leitura de documentos e extração de campos chave (ex: Nome, Matrícula, Tipo de Documento).
    2.  **Enriquecimento:** Cruzamento automático com base de dados de servidores.
    3.  **Raciocínio (Reasoning):** Aplicação de regras legais (ex: verificar se o tempo de serviço permite a licença prêmio).
* **Validação Humana (Human-in-the-loop):** Interface para os analistas reverem e corrigirem os dados extraídos pela IA antes da conclusão.
* **Gestão de Regras Dinâmicas:** Módulo para criar e editar regras de negócio (JSON) sem necessidade de alterar o código fonte.
* **Assistente Jurídico:** Chatbot integrado com conhecimento da legislação (Lei 5.810/94 e PCCR) para tirar dúvidas rápidas.
* **Dashboard de Performance:** Métricas em tempo real sobre taxas de aprovação, rejeição e volume de processos.
* **Upload Inteligente:** Suporte para arrastar e largar ficheiros ou utilização de *templates* para testes rápidos.

## 🛠️ Stack Tecnológica

### Frontend
* **Framework:** Vue 3 (Composition API)
* **Build Tool:** Vite
* **Estilos:** Tailwind CSS
* **Gestão de Estado:** Pinia
* **Ícones:** Lucide Vue Next
* **Visualização PDF:** Vue PDF Embed

### Backend (Serverless)
* **Core:** Firebase (Authentication, Firestore, Hosting)
* **Compute:** Firebase Cloud Functions (Node.js 22)
* **AI Model:** Google Generative AI (Gemini 1.5 Flash)

## ⚙️ Pré-requisitos

Antes de começar, certifique-se de que tem instalado:
* [Node.js](https://nodejs.org/) (Versão 20 ou superior recomendada)
* [Firebase CLI](https://firebase.google.com/docs/cli) (`npm install -g firebase-tools`)

## 📦 Instalação e Configuração

### 1. Clonar o Repositório

```bash
git clone [https://github.com/seu-usuario/cortex-ai.git](https://github.com/seu-usuario/cortex-ai.git)
cd cortex-ai
