
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
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f3f4f6] dark:bg-[#030712] transition-colors duration-500">

            {/* Background Glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
            </div>

            {/* Modern Circular Spinner */}
            <div className="relative w-20 h-20 mb-8 flex items-center justify-center">

                {/* Outer Ring */}
                <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800 opacity-30"></div>

                {/* Spinning Gradient Ring */}
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-violet-500 animate-spin [animation-duration:1s]"></div>

                {/* Inner Pulse */}
                <div className="absolute w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>

                {/* Optional: Glow effect behind */}
                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
            </div>

            {/* Text */}
            <div className="relative h-8 overflow-hidden w-72 text-center z-10">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 flex items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-300 transition-all duration-500 transform ${index === currentMessageIndex
                            ? 'opacity-100 translate-y-0 scale-100'
                            : 'opacity-0 translate-y-4 scale-95'
                            }`}
                    >
                        {msg}
                    </div>
                ))}
            </div>

            {/* Progress Bar (Visual only) */}
            <div className="w-48 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mt-6 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 w-1/2 animate-[progress_2s_ease-in-out_infinite]"></div>
            </div>
        </div>
    );
};

export default ImmersiveLoader;
