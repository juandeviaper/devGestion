import React from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Target,
    CheckCircle2,
    History as HistoryIcon,
    Paperclip,
    Share2,
    MoreHorizontal,
    Plus,
    ArrowRight,
    Menu,
    X
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { useEffect, useState } from 'react';
import { storyService, commentService } from '../services/api';
import { useWebSocket } from '../services/useWebSocket';
import type { UserStory, Comment } from '../types';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Send, MessageSquare } from 'lucide-react';

const UserStoryDetailPage: React.FC = () => {
    const { storyId } = useParams<{ storyId: string }>();
    const navigate = useNavigate();
    const [story, setStory] = useState<UserStory | null>(null);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [postingComment, setPostingComment] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // WebSocket for real-time notifications
    const { messages: wsMessages } = useWebSocket(story?.proyecto);

    const fetchStory = React.useCallback(async () => {
        if (!storyId) return;
        try {
            setLoading(true);
            const response = await storyService.getById(storyId);
            setStory(response.data);
        } catch (error: unknown) {
            console.error('Error fetching story:', error);
            toast.error('Error al cargar la historia');
        } finally {
            setLoading(false);
        }
    }, [storyId]);

    useEffect(() => {
        fetchStory();
    }, [fetchStory]);

    const fetchComments = React.useCallback(async () => {
        if (!storyId) return;
        try {
            const res = await commentService.getByStory(storyId);
            setComments(res.data);
        } catch (err) {
            console.error('Error fetching comments:', err);
        }
    }, [storyId]);

    useEffect(() => {
        if (storyId) fetchComments();
    }, [storyId, fetchComments]);

    // Update comments when a new WebSocket message arrives
    useEffect(() => {
        const lastMsg = wsMessages[wsMessages.length - 1];
        if (lastMsg) {
            // If it's a notification about a new comment, refresh
            fetchComments();
            toast('Nuevo comentario en el proyecto', { icon: '💬' });
        }
    }, [wsMessages, fetchComments]);

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !storyId) return;

        try {
            setPostingComment(true);
            await commentService.create({
                contenido: newComment,
                historia: parseInt(storyId),
                proyecto: story?.proyecto
            });
            setNewComment('');
            fetchComments();
            toast.success('Comentario publicado');
        } catch (err) {
            toast.error('Error al publicar comentario');
        } finally {
            setPostingComment(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!storyId) return;
        try {
            await storyService.changeStatus(storyId, newStatus);
            toast.success(`Estado cambiado a ${newStatus}`);
            fetchStory();
        } catch (error: unknown) {
            console.error('Error changing status:', error);
            let errorMsg = 'Error al cambiar el estado';
            if (axios.isAxiosError(error)) {
                errorMsg = error.response?.data?.error || error.response?.data?.detail || errorMsg;
            }
            toast.error(errorMsg);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center font-bold text-[#10B981] animate-pulse uppercase tracking-[0.2em]">
            Cargando detalles de la historia...
        </div>
    );

    if (!story) return (
        <div className="min-h-screen bg-white flex items-center justify-center font-bold text-red-500 uppercase tracking-[0.2em]">
            No se encontró la historia de usuario.
        </div>
    );

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

            <main className="flex-1 h-screen overflow-y-auto custom-scrollbar">
                {/* Mobile Header Toggle */}
                <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-[#E9ECEF]">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-3 bg-white border border-[#E9ECEF] rounded-2xl text-[#64748B] shadow-sm active:scale-95 transition-all"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <img src="/logo.png" alt="DevGestión" className="h-8 w-auto" />
                </div>
                {/* Top Navigation Bar */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#E9ECEF] px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-[#F8F9FA] rounded-xl transition-all border border-transparent hover:border-[#E9ECEF]"
                        >
                            <ChevronLeft className="w-5 h-5 text-[#64748B]" />
                        </button>
                        <div className="h-6 w-[1px] bg-[#E9ECEF]"></div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-[#64748B] uppercase tracking-widest italic leading-none">
                            Proyectos <ChevronRight className="w-3 h-3" /> {story.proyecto_detalle?.nombre || 'Proyecto'} <ChevronRight className="w-3 h-3" /> Backlog
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            to={`/project/${story.proyecto}/story/${storyId}/edit`}
                            className="p-2.5 bg-[#F8F9FA] hover:bg-[#E9ECEF] rounded-xl transition-all text-[#10B981] border border-[#E9ECEF]"
                            title="Editar Historia"
                        >
                            <Plus className="w-4 h-4 rotate-45" />
                        </Link>
                        <button className="p-2.5 bg-[#F8F9FA] hover:bg-[#E9ECEF] rounded-xl transition-all text-[#64748B] border border-[#E9ECEF]">
                            <Share2 className="w-4 h-4" />
                        </button>
                        <button className="p-2.5 bg-[#F8F9FA] hover:bg-[#E9ECEF] rounded-xl transition-all text-[#64748B] border border-[#E9ECEF]">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-[#0F172A] text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-[#0F172A]/10 hover:bg-slate-800 transition-all uppercase tracking-widest italic flex items-center gap-2"
                        >
                            Cerrar Detalle <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </header>

                <div className="max-w-6xl mx-auto p-12">
                    {/* Hero Section */}
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-[10px] font-black text-white bg-[#0F172A] px-3 py-1 rounded-full uppercase tracking-widest italic">
                                HU-{story.id}
                            </span>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest italic ${
                                story.estado?.toLowerCase() === 'pendiente' || story.estado?.toLowerCase() === 'nuevo' ? 'bg-red-50 text-red-600 border-red-200' :
                                story.estado?.toLowerCase() === 'en progreso' || story.estado?.toLowerCase() === 'activo' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                story.estado?.toLowerCase() === 'terminado' || story.estado?.toLowerCase() === 'hecho' || story.estado?.toLowerCase() === 'cerrado' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                'bg-slate-50 text-slate-500 border-slate-200'
                            }`}>
                                {story.estado.toUpperCase()}
                            </span>
                            <div className="flex items-center gap-1.5 ml-4 text-[10px] font-black text-[#ADB5BD] uppercase italic">
                                <Clock className="w-3 h-3" /> Estado Actual: {story.estado}
                            </div>
                        </div>
                        <h1 className="text-5xl font-black text-[#0F172A] tracking-tight leading-tight mb-8">
                            {story.titulo}
                        </h1>

                        <div className="flex flex-wrap items-center gap-8 border-y border-[#F1F3F5] py-8">
                            <InfoBlock label="Prioridad" value={story.prioridad.toUpperCase()} isPriority />
                            <InfoBlock label="ID Interno" value={`ID-${story.id}`} />
                            <div className="flex gap-2">
                                {['pendiente', 'en progreso', 'en pruebas', 'terminado'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => handleStatusChange(s)}
                                        className={`text-[8px] font-black px-2 py-1 rounded-full border transition-all ${story.estado === s ? 'bg-[#10B981] text-white border-[#10B981]' : 'bg-white text-[#ADB5BD] border-[#E9ECEF] hover:border-[#10B981]'}`}
                                    >
                                        Mover a {s.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                        <div className="lg:col-span-2 space-y-12">
                            {/* Description */}
                            <section>
                                <SectionHeader icon={<Target className="w-4 h-4" />} title="Descripción Técnica" />
                                <div className="bg-[#F8F9FA] p-8 rounded-[2rem] border border-[#E9ECEF] shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/5 rounded-bl-[5rem] -mr-8 -mt-8"></div>
                                    <p className="text-[#495057] text-lg leading-relaxed font-medium relative z-10 italic">
                                        {story.descripcion}
                                    </p>
                                </div>
                            </section>

                            <section>
                                <SectionHeader icon={<CheckCircle2 className="w-4 h-4" />} title="Gestión de Tareas" />
                                <p className="text-sm text-[#ADB5BD] font-bold italic">La gestión de tareas detalladas estará disponible en la próxima versión.</p>
                            </section>

                            {/* Comments Section */}
                            <section className="space-y-6">
                                <SectionHeader icon={<MessageSquare className="w-4 h-4" />} title="Colaboración en Tiempo Real" />
                                <div className="space-y-6">
                                    {/* Comment Input */}
                                    <form onSubmit={handlePostComment} className="relative group">
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Añade un comentario o feedback técnico..."
                                            className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-[2rem] p-6 pr-16 text-sm font-medium outline-none focus:ring-4 focus:ring-[#10B981]/10 focus:border-[#10B981] transition-all min-h-[120px]"
                                            disabled={postingComment}
                                        />
                                        <button
                                            type="submit"
                                            disabled={postingComment || !newComment.trim()}
                                            className="absolute right-4 bottom-4 p-4 bg-[#10B981] text-white rounded-2xl shadow-lg shadow-[#10B981]/20 hover:bg-[#059669] disabled:opacity-50 transition-all"
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </form>

                                    {/* Comments List */}
                                    <div className="space-y-4">
                                        {comments.map((comment) => (
                                            <div key={comment.id} className="bg-white border border-[#E9ECEF] p-6 rounded-[2rem] shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-[#E9ECEF]">
                                                           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.usuario_detalle.username}`} alt="" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">{comment.usuario_detalle.first_name || comment.usuario_detalle.username}</p>
                                                            <p className="text-[8px] font-black text-[#ADB5BD] uppercase tracking-widest italic">{new Date(comment.fecha_creacion).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-[#495057] leading-relaxed font-medium">{comment.contenido}</p>
                                            </div>
                                        ))}

                                        {comments.length === 0 && (
                                            <div className="text-center py-12 border-2 border-dashed border-[#DEE2E6] rounded-[2rem]">
                                                <p className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-widest italic">Aún no hay comentarios en esta historia.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="space-y-8">
                            {/* Sidebar Widgets */}
                            <div className="sticky top-24 space-y-6">
                                <aside className="bg-[#0F172A] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                                    <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[#10B981]/10 rounded-full blur-3xl"></div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#10B981] mb-6 italic">Activos de Tarea</h4>
                                    <div className="space-y-4">
                                        <AssetButton icon={<Paperclip className="w-4 h-4" />} label="Archivos Adjuntos" count={3} />
                                        <AssetButton icon={<HistoryIcon className="w-4 h-4" />} label="Historial de Cambios" />
                                    </div>
                                </aside>

                                <div className="p-8 bg-white border border-[#E9ECEF] rounded-[2.5rem] shadow-sm">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ADB5BD] mb-6 italic">Métricas de Sprint</h4>
                                    <div className="space-y-6">
                                        <MetricItem label="Story Points" value={story.puntos?.toString() || '0'} />
                                        <MetricItem label="Estimación" value="2d 4h" />
                                        <MetricItem label="Progreso" value="45%" isProgress />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E9ECEF;
          border-radius: 10px;
        }
      `}</style>
        </div>
    );
};

interface SectionHeaderProps {
    icon: React.ReactNode;
    title: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title }) => (
    <h3 className="text-[11px] font-black text-[#10B981] uppercase tracking-[0.3em] mb-6 flex items-center gap-3 italic">
        <span className="w-8 h-8 rounded-xl bg-[#F0FDF4] border border-[#10B981]/10 flex items-center justify-center">{icon}</span>
        {title}
    </h3>
);

interface InfoBlockProps {
    label: string;
    value: string;
    isUser?: boolean;
    isPriority?: boolean;
    highlighted?: boolean;
}

const InfoBlock: React.FC<InfoBlockProps> = ({ label, value, isUser, isPriority, highlighted }) => (
    <div className="flex flex-col gap-1">
        <span className="text-[9px] font-black text-[#ADB5BD] uppercase tracking-widest italic">{label}</span>
        {isUser ? (
            <div className={`flex items-center gap-2 ${highlighted ? 'bg-[#F0FDF4] px-2 py-1 rounded-lg border border-[#10B981]/10' : ''}`}>
                <div className="w-5 h-5 rounded-md overflow-hidden bg-slate-100">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${value.replace('@', '')}`} alt={value} />
                </div>
                <span className={`text-xs font-black ${highlighted ? 'text-[#10B981]' : 'text-[#0F172A]'}`}>{value}</span>
            </div>
        ) : (
            <span className={`text-xs font-black ${isPriority ? 'text-[#F85149]' : 'text-[#0F172A]'}`}>{value}</span>
        )}
    </div>
);

interface AssetButtonProps {
    icon: React.ReactNode;
    label: string;
    count?: number;
}

const AssetButton: React.FC<AssetButtonProps> = ({ icon, label, count }) => (
    <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 group">
        <div className="flex items-center gap-3">
            <span className="text-[#10B981] group-hover:scale-110 transition-transform">{icon}</span>
            <span className="text-xs font-bold text-slate-300">{label}</span>
        </div>
        {count !== undefined && <span className="bg-[#10B981] text-[#0F172A] text-[9px] font-black px-2 py-0.5 rounded-full">{count}</span>}
    </button>
);

interface MetricItemProps {
    label: string;
    value: string;
    isProgress?: boolean;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, value, isProgress }) => (
    <div>
        <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] font-black text-[#64748B] uppercase tracking-widest">{label}</span>
            <span className="text-xs font-black text-[#0F172A]">{value}</span>
        </div>
        {isProgress && (
            <div className="h-1.5 w-full bg-[#F1F3F5] rounded-full overflow-hidden">
                <div className="h-full bg-[#10B981] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" style={{ width: value }}></div>
            </div>
        )}
    </div>
);

export default UserStoryDetailPage;
