
import React from 'react';
import { useTheme } from './contexts/ThemeContext';
import { Sun, Moon, Home, Settings, Scale, Box } from 'lucide-react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import brasao from './assets/brasao.png';

const SidebarItem = ({ icon: Icon, label, to }) => (
    <NavLink
        to={to}
        className={({ isActive }) => `p-3 rounded-xl cursor-pointer transition-all duration-300 group flex items-center gap-3 ${isActive
            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
    >
        <Icon size={20} className="group-hover:text-indigo-500 transition-colors" />
        <span className="hidden md:block">{label}</span>
    </NavLink>
);

const Layout = ({ children }) => {
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();

    const getPageTitle = (path) => {
        switch (path) {
            case '/': return 'Dashboard';
            case '/projects': return 'Projetos';
            case '/team': return 'Equipe';
            case '/settings': return 'Configurações';
            default: return 'Overview';
        }
    };

    return (
        <div className="min-h-screen relative flex">
            {/* Background Glows (Shell Requirement) */}
            <div className="fixed top-0 left-0 right-0 h-[500px] overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] animate-float"></div>
                <div className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px] animate-float [animation-delay:2s]"></div>
            </div>

            {/* Sidebar (Glass Requirement) */}
            <aside className="fixed left-0 top-0 bottom-0 w-20 md:w-64 border-r border-slate-200/50 dark:border-slate-800/50 z-40
                         bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl transition-all duration-300">
                <div className="p-6 flex items-center gap-3">
                    <img src={brasao} alt="Brasão" className="w-8 h-auto object-contain drop-shadow-md" />
                    <span className="font-bold text-xl text-slate-800 dark:text-white hidden md:block">Cortex AI</span>
                </div>

                <nav className="p-4 space-y-2">
                    <SidebarItem icon={Home} label="Dashboard" to="/" />
                    <SidebarItem icon={Box} label="Processos" to="/processes" />
                    <SidebarItem icon={Scale} label="Jurisprudência" to="/jurisprudence" />
                    <SidebarItem icon={Settings} label="Configurações" to="/settings" />
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 ml-20 md:ml-64 relative z-10 flex flex-col min-h-screen">

                {/* Header (Floating Requirement) */}
                <header className="mx-4 mt-[2vh] rounded-3xl h-16 px-6 
                           glass flex items-center justify-between sticky top-4 z-30">
                    <h1 className="font-semibold text-lg text-slate-800 dark:text-slate-100 capitalize">
                        {getPageTitle(location.pathname)}
                    </h1>

                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <img src="https://ui-avatars.com/api/?name=User+Admin&background=random" alt="User" />
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>
                </header>

                <div className="p-6 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
