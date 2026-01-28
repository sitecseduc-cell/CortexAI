
import React, { useState } from 'react';
import { Search, Scale, BookOpen, ChevronRight, FileText, Gavel } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const MOCK_JURISPRUDENCE = [
    {
        id: 1,
        title: "Recurso Especial 1.234.567 - STJ",
        court: "Superior Tribunal de Justiça",
        date: "15/01/2024",
        summary: "Direito Administrativo. Licitação. Inexibilidade. Contratação de serviços técnicos especializados. Natureza singular do objeto. Notória especialização.",
        relevance: "Alta",
        tags: ["Licitação", "Administrativo", "Contratos"]
    },
    {
        id: 2,
        title: "Acórdão 256/2023 - TCU Plenário",
        court: "Tribunal de Contas da União",
        date: "10/12/2023",
        summary: "Auditoria de conformidade. Obras públicas. Sobrepreço decorrente de alterações contratuais. Responsabilidade solidária dos agentes públicos.",
        relevance: "Alta",
        tags: ["Obras", "TCU", "Auditoria"]
    },
    {
        id: 3,
        title: "Apelação Cível 0012345-67.2023.8.26.0053",
        court: "Tribunal de Justiça de SP",
        date: "28/11/2023",
        summary: "Improbidade Administrativa. Dolo específico necessário para condenação. Retroatividade da Lei 14.230/2021. Tema 1199 do STF.",
        relevance: "Média",
        tags: ["Improbidade", "Dolo", "STF"]
    },
    {
        id: 4,
        title: "Súmula Vinculante 13",
        court: "Supremo Tribunal Federal",
        date: "21/08/2008",
        summary: "A nomeação de cônjuge, companheiro ou parente em linha reta, colateral ou por afinidade, até o terceiro grau...",
        relevance: "Alta",
        tags: ["Nepotismo", "Súmula", "STF"]
    },
    {
        id: 5,
        title: "Agravo de Instrumento 555444-33.2023.4.01.0000",
        court: "TRF-1",
        date: "05/02/2024",
        summary: "Mandado de Segurança. Concurso Público. Exigência de exame psicotécnico sem critérios objetivos no edital. Ilegalidade.",
        relevance: "Média",
        tags: ["Concurso", "Administrativo", "TRF"]
    }
];

const Jurisprudence = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRelevance, setFilterRelevance] = useState('Todos');

    const filteredItems = MOCK_JURISPRUDENCE.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.summary.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterRelevance === 'Todos' || item.relevance === filterRelevance;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Scale className="text-indigo-500" />
                        Base de Jurisprudência
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">Consulta consolidada de decisões e precedentes.</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="glass-card p-4 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por tribunal, tema, número ou palavra-chave..."
                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 font-medium">
                    {['Todos', 'Alta', 'Média', 'Baixa'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterRelevance(status)}
                            className={`px-4 py-2 rounded-lg transition-all ${filterRelevance === status
                                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
                {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                        <div key={item.id} className="glass-card p-6 group hover:border-indigo-500/30 transition-all duration-300">
                            <div className="flex flex-col md:flex-row justify-between gap-4 mb-3">
                                <div className="flex items-start gap-3">
                                    <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                        <Gavel size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-indigo-500 transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                            {item.court}
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            {item.date}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${item.relevance === 'Alta' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-800' :
                                            'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                                        }`}>
                                        Relevância {item.relevance}
                                    </span>
                                </div>
                            </div>

                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4 pl-[calc(3rem+0.75rem)]">
                                {item.summary}
                            </p>

                            <div className="pl-[calc(3rem+0.75rem)] flex items-center gap-3">
                                {item.tags.map(tag => (
                                    <span key={tag} className="text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                                        #{tag}
                                    </span>
                                ))}
                                <button className="ml-auto flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:gap-2 transition-all">
                                    Ler Inteiro Teor <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 text-slate-400">
                        <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-lg">Nenhuma jurisprudência encontrada para "{searchTerm}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Jurisprudence;
