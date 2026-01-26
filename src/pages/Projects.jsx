
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Plus, Search } from 'lucide-react';
import Modal from '../components/ui/Modal';
import { formatCurrency } from '../utils/formatters';

const Projects = () => {
    const { projects, addProject, deleteProject } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        addProject({ name: newProjectName, status: 'Novo', budget: 5000 });
        setNewProjectName('');
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Projetos</h2>
                    <p className="text-slate-500 dark:text-slate-400">Gerencie todos os seus projetos.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                    <Plus size={18} /> Novo Projeto
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <div key={project.id} className="glass-card p-6 flex flex-col gap-4 group">
                        <div className="flex justify-between items-start">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                ${project.status === 'Concluído' ? 'bg-emerald-500/10 text-emerald-600' :
                                    project.status === 'Novo' ? 'bg-blue-500/10 text-blue-600' :
                                        'bg-indigo-500/10 text-indigo-600'}`}>
                                {project.status}
                            </span>
                            <button onClick={() => deleteProject(project.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                &times;
                            </button>
                        </div>

                        <div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-indigo-500 transition-colors">{project.name}</h3>
                            <p className="text-slate-500 text-sm mt-1">Orçamento: {formatCurrency(project.budget)}</p>
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-200/50 dark:border-white/5">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-500">Progresso</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300">{project.progress}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${project.progress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal title="Criar Novo Projeto" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Projeto</label>
                        <input
                            type="text"
                            autoFocus
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="Ex: App de Delivery"
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
                            Criar
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Projects;
