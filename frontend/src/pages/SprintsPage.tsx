import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProjectLayout from '../components/ProjectLayout';
import { sprintService } from '../services/api';
import {
    Calendar as CalendarIcon,
    Plus,
    ChevronRight,
    Flag,
    CalendarDays,
    ArrowRight,
    Edit3,
    Trash2,
    Loader2,
    CheckCircle2,
    Play,
    StopCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import type { Sprint } from '../types';
import axios from 'axios';

const SprintsPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<number | null>(null);

    const fetchSprints = React.useCallback(async () => {
        if (projectId) {
            try {
                setLoading(true);
                const res = await sprintService.getByProject(projectId);
                setSprints(res.data);
            } catch (error: unknown) {
                console.error(error);
                toast.error('Error al cargar los sprints');
            } finally {
                setLoading(false);
            }
        }
    }, [projectId]);

    useEffect(() => {
        fetchSprints();
    }, [fetchSprints]);

    const handleDelete = async (e: React.MouseEvent, sprintId: number, name: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm(`¿Estás seguro de que deseas eliminar el sprint "${name}"? Esta acción no se puede deshacer.`)) return;

        setDeleting(sprintId);
        try {
            await sprintService.delete(sprintId);
            toast.success('Sprint eliminado con éxito');
            fetchSprints();
        } catch (error: unknown) {
            let errorMsg = 'Error al eliminar el sprint';
            if (axios.isAxiosError(error)) {
                errorMsg = error.response?.data?.error || error.response?.data?.[0] || errorMsg;
            }
            toast.error(errorMsg);
        } finally {
            setDeleting(null);
        }
    };

    const handleIniciar = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await sprintService.iniciar(id);
            toast.success('Sprint iniciado. El backlog para este ciclo ha sido congelado.');
            fetchSprints();
        } catch (error: unknown) {
            let errorMsg = 'No se pudo iniciar el sprint';
            if (axios.isAxiosError(error)) {
                errorMsg = error.response?.data?.error || errorMsg;
            }
            toast.error(errorMsg);
        }
    };

    const handleFinalizar = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm('¿Deseas finalizar este sprint? Esta acción cerrará el ciclo actual.')) return;
        try {
            await sprintService.finalizar(id);
            toast.success('Sprint finalizado con éxito');
            fetchSprints();
        } catch (error: unknown) {
            toast.error('Error al finalizar el sprint');
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status.toLowerCase()) {
            case 'activo': return 'bg-[#F0FDF4] text-[#10B981] border-[#10B981]/20';
            case 'terminado': return 'bg-slate-50 text-slate-400 border-slate-100';
            default: return 'bg-blue-50 text-blue-500 border-blue-100';
        }
    };

    return (
        <ProjectLayout>
            <div className="max-w-6xl mx-auto space-y-10 lg:space-y-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-black text-[#1A1A1A] mb-2 flex items-center gap-3 tracking-tighter">
                            Iteraciones <Flag className="w-6 lg:w-8 h-6 lg:h-8 text-[#10B981]" />
                        </h1>
                        <p className="text-[10px] lg:text-xs text-[#64748B] font-black italic uppercase tracking-[0.2em] opacity-70">Planificación táctica del proyecto</p>
                    </div>
                    <button 
                        onClick={() => navigate(`/project/${projectId}/sprints/new`)}
                        className="w-full md:w-auto px-8 py-3 bg-[#10B981] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#059669] transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#10B981]/20"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Sprint
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:gap-6">
                    {loading ? (
                        <div className="flex items-center justify-center p-20 text-[#ADB5BD] font-black uppercase tracking-[0.3em] animate-pulse italic">
                            Sincronizando cronograma...
                        </div>
                    ) : sprints.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-[#DEE2E6] rounded-[40px] p-24 text-center">
                            <div className="w-20 h-20 bg-[#F8F9FA] rounded-[32px] flex items-center justify-center mx-auto mb-6 text-[#ADB5BD]">
                                <CalendarDays className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black text-[#1A1A1A] mb-2">No hay sprints planificados</h3>
                            <p className="text-sm text-[#64748B] font-medium mb-10 max-w-sm mx-auto leading-relaxed">Divide el trabajo en bloques de tiempo fijos para maximizar la velocidad de entrega.</p>
                            <button 
                                onClick={() => navigate(`/project/${projectId}/sprints/new`)}
                                className="text-[#10B981] text-[10px] font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-8 transition-all"
                            >
                                Definir primer sprint
                            </button>
                        </div>
                    ) : (
                        sprints.map((sprint) => (
                            <Link 
                                to={`/project/${projectId}/sprints/${sprint.id}`}
                                key={sprint.id} 
                                className="bg-white border border-[#E9ECEF] rounded-[32px] p-6 lg:p-8 hover:shadow-xl transition-all group flex flex-col md:flex-row items-center gap-8 border-l-[8px]"
                                style={{ borderLeftColor: sprint.color || '#10B981' } as React.CSSProperties}
                            >
                                <div className="w-full md:w-32 text-center md:border-r border-[#F8F9FA] md:pr-8 shrink-0">
                                    <p className="text-[9px] font-black text-[#ADB5BD] uppercase tracking-[0.2em] mb-2 italic">Estado</p>
                                    <span className={`text-[10px] font-black px-4 py-1.5 rounded-xl border uppercase tracking-widest block w-full text-center ${getStatusStyles(sprint.estado)}`}>
                                        {sprint.estado}
                                    </span>
                                </div>

                                <div className="flex-1 min-w-0 text-center md:text-left">
                                    <h3 
                                        className="text-xl lg:text-2xl font-black text-[#1A1A1A] transition-colors mb-3 tracking-tight group-hover:text-[var(--hover-color)]" 
                                        style={{ '--hover-color': sprint.color || '#10B981' } as React.CSSProperties}
                                    >
                                        {sprint.nombre}
                                    </h3>
                                    <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-[#64748B] font-extrabold italic">
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="w-4 h-4" style={{ color: sprint.color || '#10B981' }} />
                                            {new Date(sprint.fecha_inicio).toLocaleDateString()}
                                        </div>
                                        <ArrowRight className="w-3.5 h-3.5 opacity-30" />
                                        <div className="flex items-center gap-2">
                                            {new Date(sprint.fecha_fin).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full md:w-48 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-widest">Entrega</span>
                                        <span className="text-xs font-black" style={{ color: sprint.color || '#10B981' }}>0%</span>
                                    </div>
                                    <div className="w-full h-2 bg-[#F8F9FA] rounded-full overflow-hidden border border-[#E9ECEF]">
                                        <div className="h-full transition-all rounded-full" style={{ backgroundColor: sprint.color || '#10B981', width: '0%' }}></div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {sprint.estado === 'planeado' && (
                                        <button 
                                            onClick={(e) => handleIniciar(e, sprint.id!)}
                                            className="px-4 py-3 bg-[#10B981] text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-[#059669] transition-all flex items-center gap-2"
                                            title="Iniciar Sprint (Congelar Backlog)"
                                        >
                                            <Play className="w-3.5 h-3.5 fill-current" /> Iniciar
                                        </button>
                                    )}
                                    {sprint.estado === 'activo' && (
                                        <button 
                                            onClick={(e) => handleFinalizar(e, sprint.id!)}
                                            className="px-4 py-3 bg-red-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center gap-2"
                                            title="Finalizar Sprint"
                                        >
                                            <StopCircle className="w-3.5 h-3.5" /> Finalizar
                                        </button>
                                    )}
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            navigate(`/project/${projectId}/sprints/${sprint.id}/edit`);
                                        }}
                                        className="p-3 bg-[#F8F9FA] text-[#ADB5BD] transition-all border border-transparent"
                                        style={{ '--hover-bg': `${sprint.color}11`, '--hover-color': sprint.color } as React.CSSProperties}
                                    >
                                        <Edit3 className="w-5 h-5 transition-colors group-hover:text-[var(--hover-color)]" />
                                    </button>
                                    <button 
                                        onClick={(e) => handleDelete(e, sprint.id!, sprint.nombre)}
                                        disabled={deleting === sprint.id}
                                        className="p-3 bg-[#F8F9FA] text-[#ADB5BD] hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
                                    >
                                        {deleting === sprint.id ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-5 h-5" />
                                        )}
                                    </button>
                                    <div className="p-3 bg-[#F8F9FA] text-[#ADB5BD] group-hover:text-[#10B981] group-hover:bg-[#F0FDF4] rounded-2xl transition-all border border-transparent group-hover:border-[#10B981]/20">
                                        <ChevronRight className="w-6 h-6" />
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                {/* Las tarjetas de métricas estáticas fueron removidas */}
            </div>
        </ProjectLayout>
    );
};

export default SprintsPage;
