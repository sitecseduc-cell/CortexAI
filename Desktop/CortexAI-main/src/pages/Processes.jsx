
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Plus, Search, ShieldAlert, FileText } from 'lucide-react';
import Modal from '../components/ui/Modal';
import { formatCurrency } from '../utils/formatters';

const Processes = () => {
    const { processes, addProcess, deleteProcess } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ number: '', agency: '', description: '', value: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        addProcess({
            number: formData.number,
            agency: formData.agency,
            description: formData.description,
            value: Number(formData.value)
        });
        setFormData({ number: '', agency: '', description: '', value: '' });
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Processos em Análise</h2>
                    <p className="text-slate-500 dark:text-slate-400">Gestão e auditoria de contratos públicos.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                    <Plus size={18} /> Iniciar Auditoria
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {processes.map((proc) => (
                    <div key={proc.id} className="glass-card p-6 flex flex-col gap-4 group">
                        <div className="flex justify-between items-start">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                ${proc.riskLevel === 'Alto' ? 'bg-red-500/10 text-red-600' :
                                    proc.riskLevel === 'Médio' ? 'bg-amber-500/10 text-amber-600' :
                                        'bg-emerald-500/10 text-emerald-600'}`}>
                                Risco {proc.riskLevel}
                            </span>
                            <button onClick={() => deleteProcess(proc.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                &times;
                            </button>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <FileText size={16} className="text-slate-400" />
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-indigo-500 transition-colors">{proc.number}</h3>
                            </div>
                            <p className="text-slate-500 text-sm">{proc.agency}</p>
                            <p className="text-slate-400 text-xs mt-2 line-clamp-2">{proc.description}</p>
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-200/50 dark:border-white/5 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Valor Estimado</span>
                                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{formatCurrency(proc.value)}</span>
                            </div>

                            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-2 flex items-center gap-3">
                                <ShieldAlert size={16} className={proc.riskLevel === 'Alto' ? 'text-red-500' : 'text-slate-400'} />
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-500">Confiança da IA</span>
                                        <span className="text-slate-700 dark:text-slate-200">{proc.confidence}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${proc.confidence > 80 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                            style={{ width: `${proc.confidence}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal title="Nova Auditoria" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Número do Processo</label>
                        <input
                            type="text"
                            autoFocus
                            value={formData.number}
                            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="Ex: Proc. 1234/2026"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Órgão Público</label>
                        <input
                            type="text"
                            value={formData.agency}
                            onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="Ex: Secretaria de Saúde"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="Resumo do objeto..."
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor Estimado (R$)</label>
                        <input
                            type="number"
                            value={formData.value}
                            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="0.00"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        >
                            Iniciar Análise
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Processes;
