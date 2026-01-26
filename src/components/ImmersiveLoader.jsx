
import React, { useState, useEffect } from 'react';

const messages = [
    "Conectando ao Diário Oficial...",
    "Varrendo Portal da Transparência...",
    "Cruzando CPF/CNPJ...",
    "Calculando Probabilidade de Risco...",
    "Gerando Relatório de Auditoria..."
];

const ImmersiveLoader = () => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f3f4f6] dark:bg-[#030712] transition-colors duration-500">

            {/* Background Glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[100px] animate-pulse delay-700"></div>
            </div>

            {/* Hexagon Spinner */}
            <div className="relative w-24 h-24 mb-8">
                <svg viewBox="0 0 100 100" className="w-full h-full animate-spin [animation-duration:3s]">
                    <path
                        d="M50 5 L95 27.5 L95 72.5 L50 95 L5 72.5 L5 27.5 Z"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    />
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" /> {/* indigo-500 */}
                            <stop offset="100%" stopColor="#8b5cf6" /> {/* violet-500 */}
                        </linearGradient>
                    </defs>
                </svg>

                {/* Inner Pulse */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-full animate-ping"></div>
                </div>
            </div>

            {/* Text */}
            <div className="relative h-8 overflow-hidden w-64 text-center">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 flex items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-300 transition-all duration-500 transform ${index === currentMessageIndex
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 translate-y-4'
                            }`}
                    >
                        {msg}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ImmersiveLoader;
