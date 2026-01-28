
import React from 'react';
import { useData } from '../contexts/DataContext';
import { formatCurrency } from '../utils/formatters';
import { Activity, AlertTriangle, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, colorClass, trend }) => (
    <div className="glass-card p-6 flex flex-col justify-between h-40">
        <div className="flex justify-between items-start">
            <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100`}>
                <Icon size={24} />
            </div>
            {trend && <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">{trend}</span>}
        </div>
        <div>
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm">{title}</h3>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
        </div>
    </div>
);

const Dashboard = () => {
    const { stats, processes } = useData();

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Central de Inteligência</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Monitoramento de processos públicos em tempo real.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Processos Analisados"
                    value={stats.analyzedProcesses}
                    icon={Activity}
                    colorClass="text-indigo-500 bg-indigo-500"
                    trend="+12%"
                />
                <StatCard
                    title="Alertas de Alto Risco"
                    value={stats.riskAlerts}
                    icon={AlertTriangle}
                    colorClass="text-amber-500 bg-amber-500"
                />
                <StatCard
                    title="Economia Potencial"
                    value={formatCurrency(stats.potentialSavings)}
                    icon={TrendingDown}
                    colorClass="text-emerald-500 bg-emerald-500"
                />
            </div>

            <section>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Análises Recentes</h3>
                <div className="glass overflow-hidden rounded-xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200/50 dark:border-white/5 text-sm text-slate-500 dark:text-slate-400">
                                <th className="p-4 font-medium">Processo</th>
                                <th className="p-4 font-medium">Status da IA</th>
                                <th className="p-4 font-medium">Risco Calculado</th>
                                <th className="p-4 font-medium">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processes.slice(0, 3).map((process) => (
                                <tr key={process.id} className="border-b border-slate-200/50 dark:border-white/5 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium text-slate-800 dark:text-white">{process.number}</div>
                                        <div className="text-xs text-slate-500">{process.agency}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                            ${process.status === 'Concluído' ? 'bg-emerald-500/10 text-emerald-600' :
                                                process.status === 'Alerta de Risco' ? 'bg-red-500/10 text-red-600' :
                                                    'bg-indigo-500/10 text-indigo-600'}`}>
                                            {process.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full 
                                                ${process.riskLevel === 'Alto' ? 'bg-red-500' :
                                                    process.riskLevel === 'Médio' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                                            </div>
                                            <span className="text-sm text-slate-600 dark:text-slate-300">{process.riskLevel} ({process.confidence}%)</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-800 dark:text-white font-mono">{formatCurrency(process.value)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
