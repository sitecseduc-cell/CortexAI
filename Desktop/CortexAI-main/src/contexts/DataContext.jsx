
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    // Specialized Data for Public Processes
    const [processes, setProcesses] = useState([
        {
            id: 1,
            number: "Proc. 1234/2026",
            agency: "Secretaria de Saúde",
            description: "Aquisição de Tomógrafos - Licitação 05/26",
            status: "Em Análise",
            riskLevel: "Médio",
            confidence: 65,
            value: 4500000
        },
        {
            id: 2,
            number: "Proc. 8921/2025",
            agency: "Educação Municipal",
            description: "Reforma Escolar - Contrato Emergencial",
            status: "Concluído",
            riskLevel: "Baixo",
            confidence: 98,
            value: 120000
        },
        {
            id: 3,
            number: "Proc. 0033/2026",
            agency: "Infraestrutura",
            description: "Pavimentação Lote 3",
            status: "Alerta de Risco",
            riskLevel: "Alto",
            confidence: 89,
            value: 15000000
        },
    ]);

    const [stats, setStats] = useState({
        analyzedProcesses: 142,
        riskAlerts: 12,
        potentialSavings: 3500000
    });

    const addProcess = (process) => {
        const newProcess = {
            id: Date.now(),
            status: "Em Análise",
            riskLevel: "Baixo", // Default, agent would calculate this
            confidence: 0,
            value: 0,
            ...process
        };
        setProcesses(prev => [newProcess, ...prev]);
        setStats(prev => ({ ...prev, analyzedProcesses: prev.analyzedProcesses + 1 }));
        toast.info("Agente IA iniciou a análise do processo.");
    };

    const deleteProcess = (id) => {
        setProcesses(prev => prev.filter(p => p.id !== id));
        toast.success("Processo arquivado.");
    };

    return (
        <DataContext.Provider value={{ processes, stats, addProcess, deleteProcess }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) throw new Error('useData must be used within a DataProvider');
    return context;
};
