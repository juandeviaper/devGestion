import React from 'react';
import {
    Search,
    History,
    Plus,
    ArrowRight,
    Database,
    BarChart2,
    ListFilter,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';
import Sidebar from '../components/Sidebar';

const QueriesPage: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const suggestions = [
        { label: 'Mis elementos de trabajo', desc: 'Muestra todo lo asignado a ti actualmente.', icon: ListFilter, color: 'text-[#10B981]' },
        { label: 'Errores críticos abiertos', desc: 'Bugs con prioridad alta sin resolver.', icon: Database, color: 'text-red-500' },
        { label: 'Completados recientemente', desc: 'Lo que se cerró en las últimas 24 horas.', icon: History, color: 'text-blue-500' },
    ];

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex text-[#1A1A1A] font-sans selection:bg-[#10B981]/20 overflow-x-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[100] md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar with Responsive Classes */}
            <div className={`fixed inset-y-0 left-0 z-[101] transition-transform duration-300 transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <Sidebar />
                {isSidebarOpen && (
                    <button 
                        onClick={() => setIsSidebarOpen(false)}
                        className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg md:hidden"
                    >
                        <X className="w-5 h-5 text-[#64748B]" />
                    </button>
                )}
            </div>
            
            <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto max-h-screen">
                {/* Mobile Header Toggle */}
                <div className="md:hidden flex items-center justify-between mb-8 px-2">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-3 bg-white border border-[#E9ECEF] rounded-2xl text-[#64748B] shadow-sm active:scale-95 transition-all"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <img src="/logo.png" alt="DevGestión" className="h-8 w-auto" />
                </div>
                <header className="mb-12">
                    <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">Consultas</h1>
                    <p className="text-[#64748B] text-sm font-medium mt-1">Filtra y organiza la información de tu proyecto con precisión matemática.</p>
                </header>

                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-[#10B981] transition-transform duration-300 transform group-focus-within:scale-110" />
                        <input
                            type="text"
                            placeholder="Escribe tu consulta o usa lenguaje natural..."
                            className="w-full bg-white border-2 border-slate-100 rounded-3xl py-6 pl-16 pr-8 text-lg focus:ring-8 focus:ring-[#10B981]/5 focus:border-[#10B981] outline-none transition-all shadow-xl shadow-slate-200/50 placeholder:text-slate-300 font-medium"
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-2">
                            <button className="bg-[#10B981] text-white p-2 rounded-xl shadow-lg shadow-[#10B981]/20 hover:scale-110 transition-transform"><Plus className="w-5 h-5" /></button>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Sugerencias de filtros</h2>
                            <button className="text-xs font-bold text-[#10B981] hover:underline">Ver todas las consultas guardadas</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {suggestions.map((s, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
                                    <div className="w-10 h-10 bg-[#F8F9FA] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#10B981]/10 transition-colors">
                                        <s.icon className={`w-5 h-5 ${s.color}`} />
                                    </div>
                                    <h3 className="text-sm font-black text-slate-800 mb-2">{s.label}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{s.desc}</p>
                                    <ArrowRight className="w-4 h-4 text-white mt-4 opacity-0 group-hover:opacity-100 group-hover:text-[#10B981] transition-all" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#0F172A] p-8 rounded-3xl relative overflow-hidden text-white shadow-2xl">
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold mb-2">¿Necesitas un reporte avanzado?</h3>
                                <p className="text-slate-400 text-sm max-w-sm">Combina múltiples criterios y exporta los resultados para compartirlos con el equipo.</p>
                            </div>
                            <button className="bg-[#10B981] text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-[#059669] transition-all">Crear Reporte <BarChart2 className="w-4 h-4 inline ml-2" /></button>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#10B981] rounded-full blur-[100px] opacity-10 translate-x-1/3 -translate-y-1/3"></div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default QueriesPage;
