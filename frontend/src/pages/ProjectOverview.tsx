import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProjectLayout from '../components/ProjectLayout';
import { projectService, storyService, sprintService } from '../services/api';
import { authService } from '../services/authService';
import type { Project, ProjectMember, UserStory, Sprint } from '../types';
import axios from 'axios';
import { toast } from 'react-hot-toast';

import {
    Users,
    FileText,
    CheckCircle2,
    Clock,
    Target,
    ArrowUpRight,
    MessageSquare,
    Plus,
    Activity
} from 'lucide-react';
import ProjectCollaboratorsModal from '../components/ProjectCollaboratorsModal';
import Avatar from '../components/Avatar';


const ProjectOverview: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [stories, setStories] = useState<UserStory[]>([]);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);

    const user = authService.getUser();


    const fetchProjectData = React.useCallback(async () => {
        if (!projectId) return;
        try {
            const [pRes, mRes, sRes, spRes] = await Promise.all([
                projectService.getById(projectId),
                projectService.getMembers(projectId),
                storyService.getByProject(projectId),
                sprintService.getByProject(projectId)
            ]);
            setProject(pRes.data);
            setMembers(mRes.data);
            setStories(sRes.data);
            setSprints(spRes.data);
        } catch (err: unknown) {
            console.error('Error fetching project overview data:', err);
            let errorMsg = 'Error al cargar la vista general del proyecto';
            if (axios.isAxiosError(err)) {
                errorMsg = err.response?.data?.error || err.response?.data?.detail || errorMsg;
            }
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchProjectData();
    }, [fetchProjectData]);

    const activeSprint = sprints.find(s => s.estado === 'activo') || sprints[0];
    const completedStories = stories.filter(s => s.estado === 'terminado').length;

    if (loading) return (
        <ProjectLayout>
            <div className="flex items-center justify-center h-64 text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                Sincronizando datos...
            </div>
        </ProjectLayout>
    );

    return (
        <ProjectLayout>
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Hero / Header */}
                <div className="bg-white border border-[#E9ECEF] rounded-[32px] p-6 lg:p-10 shadow-sm overflow-hidden relative group transition-all hover:shadow-md">
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#10B981]/5 rounded-full blur-3xl group-hover:bg-[#10B981]/10 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-[10px] font-black text-[#10B981] mb-4 uppercase tracking-widest italic">
                            <Activity className="w-3.5 h-3.5" /> Estado de ejecución actual
                        </div>
                        <h1 className="text-3xl lg:text-5xl font-black text-[#1A1A1A] mb-4 tracking-tighter leading-[1.1]">{project?.nombre}</h1>
                        <p className="text-sm lg:text-base text-[#64748B] max-w-2xl font-medium leading-relaxed">{project?.descripcion}</p>
                    </div>
                </div>

                {/* Quick Stats Grid - Responsive Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    <QuickStat icon={<Users className="w-4 h-4" />} label="Miembros" value={members.length.toString()} />
                    <QuickStat icon={<FileText className="w-4 h-4" />} label="Historias" value={stories.length.toString()} />
                    <QuickStat icon={<CheckCircle2 className="w-4 h-4" />} label="Completadas" value={completedStories.toString()} />
                    <QuickStat icon={<Clock className="w-4 h-4" />} label="Sprints" value={sprints.length.toString()} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content: Current Activity / Sprint */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Current Sprint Card */}
                        <div className="bg-white rounded-[32px] border border-[#E9ECEF] p-8 lg:p-10 shadow-sm overflow-hidden relative transition-all hover:shadow-md">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                                <h3 className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-widest flex items-center gap-2">
                                    <Target className="w-4 h-4 text-[#10B981]" /> Sprint en curso
                                </h3>
                                <span className={`self-start text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-widest ${activeSprint?.estado === 'activo' ? 'bg-[#F0FDF4] text-[#10B981] border-[#10B981]/20' : 'bg-slate-50 text-slate-400 border-slate-200'
                                    }`}>
                                    {activeSprint?.estado || 'Sin Sprint'}
                                </span>
                            </div>

                            <div className="mb-10">
                                <h2 className="text-2xl lg:text-3xl font-black mb-3 tracking-tight">{activeSprint?.nombre || 'Define un sprint para comenzar'}</h2>
                                <p className="text-sm lg:text-base text-[#64748B] font-medium max-w-lg leading-relaxed">{activeSprint?.objetivo || 'Establece objetivos claros para medir el éxito de la iteración.'}</p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-[#F8F9FA]">
                                <div className="flex -space-x-3 order-2 sm:order-1">
                                    {members.slice(0, 5).map((m, i) => (
                                        <div key={i} className="relative transition-transform hover:scale-110" style={{ zIndex: 10 - i }}>
                                            <Avatar 
                                                username={m.usuario_detalle.username} 
                                                photo={typeof m.usuario_detalle.perfil?.foto_perfil === 'string' ? m.usuario_detalle.perfil?.foto_perfil : undefined} 
                                                size="sm" 
                                                className="border-4 border-white shadow-sm"
                                            />
                                        </div>
                                    ))}

                                    {members.length > 5 && (
                                        <div className="w-10 h-10 rounded-xl border-4 border-white bg-[#1A1A1A] flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                            +{members.length - 5}
                                        </div>
                                    )}
                                </div>
                                <Link to={`/project/${projectId}/kanban`} className="w-full sm:w-auto px-8 py-3 bg-[#10B981] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#059669] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#10B981]/20 order-1 sm:order-2">
                                    Ver Tablero <ArrowUpRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>

                        {/* Recent Activity List */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.2em] px-2 italic">Actividad Reciente</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {[1, 2].map(i => (
                                    <div key={i} className="bg-white border border-[#E9ECEF] p-5 rounded-[24px] flex items-center gap-5 hover:border-[#10B981]/30 transition-all cursor-pointer group shadow-sm">
                                        <div className="w-12 h-12 bg-[#F8F9FA] rounded-2xl flex items-center justify-center text-[#ADB5BD] group-hover:bg-[#F0FDF4] group-hover:text-[#10B981] transition-all">
                                            <MessageSquare className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-[#1A1A1A] group-hover:text-[#10B981] transition-colors truncate">Actualización en <span className="underline">DU-0{i}</span></p>
                                            <p className="text-xs text-[#64748B] font-medium leading-tight">Comentario añadido por el equipo de desarrollo.</p>
                                        </div>
                                        <span className="text-[10px] font-black text-[#ADB5BD] uppercase shrink-0">2H AGO</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Details & Members */}
                    <div className="space-y-8">
                        {/* Details Card */}
                        <div className="bg-[#1A1A1A] rounded-[32px] p-8 text-white relative overflow-hidden group">
                            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-8 italic">Metadatos del Proyecto</h3>
                            <div className="space-y-8 relative z-10">
                                <DetailItem label="Visibilidad" value={project?.visibilidad || '...'} />
                                <DetailItem label="Creado el" value={project?.fecha_creacion ? new Date(project.fecha_creacion).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : '...'} />
                                <DetailItem label="Stack sugerido" value="TypeScript / Python" />
                            </div>
                        </div>

                        {/* Members Card */}
                        <div className="bg-white rounded-[32px] border border-[#E9ECEF] p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.2em] italic">Colaboradores</h3>
                                {project?.creador?.id === user?.id && (
                                    <div 
                                        onClick={() => setIsCollabModalOpen(true)}
                                        className="p-1.5 bg-[#F0FDF4] rounded-lg cursor-pointer hover:bg-[#10B981] transition-colors group"
                                    >
                                        <Plus className="w-4 h-4 text-[#10B981] group-hover:text-white" />
                                    </div>
                                )}

                            </div>

                            <div className="space-y-6">
                                {members.slice(0, 6).map((m) => (
                                    <div key={m.id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <Avatar 
                                                username={m.usuario_detalle.username} 
                                                photo={typeof m.usuario_detalle.perfil?.foto_perfil === 'string' ? m.usuario_detalle.perfil?.foto_perfil : undefined} 
                                                size="sm" 
                                            />

                                            <div className="min-w-0">
                                                <p className="text-sm font-black truncate">{m.usuario_detalle.username}</p>
                                                <p className="text-[9px] text-[#64748B] font-black uppercase tracking-tighter italic opacity-60">{m.rol_proyecto}</p>
                                            </div>
                                        </div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </div>
                                ))}
                            </div>
                            {members.length > 6 && (
                                <Link to={`/project/${projectId}/members`} className="block text-center mt-8 text-[10px] font-black text-[#10B981] uppercase tracking-widest hover:underline">Ver todos los miembros</Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ProjectCollaboratorsModal 
                isOpen={isCollabModalOpen}
                onClose={() => setIsCollabModalOpen(false)}
                projectId={projectId!}
                projectName={project?.nombre || ''}
            />
        </ProjectLayout>
    );
};

const QuickStat: React.FC<{ icon: React.ReactNode, label: string, value: string }> = ({ icon, label, value }) => (
    <div className="bg-white border border-[#E9ECEF] p-4 lg:p-6 rounded-[24px] flex items-center gap-4 transition-all hover:border-[#10B981]/20 hover:shadow-sm">
        <div className="w-10 lg:w-12 h-10 lg:h-12 bg-[#F8F9FA] rounded-2xl flex items-center justify-center text-[#10B981]">
            {icon}
        </div>
        <div className="min-w-0">
            <p className="text-[9px] lg:text-[10px] font-black text-[#ADB5BD] uppercase tracking-widest leading-none mb-1.5 lg:mb-2 truncate">{label}</p>
            <p className="text-base lg:text-2xl font-black text-[#1A1A1A] tracking-tighter leading-none">{value}</p>
        </div>
    </div>
);

const DetailItem: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div className="group">
        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 leading-none">{label}</p>
        <p className="text-sm font-black capitalize text-white group-hover:text-[#10B981] transition-colors">{value}</p>
    </div>
);

export default ProjectOverview;
