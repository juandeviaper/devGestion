import React from 'react';
import {
    Book,
    Search,
    Plus,
    ChevronRight,
    FileText,
    Clock,
    Settings,
    Edit3,
    Share2,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';
import Sidebar from '../components/Sidebar';

const WikiPage: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pages = [
        { title: 'Guía de Estilo Frontend', lastEdit: 'hace 2 horas', author: '@alejandro_dev' },
        { title: 'Protocolo de Despliegue', lastEdit: 'hace 1 día', author: '@sofia_arch' },
        { title: 'Configuración del Entorno', lastEdit: 'hace 3 días', author: '@hugo_dev' },
        { title: 'Arquitectura del Sistema', lastEdit: 'hace 1 semana', author: '@alejandro_dev' },
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
                <header className="flex justify-between items-end mb-10">
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[#10B981] mb-2 uppercase tracking-widest">
                            <Book className="w-3 h-3" /> Base de Conocimiento
                        </div>
                        <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">Documentación Wiki</h1>
                    </div>
                    <div className="flex gap-3">
                        <button className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-sm text-[#495057] hover:bg-[#F8F9FA] transition-all flex items-center gap-2">
                            <Share2 className="w-4 h-4" /> Compartir
                        </button>
                        <button className="bg-[#10B981] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#059669] transition-all flex items-center gap-2 shadow-lg shadow-[#10B981]/20">
                            <Plus className="w-4 h-4" /> Nueva Página
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <aside className="lg:col-span-1 space-y-6">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Filtrar páginas..."
                                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] outline-none transition-all"
                            />
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-2 overflow-hidden shadow-sm">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-4 py-2 opacity-50">Explorador</div>
                            {pages.map((p, idx) => (
                                <button key={idx} className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between group transition-all ${idx === 0 ? 'bg-slate-50 text-[#10B981]' : 'text-slate-600 hover:bg-slate-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <FileText className={`w-4 h-4 ${idx === 0 ? 'text-[#10B981]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                        <span className="text-xs font-bold truncate max-w-[120px]">{p.title}</span>
                                    </div>
                                    <ChevronRight className={`w-3 h-3 ${idx === 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`} />
                                </button>
                            ))}
                        </div>
                    </aside>

                    <section className="lg:col-span-3 space-y-8">
                        <div className="bg-white rounded-[2rem] border border-slate-200 p-10 min-h-[600px] shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#10B981] to-[#6EE7B7]"></div>

                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-4xl font-black text-slate-900 mb-4">{pages[0].title}</h2>
                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                                        <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {pages[0].lastEdit}</div>
                                        <div className="flex items-center gap-1.5"><Edit3 className="w-3.5 h-3.5" /> Editado por {pages[0].author}</div>
                                    </div>
                                </div>
                                <button className="text-slate-400 hover:text-[#10B981] p-2 hover:bg-[#F0FDF4] rounded-xl transition-all"><Settings className="w-5 h-5" /></button>
                            </div>

                            <div className="prose prose-slate max-w-none prose-headings:font-black prose-p:text-slate-600 prose-p:leading-relaxed text-slate-600 space-y-6">
                                <p className="text-lg font-medium text-slate-500 italic border-l-4 border-[#10B981] pl-6 py-2">
                                    Este documento establece los estándares visuales y de arquitectura que el equipo de DevGestión utiliza para mantener la consistencia en el proyecto.
                                </p>

                                <h3 className="text-2xl font-black text-slate-800 mt-10">1. Sistema de Colores (Mint Green)</h3>
                                <p>Utilizamos el color principal <code className="bg-[#E6F9F1] text-[#10B981] px-2 py-0.5 rounded font-bold">#10B981</code> para todas las acciones primarias y estados de éxito. Los fondos deben mantenerse en <code className="bg-slate-50 px-2 py-0.5 rounded font-bold">#F8F9FA</code> para evitar fatiga visual.</p>

                                <h3 className="text-2xl font-black text-slate-800 mt-10">2. Tipografía</h3>
                                <p>La fuente principal es <strong>Inter</strong> o <strong>Outfit</strong>, enfocándose en un tracking estrecho para los títulos para dar una sensación de robustez y modernidad al estilo "Azure DevOps".</p>

                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mt-12">
                                    <h4 className="flex items-center gap-2 font-black text-sm text-slate-800 mb-2 uppercase tracking-widest"><Settings className="w-4 h-4 text-[#10B981]" /> Guía de Componentes</h4>
                                    <p className="text-xs text-slate-500 font-medium">Todos los botones deben tener bordes redondeados <code className="bg-white px-1 font-bold">rounded-xl</code> y sombras suaves con el color de acento.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default WikiPage;
