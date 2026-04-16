import React, { useEffect, useState } from 'react';
import {
    FolderKanban,
    Plus,
    Search,
    ChevronRight,
    Activity,
    Layout,
    Users,
    FileText,
    Pencil,
    Trash2,
    Menu,
    X
} from 'lucide-react';
import NotificationGroup from '../components/NotificationGroup';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { projectService } from '../services/api';
import { authService } from '../services/authService';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import type { Project } from '../types';

interface DashboardStats {
    total_proyectos: number;
    miembros_totales: number;
    historias_totales: number;
}

const ProjectCard: React.FC<{ 
    id: number; 
    title: string; 
    description: string; 
    count: number; 
    tag: string;
    isOwner: boolean;
    onDelete: (id: number) => void 
}> = ({ id, title, description, count, tag, isOwner, onDelete }) => (
    <div className="group bg-white border border-[#E9ECEF] rounded-[32px] p-8 transition-all hover:border-[#10B981]/40 hover:shadow-2xl hover:shadow-[#10B981]/10 relative flex flex-col h-full overflow-hidden">
        {/* Etiqueta de visibilidad restaurada */}
        <div className={`absolute top-6 right-6 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
            tag === 'PÚBLICO' 
                ? 'bg-blue-50 text-blue-500 border-blue-100' 
                : 'bg-slate-50 text-slate-400 border-slate-100'
        }`}>
            {tag}
        </div>

        <Link to={`/project/${id}`} className="flex-1 flex flex-col">
            <div className="mb-6">
                <div className="w-16 h-16 bg-[#F8F9FA] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#10B981]/5 transition-all duration-500 shadow-sm border border-[#E9ECEF]/50">
                    <FolderKanban className="w-8 h-8 text-[#10B981]" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-[#1A1A1A] group-hover:text-[#10B981] transition-colors tracking-tight leading-tight mb-3">
                        {title}
                    </h3>
                    <p className="text-sm text-[#64748B] font-medium leading-relaxed line-clamp-3">
                        {description}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-8">
                <div className="flex -space-x-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-[#F1F5F9] flex items-center justify-center text-[#10B981] text-[10px] font-bold">
                            <Users className="w-3.5 h-3.5" />
                        </div>
                    ))}
                </div>
                <span className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-widest pl-2">
                    {count} Colaboradores
                </span>
            </div>
        </Link>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-[#F8F9FA] mt-auto">
            <div className="flex items-center gap-3">
                {isOwner && (
                    <>
                        <Link 
                            to={`/project/${id}/settings`} 
                            className="p-3 bg-[#F8F9FA] text-[#64748B] hover:text-[#10B981] hover:bg-[#F0FDF4] rounded-2xl border border-[#E9ECEF] transition-all hover:scale-110 active:scale-95" 
                            title="Editar Proyecto"
                        >
                            <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                            onClick={() => onDelete(id)}
                            className="p-3 bg-[#F8F9FA] text-[#64748B] hover:text-red-500 hover:bg-red-50 rounded-2xl border border-[#E9ECEF] transition-all hover:scale-110 active:scale-95"
                            title="Eliminar Proyecto"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>

            <Link 
                to={`/project/${id}`}
                className="flex items-center gap-3 px-6 py-3 bg-[#0F172A] text-white rounded-2xl hover:bg-[#10B981] transition-all group/btn shadow-lg shadow-black/5"
            >
                <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Entrar</span>
                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform text-[#10B981] group-hover/btn:text-white" />
            </Link>
        </div>
    </div>
);

const DashboardPage: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState<DashboardStats>({ total_proyectos: 0, miembros_totales: 0, historias_totales: 0 });
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const user = authService.getUser();

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true);
            const [projRes, statsRes] = await Promise.all([
                projectService.getAll(),
                projectService.getStats<DashboardStats>(),
            ]);
            setProjects(projRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleDeleteProject = async () => {
        if (!deletingId) return;
        try {
            setIsDeleting(true);
            await projectService.delete(deletingId.toString());
            setDeletingId(null);
            fetchData();
        } catch (err) {
            console.error('Error deleting project:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredProjects = projects.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
                <div className="md:hidden flex items-center justify-between mb-8">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-3 bg-white border border-[#E9ECEF] rounded-2xl text-[#64748B] shadow-sm active:scale-95 transition-all"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <img src="/logo.png" alt="DevGestión" className="h-8 w-auto" />
                </div>

                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <nav className="flex items-center gap-2 text-xs font-bold text-[#10B981] mb-2 uppercase tracking-widest italic">
                            <Activity className="w-3 h-3" /> Resumen del sistema
                        </nav>
                        <h1 className="text-4xl font-extrabold text-[#1A1A1A]">Dashboard de Proyectos</h1>
                        <p className="text-[#64748B] mt-2">Bienvenido de nuevo, <span className="text-[#1A1A1A] font-bold">{user?.first_name || user?.username || 'Usuario'}</span>. Tienes <span className="text-[#10B981] font-bold">{projects.length} proyectos activos</span> hoy.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group hidden sm:block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ADB5BD] group-focus-within:text-[#10B981] transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar proyecto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white border border-[#DEE2E6] rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/10 focus:border-[#10B981] w-64 transition-all"
                            />
                        </div>

                        <NotificationGroup />

                        <Link
                            to="/project/new"
                            className="bg-[#10B981] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-[#10B981]/20 hover:bg-[#059669] transition-all"
                        >
                            <Plus className="w-5 h-5" /> Nuevo Proyecto
                        </Link>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <StatCard icon={<Layout className="text-[#10B981]" />} label="Proyectos Totales" value={stats.total_proyectos.toString()} color="emerald" />
                    <StatCard icon={<Users className="text-[#10B981]" />} label="Miembros Activos" value={stats.miembros_totales.toString()} color="emerald" />
                    <StatCard icon={<FileText className="text-[#10B981]" />} label="Historias de Usuario" value={stats.historias_totales.toString()} color="emerald" />
                </div>

                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-extrabold flex items-center gap-2">
                        {searchTerm ? `Resultados para "${searchTerm}"` : 'Proyectos recientes'} <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loading ? (
                        <div className="col-span-full py-12 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                            Cargando proyectos...
                        </div>
                    ) : (
                        <>
                            {projects.length === 0 ? (
                                <div className="col-span-full bg-white border-2 border-dashed border-[#E9ECEF] rounded-[32px] p-12 py-20 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
                                    <div className="w-24 h-24 bg-[#F0FDF4] rounded-full flex items-center justify-center mb-8 shadow-inner">
                                        <FolderKanban className="w-12 h-12 text-[#10B981]" />
                                    </div>
                                    <h3 className="text-3xl font-black text-[#1A1A1A] mb-4 uppercase italic tracking-tight">Aún no tienes proyectos</h3>
                                    <p className="text-[#64748B] max-w-md mb-10 font-medium leading-relaxed">
                                        Aún no haces parte de ningún proyecto. Crea uno o acepta una invitación para comenzar.
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <Link
                                            to="/project/new"
                                            className="bg-[#10B981] text-white px-8 py-4 lg:px-10 lg:py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-[#10B981]/40 hover:bg-[#059669] hover:-translate-y-1 transition-all flex items-center gap-3 active:scale-95 text-[10px] lg:text-xs"
                                        >
                                            <Plus className="w-5 h-5 lg:w-6 lg:h-6" /> Crear proyecto
                                        </Link>
                                        <Link
                                            to="/invitations"
                                            className="bg-white text-[#1A1A1A] border border-[#DEE2E6] px-8 py-4 lg:px-10 lg:py-5 rounded-2xl font-black uppercase tracking-widest hover:border-[#10B981] hover:text-[#10B981] hover:-translate-y-1 transition-all flex items-center gap-3 active:scale-95 text-[10px] lg:text-xs"
                                        >
                                            <Menu className="w-5 h-5 lg:w-6 lg:h-6" /> Ver invitaciones
                                        </Link>
                                    </div>
                                </div>
                            ) : filteredProjects.length === 0 ? (
                                <div className="col-span-full py-20 text-center">
                                    <div className="bg-white border border-[#E9ECEF] rounded-3xl p-12 inline-flex flex-col items-center">
                                        <div className="w-16 h-16 bg-[#F8F9FA] rounded-full flex items-center justify-center mb-4">
                                            <Search className="w-8 h-8 text-[#ADB5BD]" />
                                        </div>
                                        <p className="text-[#1A1A1A] font-black uppercase italic italic text-xl">No se encontraron proyectos</p>
                                        <p className="text-[#64748B] mt-2">No hay resultados para "{searchTerm}"</p>
                                        <button 
                                            onClick={() => setSearchTerm('')}
                                            className="mt-6 text-[#10B981] font-bold uppercase tracking-widest text-xs hover:underline"
                                        >
                                            Limpiar búsqueda
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {filteredProjects.map((p) => (
                                        <ProjectCard
                                            key={p.id}
                                            id={p.id}
                                            title={p.nombre}
                                            description={p.descripcion}
                                            count={p.miembros_count || 0}
                                            tag={(p.visibilidad || 'privado').toUpperCase()}
                                            isOwner={p.creador?.id == user?.id || !!user?.is_staff}
                                            onDelete={(id) => setDeletingId(id)}
                                        />
                                    ))}

                                    <Link
                                        to="/project/new"
                                        className="border-2 border-dashed border-[#DEE2E6] bg-white hover:border-[#10B981]/30 hover:bg-[#F0FDF4]/30 rounded-2xl flex flex-col items-center justify-center p-8 transition-all group min-h-[200px]"
                                    >
                                        <div className="w-12 h-12 bg-[#F8F9FA] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-white transition-all shadow-sm">
                                            <Plus className="w-6 h-6 text-[#ADB5BD] group-hover:text-[#10B981]" />
                                        </div>
                                        <span className="text-sm font-extrabold text-[#ADB5BD] uppercase tracking-widest group-hover:text-[#10B981]">Crear Nuevo Proyecto</span>
                                    </Link>
                                </>
                            )}
                        </>
                    )}
                </div>


            </main>

            <ConfirmDeleteModal 
                isOpen={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={handleDeleteProject}
                loading={isDeleting}
            />
        </div>
    );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string }> = ({ icon, label, value }) => (
    <div className="bg-white p-6 rounded-2xl border border-[#E9ECEF] flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-7 h-7' }) : icon}
        </div>
        <div>
            <p className="text-[11px] font-bold text-[#ADB5BD] uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="text-2xl font-extrabold text-[#1A1A1A]">{value}</p>
        </div>
    </div>
);

export default DashboardPage;
