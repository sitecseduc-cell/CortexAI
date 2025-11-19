import { 
  Sun, Users, Award, TrendingUp, GraduationCap, Heart, 
  BookOpen, Baby, Briefcase, FileClock 
} from 'lucide-vue-next';

export const PROCESSOS_CCM = [
  { 
    id: "solicitacao_ferias", 
    nome: "Férias (Solicitação)", 
    descricao: "Direito a 30 dias anuais + 1/3 constitucional.",
    icon: Sun,
    template: "REQUERIMENTO: Solicito 30 dias de férias referentes ao exercício de 2024."
  },
  { 
    id: "licenca_maternidade", 
    nome: "Licença Maternidade", 
    descricao: "Afastamento de 180 dias (conforme lei estadual/municipal).",
    icon: Baby,
    template: "ATESTADO: Solicitação de licença maternidade de 180 dias a partir desta data."
  },
  { 
    id: "licenca_paternidade", 
    nome: "Licença Paternidade", 
    descricao: "Afastamento pelo nascimento de filho.",
    icon: Users,
    template: "CERTIDÃO: Solicito licença paternidade. Anexo certidão de nascimento."
  },
  { 
    id: "licenca_tratamento_saude", 
    nome: "Licença para Tratamento de Saúde", 
    descricao: "Afastamento médico (requer perícia se longa duração).",
    icon: Heart,
    template: "ATESTADO MÉDICO: Atesto necessidade de 15 dias de afastamento, CID J00."
  },
  { 
    id: "licenca_premio", 
    nome: "Licença Prêmio", 
    descricao: "Licença remunerada a cada 5 anos (Quinquênio).",
    icon: Award,
    template: "REQUERIMENTO: Solicito gozo de 3 meses referente ao quinquênio 2019-2024."
  },
  { 
    id: "licenca_doenca_familia", 
    nome: "Licença Doença em Pessoa da Família", 
    descricao: "Acompanhamento de familiar doente.",
    icon: Heart,
    template: "LAUDO: Acompanhamento de dependente (mãe) em tratamento hospitalar."
  },
  { 
    id: "licenca_capacitacao", 
    nome: "Licença para Capacitação", 
    descricao: "Afastamento para aprimoramento (a cada 5 anos).",
    icon: BookOpen,
    template: "MATRÍCULA: Solicito afastamento para cursar Mestrado Profissional."
  },
  { 
    id: "licenca_assuntos_particulares", 
    nome: "Licença Assuntos Particulares", 
    descricao: "Afastamento sem remuneração (conveniência da adm).",
    icon: Briefcase,
    template: "REQUERIMENTO: Solicito licença não remunerada por 2 anos."
  },
  { 
    id: "progressao_funcional", 
    nome: "Progressão Funcional", 
    descricao: "Mudança de classe/nível após interstício e avaliação.",
    icon: TrendingUp,
    template: "DECLARAÇÃO: Cumpri o interstício de 2 anos e as avaliações de desempenho."
  },
  { 
    id: "adicional_titulacao", 
    nome: "Adicional de Titulação", 
    descricao: "Gratificação por Pós, Mestrado ou Doutorado.",
    icon: GraduationCap,
    template: "DIPLOMA: Solicito adicional de titulação referente à conclusão de Especialização."
  },
  { 
    id: "adicional_tempo_servico", 
    nome: "Adicional Tempo de Serviço (Quinquênio)", 
    descricao: "Adicional automático a cada 5 anos.",
    icon: FileClock,
    template: "CERTIDÃO: Tempo de serviço averbado de 5 anos completos."
  },
  { 
    id: "salario_familia", 
    nome: "Salário-Família", 
    descricao: "Auxílio para dependentes elegíveis.",
    icon: Users,
    template: "CERTIDÃO NASCIMENTO: Solicito inclusão de dependente para salário-família."
  }
];