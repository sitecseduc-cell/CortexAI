
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './Layout';
import ImmersiveLoader from './components/ImmersiveLoader';
import { DataProvider } from './contexts/DataContext';

/* Pages */
import Dashboard from './pages/Dashboard';
import Processes from './pages/Processes';

/* Placeholder Pages */
const PlaceholderPage = ({ title }) => (
    <div className="glass-card p-12 text-center animate-fadeIn">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{title}</h2>
        <p className="text-slate-500">Esta funcionalidade estará disponível em breve.</p>
    </div>
);

function App() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate initial loading
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return <ImmersiveLoader />;
    }

    return (
        <BrowserRouter>
            <DataProvider>
                <Toaster richColors position="top-right" theme="system" />
                <Layout>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/processes" element={<Processes />} />
                        <Route path="/jurisprudence" element={<PlaceholderPage title="Base de Jurisprudência" />} />
                        <Route path="/settings" element={<PlaceholderPage title="Configurações do Agente" />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </Layout>
            </DataProvider>
        </BrowserRouter>
    );
}

export default App;
