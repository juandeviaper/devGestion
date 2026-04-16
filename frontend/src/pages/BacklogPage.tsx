import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProjectLayout from '../components/ProjectLayout';
import { storyService, projectService } from '../services/api';
import { authService } from '../services/authService';
import {
    Layers,
    Plus,
    FileText,
    Clock,
    Search,
    Trash2,
    Edit3
} from 'lucide-react';
import type { UserStory } from '../types';
import axios from 'axios';
import toast from 'react-hot-toast';

const BacklogPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const [stories, setStories] = useState<UserStory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [project, setProject] = useState<any>(null);
    const [isMember, setIsMember] = useState(false);
    const user = authService.getUser();

    const fetchStories = React.useCallback(async () => {
        if (!projectId) return;
        try {
            setLoading(true);
            const [sRes, pRes, mRes] = await Promise.all([
                storyService.getByProject(projectId),
                projectService.getById(projectId),
                projectService.getMembers(projectId)
            ]);
            setStories(sRes.data);
            setProject(pRes.data);
            
            const member = mRes.data.find((m: any) => m.usuario === user?.id);
            setIsMember(!!member || pRes.data.creador.id === user?.id || user?.is_staff);

        } catch (err: unknown) {
            console.error(err);
            toast.error('Error al cargar historias');
        } finally {
            setLoading(false);
        }
    }, [projectId, user?.id, user?.is_staff]);

    useEffect(() => {
        fetchStories();
    }, [fetchStories]);

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Realmente deseas eliminar esta historia?')) {
            try {
                await storyService.delete(id);
                toast.success('Historia eliminada con éxito');
                fetchStories();
            } catch (err: unknown) {
                let errorMsg = 'Error al eliminar';
                if (axios.isAxiosError(err)) {
                    errorMsg = err.response?.data?.error || err.response?.data?.[0] || errorMsg;
                }
                toast.error(errorMsg);
            }
        }
    };

    const getStatusColors = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pendiente':
            case 'nuevo':
                return 'bg-red-50 text-red-500 border-red-200';
            case 'en progreso':
            case 'activo':
                return 'bg-amber-50 text-amber-500 border-amber-200';
            case 'terminado':
            case 'hecho':
            case 'cerrado':
                return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            default:
                return 'bg-slate-50 text-slate-500 border-slate-200';
        }
    };

    const filteredStories = stories.filter(s =>
        s.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <ProjectLayout>
            <div className="max-w-6xl mx-auto flex flex-col h-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 lg:mb-12">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-black text-[#1A1A1A] mb-2 flex items-center gap-3 tracking-tighter">
                            Backlog <Layers className="w-6 lg:w-8 h-6 lg:h-8 text-[#10B981]" />
                        </h1>
                        <p className="text-[10px] lg:text-xs text-[#64748B] font-black italic tracking-widest uppercase opacity-70">Priorización y refinamiento de requisitos</p>
                    </div>
                    {isMember && (
                        <Link
                            to={`/project/${projectId}/story/new`}
                            className="w-full sm:w-auto px-8 py-3 bg-[#10B981] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#059669] transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#10B981]/20"
                        >
                            <Plus className="w-4 h-4" /> Crear Historia
                        </Link>
                    )}
                </div>

                <div className="bg-white border border-[#E9ECEF] rounded-[32px] overflow-hidden shadow-sm flex flex-col flex-1 min-h-[500px]">
                    <div className="p-4 lg:p-6 bg-[#F8F9FA]/50 border-b border-[#E9ECEF] flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ADB5BD]" />
                            <input
                                type="text"
                                placeholder="Filtrar historias por título..."
                                className="w-full bg-white border border-[#DEE2E6] rounded-xl py-2.5 pl-11 pr-4 text-xs font-bold outline-none focus:ring-4 focus:ring-[#10B981]/5 focus:border-[#10B981] transition-all shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-6 text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] italic">
                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#10B981]" /> Total Items: {stories.length}</span>
                        </div>
                    </div>

                    <div className="divide-y divide-[#F8F9FA] overflow-y-auto flex-1">
                        {loading ? (
                            <div className="p-20 text-center text-[#ADB5BD] font-black uppercase tracking-[0.3em] animate-pulse italic">Refinando backlog...</div>
                        ) : filteredStories.length === 0 ? (
                            <div className="p-16 lg:p-24 text-center">
                                <div className="w-16 h-16 bg-[#F8F9FA] rounded-[24px] flex items-center justify-center mx-auto mb-6 text-[#DEE2E6]">
                                    <Layers className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-black text-[#1A1A1A] mb-2">No se encontraron historias</h3>
                                <p className="text-sm text-[#64748B] font-medium max-w-xs mx-auto italic">Asegúrate de que el filtro sea correcto o crea una nueva historia de usuario.</p>
                            </div>
                        ) : (
                            filteredStories.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-5 lg:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 lg:gap-6 hover:bg-[#F0FDF4]/30 transition-all group border-l-[6px] border-transparent hover:border-[#10B981]"
                                >
                                    <div className="flex items-start sm:items-center gap-4 lg:gap-6 flex-1 min-w-0">
                                        <div className="w-11 h-11 bg-[#F8F9FA] rounded-2xl flex items-center justify-center text-[#ADB5BD] group-hover:bg-[#10B981] group-hover:text-white transition-all shadow-sm shrink-0">
                                            <FileText className="w-5 h-5 lg:w-6 lg:h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <span className="text-[9px] font-black text-[#64748B] bg-white border border-[#DEE2E6] px-2 py-0.5 rounded-lg uppercase tracking-widest shadow-sm">HU-{item.id}</span>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest ${item.prioridad === 'alta' ? 'bg-red-50 text-red-500' :
                                                    item.prioridad === 'media' ? 'bg-blue-50 text-blue-500' : 'bg-slate-50 text-slate-500'
                                                    }`}>{item.prioridad}</span>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-widest ${getStatusColors(item.estado)}`}>{item.estado}</span>
                                            </div>
                                            <h3 className="text-sm lg:text-base font-black text-[#1A1A1A] truncate transition-colors leading-tight">{item.titulo}</h3>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:pl-0 pl-[60px]">
                                        <div className="flex flex-col items-start sm:items-end">
                                            <p className="text-[9px] font-black text-[#ADB5BD] uppercase tracking-widest leading-none mb-1.5 opacity-60 italic">Responsable</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-[#64748B] truncate max-w-[80px] sm:max-w-[120px]">{item.asignado_a_detalle?.username || 'Sin asignar'}</span>
                                                <div className="w-6 h-6 rounded-lg bg-[#1A1A1A] flex items-center justify-center text-[8px] font-black text-white shadow-lg shadow-[#1A1A1A]/10">
                                                    {item.asignado_a_detalle?.username?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                            </div>
                                        </div>

                                        {isMember && (
                                            <div className="flex items-center gap-1.5 lg:gap-2">
                                                <Link to={`/project/${projectId}/story/${item.id}/edit`} className="p-3 text-[#ADB5BD] hover:text-[#10B981] hover:bg-white rounded-xl transition-all border border-transparent hover:border-[#10B981]/20 shadow-none hover:shadow-sm">
                                                    <Edit3 className="w-5 h-5 lg:w-6 lg:h-6" />
                                                </Link>
                                                <button onClick={() => handleDelete(item.id!)} className="p-3 text-[#ADB5BD] hover:text-red-500 hover:bg-white rounded-xl transition-all border border-transparent hover:border-red-500/20 shadow-none hover:shadow-sm">
                                                    <Trash2 className="w-5 h-5 lg:w-6 lg:h-6" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </ProjectLayout>
    );
};

export default BacklogPage;
