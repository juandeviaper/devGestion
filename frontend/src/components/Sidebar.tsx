import React from 'react';
import {
    LayoutDashboard,
    LogOut,
    ShieldCheck,
    ChevronRight,
    Search,
    Sparkles,
    UserCircle
} from 'lucide-react';



import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import Avatar from './Avatar';



const Sidebar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const globalItems = [
        { icon: LayoutDashboard, label: 'Mis Proyectos', path: '/dashboard' },
        { icon: Search, label: 'Descubrir', path: '/search/users' },
        { icon: UserCircle, label: 'Mi Perfil', path: '/profile' },
    ];

    const isAdmin = authService.getUser()?.is_staff || false;
    const adminItems = [
        { icon: ShieldCheck, label: 'Gestión Usuarios', path: '/admin/users' },
    ];





    return (
        <aside className="w-72 bg-white border-r border-[#E9ECEF] flex flex-col h-screen sticky top-0 shrink-0 font-sans z-40">
            {/* Brand Header */}
            <div className="p-8 pb-6 text-center relative">
                <Link to="/dashboard" className="flex items-center gap-3 group mb-8 justify-center">
                    <img src="/logo.png" alt="DevGestión Logo" className="h-12 w-auto group-hover:scale-105 transition-transform" />
                </Link>
            </div>


            {/* Nav Content */}
            <nav className="flex-1 px-4 space-y-8 overflow-y-auto pt-4 scrollbar-hide py-6">
                <div>
                    <div className="text-[10px] font-extrabold text-[#ADB5BD] uppercase tracking-[0.2em] px-4 mb-4">Módulos Globales</div>
                    <div className="space-y-1">
                        {globalItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.label}
                                    to={item.path}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all group ${isActive
                                        ? 'bg-[#10B981]/10 text-[#10B981]'
                                        : 'text-[#64748B] hover:text-[#1A1A1A] hover:bg-[#F8F9FA]'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className="w-5 h-5" />
                                        {item.label}
                                    </div>
                                    {isActive && <ChevronRight className="w-3 h-3 text-[#10B981]" />}
                                </Link>
                            );
                        })}
                    </div>
                </div>


                {isAdmin && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="text-[10px] font-extrabold text-[#10B981] uppercase tracking-[0.2em] px-4 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                            Administración
                        </div>
                        <div className="space-y-1">
                            {adminItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.label}
                                        to={item.path}
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all group ${isActive
                                            ? 'bg-[#10B981]/10 text-[#10B981]'
                                            : 'text-[#64748B] hover:text-[#1A1A1A] hover:bg-[#F8F9FA]'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className="w-5 h-5" />
                                            {item.label}
                                        </div>
                                        {isActive && <ChevronRight className="w-3 h-3 text-[#10B981]" />}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}



            </nav>

            {/* Footer / User Profile */}
            <div className="p-4 mt-auto">
                <Link to="/profile" className="bg-[#0F172A] p-4 rounded-2xl text-white relative overflow-hidden group mb-4 block hover:ring-2 hover:ring-[#10B981]/50 transition-all">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#10B981]/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                    <div className="flex items-center gap-3 relative z-10">
                        <Avatar 
                            username={authService.getUser()?.username || 'user'} 
                            photo={typeof authService.getUser()?.perfil?.foto_perfil === 'string' ? authService.getUser()?.perfil?.foto_perfil : undefined} 
                            size="sm" 
                            className="ring-2 ring-white/20"
                        />
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-black truncate text-[#10B981]">@{authService.getUser()?.username || 'admin'}</p>
                            <p className="text-[10px] text-slate-400 font-medium italic">Ver Perfil <ChevronRight className="w-2 h-2 inline" /></p>
                        </div>
                    </div>

                </Link>

                <button
                    onClick={() => {
                        authService.clearSession();
                        navigate('/');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[#64748B] hover:text-[#F85149] hover:bg-[#F85149]/5 rounded-xl transition-all group"
                >
                    <div className="w-8 h-8 rounded-lg bg-[#F8F9FA] flex items-center justify-center group-hover:bg-[#F84F31]/10 transition-colors">
                        <LogOut className="w-4 h-4" />
                    </div>
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
