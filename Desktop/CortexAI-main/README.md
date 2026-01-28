Com base nos ficheiros fornecidos, aqui está uma proposta completa de README.md para o projeto Cortex AI.

O documento está estruturado para destacar a arquitetura técnica (Vue 3 + Supabase + Gemini AI) e o propósito do negócio (RH Público do Estado do Pará).

Cortex AI
O Cortex AI é uma plataforma de agente autónomo desenvolvida para auxiliar o setor de Recursos Humanos (RH) Público do Estado do Pará. A aplicação automatiza a análise, extração de dados e validação de documentos administrativos (como requerimentos de férias, licenças, etc.) utilizando Inteligência Artificial Generativa.

🚀 Funcionalidades Principais
Análise de Documentos com IA: Utiliza o Google Gemini (modelo gemini-1.5-flash) para ler ficheiros PDF, classificar o tipo de documento e extrair campos chave (Nome, Matrícula, Cargo, Período Aquisitivo, etc.).

Processamento de Linguagem Natural: Gera resumos e análises de sentimento dos requerimentos.

Gestão de Processos em Tempo Real: Sincronização imediata de estados dos processos (Raciocínio Pendente, Validação Pendente, Concluído) via Supabase Realtime.

Validação Humana: Interface para que operadores humanos validem ou corrijam as extrações feitas pela IA antes da aprovação final.

Dashboard Interativo: Visão geral das métricas e lista de processos ativos.

Gestão de Regras: Módulo para configuração de regras de negócio aplicáveis aos documentos.

🛠️ Stack Tecnológica
Frontend: Vue.js 3 (Composition API, <script setup>)

Build Tool: Vite

Estilização: Tailwind CSS com lucide-vue-next para ícones.

Estado & Router: Pinia e Vue Router.

Backend / BaaS: Supabase (Base de dados, Autenticação e Realtime).

Inteligência Artificial: Google Generative AI SDK (Gemini).

Testes: Vitest.

📂 Estrutura de Base de Dados (Supabase)
A aplicação depende das seguintes tabelas principais no Supabase:

processos: Armazena os documentos enviados, metadados, status e o resultado JSON da extração da IA.

regras: Armazena as regras de negócio configuráveis pelo utilizador.

⚙️ Configuração e Instalação
Pré-requisitos
Node.js (v22.x recomendado)

Uma conta no Supabase.

Uma chave de API do Google Gemini.

Passos para Instalação
Clonar o repositório:

Bash

git clone https://github.com/seu-usuario/cortex-ai.git
cd cortex-ai
Instalar dependências:

Bash

npm install
Configurar Variáveis de Ambiente: Crie um ficheiro .env.local na raiz do projeto e preencha com as suas chaves:

Snippet de código

VITE_GEMINI_API_KEY=sua_chave_api_google_gemini
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
Executar o servidor de desenvolvimento:

Bash

npm run dev
📜 Scripts Disponíveis
De acordo com o package.json:

npm run dev: Inicia o servidor de desenvolvimento local.

npm run build: Compila a aplicação para produção.

npm run preview: Visualiza a build de produção localmente.

npm run test: Executa os testes unitários com Vitest.

🧩 Estrutura do Projeto
src/services/geminiService.js: Lógica de integração com a IA, incluindo os prompts de sistema para o contexto de RH.

src/libs/supabase.js: Inicialização do cliente Supabase.

src/composables/useFirestore.js: Hook (nomeado por legado, mas utiliza Supabase) para abstração de chamadas à base de dados com suporte a live updates.

src/views/PlatformView.vue: Layout principal que orquestra o Dashboard, Visualizador de Documentos e Menus.

🤝 Contribuição
Faça um Fork do projeto.

Crie uma Branch para a sua Feature (git checkout -b feature/NovaFuncionalidade).

Faça o Commit das suas alterações (git commit -m 'Adiciona NovaFuncionalidade').

Faça o Push para a Branch (git push origin feature/NovaFuncionalidade).

Abra um Pull Request.
