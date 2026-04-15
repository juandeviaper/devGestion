import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
    Users,
    ShieldCheck,
    BarChart3,
    Layout,
    MessageSquare
} from 'lucide-react';

import { authService } from '../services/authService';

const LandingPage: React.FC = () => {
    const isAuth = authService.isAuthenticated();

    if (isAuth) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-[#0F172A] text-white z-50 py-4 px-6 md:px-12 flex justify-between items-center">
                <Link
                    to={isAuth ? "/dashboard" : "/"}
                    className="flex items-center gap-2 group"
                >
                    <img src="/logo.png" alt="DevGestión Logo" className="h-8 w-auto group-hover:scale-105 transition-transform" />
                </Link>
                <div className="flex items-center gap-6">
                    {isAuth ? (
                        <Link to="/dashboard" className="bg-[#10B981] text-white px-5 py-2 rounded font-bold text-sm hover:bg-[#059669] transition-all">Ir al Dashboard</Link>
                    ) : (
                        <>
                            <Link to="/login" className="text-sm font-medium hover:text-[#10B981] transition-colors">Iniciar sesión</Link>
                            <Link to="/register" className="bg-[#10B981] text-white px-5 py-2 rounded font-bold text-sm hover:bg-[#059669] transition-all">Registrarse</Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto text-center">

                <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
                    Gestiona tus proyectos de software con <span className="text-[#10B981]">simplicidad y eficiencia.</span>
                </h1>

                <p className="text-lg text-[#64748B] max-w-2xl mx-auto mb-10 leading-relaxed">
                    La herramienta esencial para que equipos de desarrollo organicen proyectos, historias de usuario y flujos de trabajo con agilidad.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
                    <Link to={isAuth ? "/dashboard" : "/register"} className="bg-[#10B981] text-white px-8 py-4 rounded font-bold text-lg hover:bg-[#059669] shadow-lg shadow-[#10B981]/20 transition-all flex items-center justify-center gap-2">
                        {isAuth ? 'Volver al trabajo' : 'Empezar gratis'}
                    </Link>
                </div>


                {/* Browser Mockup */}
                <div className="relative max-w-5xl mx-auto rounded-xl overflow-hidden shadow-2xl border border-slate-200">
                    <div className="bg-[#0F172A] p-2 flex items-center gap-2 border-b border-slate-700">
                        <div className="flex gap-1.5 ml-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]"></div>
                        </div>
                        <div className="bg-[#1E293B] flex-1 text-slate-400 text-[10px] py-1 px-4 rounded mx-4 text-left font-mono">
                            devgestion.app/workspace/ecommerce/kanban
                        </div>
                    </div>
                    <div className="bg-[#0F172A] p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['To Do', 'In Progress', 'Done'].map((col, idx) => (
                            <div key={col} className="space-y-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{col}</span>
                                <div className={`h-24 rounded border ${idx === 1 ? 'border-[#10B981] bg-[#10B981]/5' : 'border-slate-700 bg-slate-800/50'} p-3 text-left`}>
                                    <div className="w-12 h-2 rounded bg-slate-700 mb-2"></div>
                                    <div className="w-20 h-2 rounded bg-slate-700"></div>
                                </div>
                                <div className="h-24 rounded border border-slate-700 bg-slate-800/50 p-3 text-left opacity-50">
                                    <div className="w-16 h-2 rounded bg-slate-700 mb-2"></div>
                                    <div className="w-10 h-2 rounded bg-slate-700"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="bg-[#F8F9FA] py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-extrabold mb-4">Todo lo necesario para equipos de desarrollo</h2>
                        <p className="text-[#64748B] max-w-xl mx-auto">Una interfaz simplificada diseñada para facilitar la organización, el seguimiento y la colaboración en tus proyectos de software.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Layout className="text-[#10B981]" />}
                            title="Gestión de Proyectos"
                            desc="Una interfaz simplificada diseñada para facilitar la organización, el seguimiento y la colaboración en tus proyectos de software."
                        />
                        <FeatureCard
                            icon={<MessageSquare className="text-[#10B981]" />}
                            title="Historias de Usuario"
                            desc="Divide tus requerimientos en historias de usuario épicas y tareas manejables para tu equipo."
                        />
                        <FeatureCard
                            icon={<Users className="text-[#10B981]" />}
                            title="Colaboración"
                            desc="Mantén a todo el equipo alineado con notificaciones en tiempo real y comentarios integrados."
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="text-[#10B981]" />}
                            title="Privacidad Flexible"
                            desc="Decide quién puede ver tu trabajo con opciones de proyectos públicos o privados bajo tu control."
                        />
                        <FeatureCard
                            icon={<BarChart3 className="text-[#10B981]" />}
                            title="Seguimiento"
                            desc="Mide el progreso de tus sprints con gráficas de velocidad y reportes de desempeño automáticos."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto bg-[#0F172A] rounded-3xl p-12 text-center text-white relative overflow-hidden shadow-2xl">
                    <div className="relative z-10">
                        <h2 className="text-5xl font-extrabold mb-6">¿Listo para optimizar la gestión de tus proyectos?</h2>
                        <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">Únete a cientos de empresas que ya utilizan DevGestión para construir el software de la mayor calidad.</p>

                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to={isAuth ? "/dashboard" : "/register"} className="bg-[#10B981] text-white px-8 py-4 rounded font-bold text-lg hover:bg-[#059669] transition-all">
                                {isAuth ? 'Ver mis proyectos' : 'Crear cuenta gratuita'}
                            </Link>
                        </div>
                    </div>
                    {/* Background elements */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-10">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-[#10B981] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#10B981] rounded-full blur-3xl translate-x-1/4 translate-y-1/4"></div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#0F172A] text-white py-12 px-6 border-t border-slate-800">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="DevGestión Logo" className="h-10 w-auto" />
                    </div>
                    <p className="text-slate-500 text-xs">© 2026 DevGestión — Desarrollado por <span className="text-slate-300 font-semibold">Juan Pablo Devia Perdomo</span>.</p>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-[#10B981]/50 hover:shadow-xl hover:shadow-[#10B981]/5 transition-all group">
        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6' }) : icon}
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-sm text-[#64748B] leading-relaxed">{desc}</p>
    </div>
);

export default LandingPage;
