
import React, { useState } from 'react';
import { User, Lock, Bell, Moon, Globe, Save, Shield } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';

const Settings = () => {
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(false);

    // Mock User Data
    const [profile, setProfile] = useState({
        name: 'User Admin',
        email: 'admin@cortex.ai',
        role: 'Auditor Sênior'
    });

    // Mock Password Data
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    // Mock Benficiary Settings
    const [settings, setSettings] = useState({
        notifications: true,
        emailAlerts: true,
        autoSave: false,
        language: 'pt-BR'
    });

    const handleSave = (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            toast.success('Configurações salvas com sucesso!');
        }, 1500);
    };

    return (
        <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Configurações</h2>
                <p className="text-slate-500 dark:text-slate-400">Gerencie seu perfil e preferências do sistema.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 flex flex-col gap-2">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${activeTab === 'profile'
                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                            : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                            }`}
                    >
                        <User size={18} /> Perfil
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${activeTab === 'security'
                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                            : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                            }`}
                    >
                        <Shield size={18} /> Segurança
                    </button>
                    <button
                        onClick={() => setActiveTab('system')}
                        className={`text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${activeTab === 'system'
                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                            : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                            }`}
                    >
                        <Bell size={18} /> Preferências
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {activeTab === 'profile' && (
                        <div className="glass-card p-6 md:p-8 animate-fadeIn">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <User className="text-indigo-500" size={24} /> Informações Pessoais
                            </h3>
                            <form onSubmit={handleSave} className="space-y-5">
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shadow-inner relative group cursor-pointer">
                                        <img src="https://ui-avatars.com/api/?name=User+Admin&background=random&size=128" alt="Profile" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white text-xs font-medium">Alterar</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg dark:text-white">{profile.name}</h4>
                                        <p className="text-slate-500 text-sm">{profile.role}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome Completo</label>
                                        <input
                                            type="text"
                                            value={profile.name}
                                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                                        <input
                                            type="email"
                                            value={profile.email}
                                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cargo / Função</label>
                                    <input
                                        type="text"
                                        value={profile.role}
                                        readOnly
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-500 cursor-not-allowed"
                                    />
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-70"
                                    >
                                        {isLoading ? 'Salvando...' : <><Save size={18} /> Salvar Alterações</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="glass-card p-6 md:p-8 animate-fadeIn">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <Lock className="text-indigo-500" size={24} /> Segurança
                            </h3>
                            <form onSubmit={handleSave} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Senha Atual</label>
                                    <input
                                        type="password"
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nova Senha</label>
                                        <input
                                            type="password"
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirmar Nova Senha</label>
                                        <input
                                            type="password"
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-70"
                                    >
                                        {isLoading ? 'Salvando...' : 'Atualizar Senha'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="glass-card p-6 md:p-8 animate-fadeIn">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <Bell className="text-indigo-500" size={24} /> Preferências do Sistema
                            </h3>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                            <Moon size={20} className="text-slate-600 dark:text-slate-300" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-slate-800 dark:text-white">Modo Escuro</h4>
                                            <p className="text-xs text-slate-500">Alternar entre tema claro e escuro</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={toggleTheme}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-indigo-500' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${theme === 'dark' ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>

                                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                            <Bell size={20} className="text-slate-600 dark:text-slate-300" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-slate-800 dark:text-white">Notificações</h4>
                                            <p className="text-xs text-slate-500">Receber alertas sobre processos</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${settings.notifications ? 'bg-indigo-500' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.notifications ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                            <Globe size={20} className="text-slate-600 dark:text-slate-300" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-slate-800 dark:text-white">Idioma</h4>
                                            <p className="text-xs text-slate-500">Idioma da interface do sistema</p>
                                        </div>
                                    </div>
                                    <select
                                        value={settings.language}
                                        onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-1 outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="pt-BR">Português (BR)</option>
                                        <option value="en-US">English (US)</option>
                                        <option value="es-ES">Español</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
