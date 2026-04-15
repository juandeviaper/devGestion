import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ProjectLayout from '../components/ProjectLayout';
import { sprintService, storyService, bugService } from '../services/api';
import { toast } from 'react-hot-toast';
import type { Sprint, UserStory, Bug as BugType } from '../types';
import { 
    Calendar, 
    Target, 
    ChevronLeft,
    Clock,
    Layout,
    Bug,
    ArrowRight,
    Loader2,
    Settings,
    CheckCircle2,
    ChevronRight
} from 'lucide-react';

const SprintDetailPage: React.FC = () => {
    const { projectId, sprintId } = useParams<{ projectId: string, sprintId: string }>();
    const navigate = useNavigate();
    const [sprint, setSprint] = useState<Sprint | null>(null);
    const [stories, setStories] = useState<UserStory[]>([]);
    const [bugs, setBugs] = useState<BugType[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSprintData = React.useCallback(async () => {
        if (projectId && sprintId) {
            try {
                setLoading(true);
                const [sprintRes, storiesRes, bugsRes] = await Promise.all([
                    sprintService.getById(sprintId),
                    storyService.getBySprint(sprintId),
                    bugService.getByProject(projectId)
                ]);
                setSprint(sprintRes.data);
                setStories(storiesRes.data);
                setBugs(bugsRes.data.filter((b: BugType) => b.sprint === parseInt(sprintId)));
            } catch (err: unknown) {
                console.error(err);
                toast.error('Error al cargar detalles del sprint');
            } finally {
                setLoading(false);
            }
        }
    }, [projectId, sprintId]);

    useEffect(() => {
        fetchSprintData();
    }, [fetchSprintData]);

    const getStatusStyles = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'activo': return 'bg-[#F0FDF4] text-[#10B981] border-[#10B981]/20';
            case 'terminado': return 'bg-slate-50 text-slate-400 border-slate-100';
            default: return 'bg-blue-50 text-blue-500 border-blue-100';
        }
    };

    if (loading) {
        return (
            <ProjectLayout>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-12 h-12 text-[#10B981] animate-spin" />
                </div>
            </ProjectLayout>
        );
    }

    if (!sprint) return null;

    const progressValue = stories.length > 0 
        ? Math.round((stories.filter(s => s.estado === 'terminado').length / stories.length) * 100) 
        : 0;

    return (
        <ProjectLayout>
            <div className="max-w-6xl mx-auto space-y-10 lg:space-y-12 animate-in fade-in duration-500 h-full flex flex-col">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 shrink-0">
                    <div className="space-y-2">
                        <button 
                            onClick={() => navigate(`/project/${projectId}/sprints`)}
                            className="flex items-center gap-2 text-[#64748B] hover:text-[#10B981] text-[10px] font-black uppercase tracking-widest transition-all group"
                        >
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Iteraciones
                        </button>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl lg:text-5xl font-black text-[#1A1A1A] tracking-tighter">{sprint.nombre}</h1>
                            <span className={`text-[10px] font-black px-4 py-1.5 rounded-xl border uppercase tracking-widest ${getStatusStyles(sprint.estado)}`}>
                                {sprint.estado}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link 
                            to={`/project/${projectId}/sprints/${sprintId}/edit`}
                            className="p-3.5 bg-white border border-[#E9ECEF] text-[#64748B] rounded-2xl transition-all shadow-sm group"
                            style={{ '--hover-color': sprint.color || '#10B981' } as React.CSSProperties}
                        >
                            <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500 group-hover:text-[var(--hover-color)]" />
                        </Link>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 shrink-0">
                    <div className="lg:col-span-2 bg-white border border-[#E9ECEF] rounded-[40px] p-8 lg:p-10 space-y-8">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] flex items-center gap-2 italic">
                                <Target className="w-4 h-4" style={{ color: sprint.color || '#10B981' }} /> Objetivo del Ciclo
                            </h4>
                            <p className="text-lg font-bold text-[#1A1A1A] leading-relaxed">
                                {sprint.objetivo || "No se ha definido un objetivo para esta iteración."}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-10 pt-4 border-t border-[#F8F9FA]">
                            <div className="space-y-1.5">
                                <span className="text-[9px] font-black text-[#ADB5BD] uppercase tracking-widest block">Periodo de ejecución</span>
                                <div className="flex items-center gap-3 text-sm font-black text-[#1A1A1A]">
                                    <Calendar className="w-4 h-4" style={{ color: sprint.color || '#10B981' }} />
                                    {new Date(sprint.fecha_inicio).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                    <ArrowRight className="w-3.5 h-3.5 text-[#ADB5BD]" />
                                    {new Date(sprint.fecha_fin).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <span className="text-[9px] font-black text-[#ADB5BD] uppercase tracking-widest block">Progreso Global</span>
                                <div className="flex items-center gap-3 text-sm font-black" style={{ color: sprint.color || '#10B981' }}>
                                    <CheckCircle2 className="w-4 h-4" />
                                    {progressValue}% completado
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1A1A1A] rounded-[40px] p-8 lg:p-10 text-white flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8">
                            <Clock className="w-24 h-24 text-white/5 group-hover:rotate-12 transition-transform duration-700" />
                        </div>
                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] italic relative z-10">Tiempo Restante</h4>
                        <div className="relative z-10">
                            {new Date(sprint.fecha_fin) < new Date() ? (
                                <span className="text-4xl font-black text-red-500 tracking-tighter">Expirado</span>
                            ) : (
                                <div className="flex items-baseline gap-2">
                                    <span className="text-6xl font-black tracking-tighter">
                                        {Math.max(0, Math.ceil((new Date(sprint.fecha_fin).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
                                    </span>
                                    <span className="text-xs font-black text-white/40 uppercase tracking-widest">Días</span>
                                </div>
                            )}
                        </div>
                        <p className="text-[9px] text-white/20 font-medium italic relative z-10">Basado en la fecha de finalización configurada</p>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
                    {/* User Stories */}
                    <div className="flex flex-col space-y-6">
                        <div className="flex items-center justify-between shrink-0">
                            <h3 className="text-xl font-black text-[#1A1A1A] tracking-tight flex items-center gap-3">
                                <Layout className="w-5 h-5 text-[#10B981]" /> Historias de Usuario
                            </h3>
                            <span className="px-3 py-1 bg-[#F8F9FA] border border-[#E9ECEF] rounded-lg text-[10px] font-black text-[#64748B]">{stories.length}</span>
                        </div>
                        <div className="flex-1 bg-white border border-[#E9ECEF] rounded-[32px] overflow-hidden flex flex-col shadow-sm">
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                                {stories.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4">
                                        <div className="w-16 h-16 bg-[#F8F9FA] rounded-2xl flex items-center justify-center text-[#ADB5BD]">
                                            <Layout className="w-8 h-8" />
                                        </div>
                                        <p className="text-xs font-bold text-[#ADB5BD] italic">No hay historias asignadas a este sprint.</p>
                                    </div>
                                ) : (
                                    stories.map(story => (
                                        <Link 
                                            key={story.id} 
                                            to={`/project/${projectId}/story/${story.id}`}
                                            className="p-5 border border-[#F8F9FA] rounded-2xl transition-all flex items-center justify-between group"
                                            style={{ '--hover-bg': `${sprint.color}11`, '--hover-border': `${sprint.color}33`, '--hover-color': sprint.color } as React.CSSProperties}
                                        >
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-[#1A1A1A] group-hover:text-[#10B981] transition-colors">{story.titulo}</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[9px] font-black text-[#ADB5BD] uppercase tracking-widest">{story.prioridad}</span>
                                                    <span className="w-1 h-1 rounded-full bg-[#DEE2E6]"></span>
                                                    <span className="text-[9px] font-black text-[#10B981] uppercase tracking-widest">{story.estado}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-[#ADB5BD] group-hover:text-[#10B981] transform group-hover:translate-x-1 transition-all" />
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bugs */}
                    <div className="flex flex-col space-y-6">
                        <div className="flex items-center justify-between shrink-0">
                            <h3 className="text-xl font-black text-[#1A1A1A] tracking-tight flex items-center gap-3">
                                <Bug className="w-5 h-5 text-red-500" /> Bugs Activos
                            </h3>
                            <span className="px-3 py-1 bg-red-50 border border-red-100 rounded-lg text-[10px] font-black text-red-500">{bugs.length}</span>
                        </div>
                        <div className="flex-1 bg-white border border-[#E9ECEF] rounded-[32px] overflow-hidden flex flex-col shadow-sm">
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                                {bugs.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4">
                                        <div className="w-16 h-16 bg-[#F8F9FA] rounded-2xl flex items-center justify-center text-[#ADB5BD]">
                                            <Bug className="w-8 h-8" />
                                        </div>
                                        <p className="text-xs font-bold text-[#ADB5BD] italic">¡Increíble! No hay bugs reportados en este ciclo.</p>
                                    </div>
                                ) : (
                                    bugs.map(bug => (
                                        <div key={bug.id} className="p-5 border border-red-50 bg-red-50/10 rounded-2xl hover:bg-red-50/20 transition-all flex items-center justify-between group">
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-red-600 transition-colors uppercase tracking-tight">{bug.titulo}</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">{bug.prioridad}</span>
                                                    <span className="w-1 h-1 rounded-full bg-red-100"></span>
                                                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest italic">{bug.estado}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-red-200" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProjectLayout>
    );
};

export default SprintDetailPage;
