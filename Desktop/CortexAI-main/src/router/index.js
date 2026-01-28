import { createRouter, createWebHistory } from 'vue-router';
import PlatformView from '@/views/PlatformView.vue';
import Dashboard from '@/components/dashboard/Dashboard.vue';
import DocumentViewer from '@/components/documents/DocumentViewer.vue';
import RuleManager from '@/components/rules/RuleManager.vue';
import ToolsView from '@/views/ToolsView.vue';
import SettingsView from '@/views/SettingsView.vue';
// Componente dummy para lista se não tiver um específico
import DocumentList from '@/components/documents/DocumentList.vue'; 

const routes = [
  {
    path: '/',
    component: PlatformView, // Layout Principal
    children: [
      { 
        path: '', 
        redirect: '/dashboard' 
      },
      { 
        path: 'dashboard', 
        name: 'dashboard', 
        component: Dashboard 
      },
      { 
        path: 'processos', 
        name: 'processos', 
        component: DocumentList // Ou um componente que lista os processos
      },
      { 
        path: 'processos/:id', 
        name: 'detalhe-processo', 
        component: DocumentViewer,
        props: true
      },
      { 
        path: 'regras', 
        name: 'regras', 
        component: RuleManager,
        // Passando props via rota (exemplo)
        props: { rulesCollectionPath: 'artifacts/default-autonomous-agent/users/USER_ID_PLACEHOLDER/rules' }
      },
      { 
        path: 'ferramentas', 
        name: 'ferramentas', 
        component: ToolsView 
      },
      { 
        path: 'configuracoes', 
        name: 'configuracoes', 
        component: SettingsView 
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;