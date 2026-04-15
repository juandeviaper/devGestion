import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useParams, Link } from 'react-router-dom';
import {
    Plus,
    MessageSquare,
    Paperclip,
    Kanban as KanbanIcon,
    FileText,
    ClipboardCheck,
    Bug as BugIcon
} from 'lucide-react';
import ProjectLayout from '../components/ProjectLayout';
import { storyService, projectService, taskService, bugService } from '../services/api';
import { authService } from '../services/authService';
import Avatar from '../components/Avatar';
import toast from 'react-hot-toast';
import type { User, ProjectMember, UserStory, Task, Bug, Project } from '../types';
import axios from 'axios';

interface KanbanItem {
    id: number;
    type: 'Historia' | 'Tarea' | 'Bug';
    titulo: string;
    estado: string;
    prioridad: string;
    asignado_a: number | null;
    asignado_a_detalle: User | null;
    comentarios_count: number;
    adjuntos_count: number;
    route: string;
}

interface KanbanTypeConfig {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    label: string;
}

const KanbanCard: React.FC<{ 
    item: KanbanItem; 
    index: number; 
    isDragDisabled?: boolean;
    isMyTask?: boolean;
}> = ({ item, index, isDragDisabled, isMyTask }) => {
    const typeConfigs: Record<string, KanbanTypeConfig> = {
        'Historia': { icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-50', label: 'HU' },
        'Tarea': { icon: ClipboardCheck, color: 'text-emerald-500', bgColor: 'bg-emerald-50', label: 'Tarea' },
        'Bug': { icon: BugIcon, color: 'text-red-500', bgColor: 'bg-red-50', label: 'Bug' }
    };


    const config = typeConfigs[item.type] || typeConfigs['Historia'];

    return (
        <Draggable draggableId={`${item.type}-${item.id}`} index={index} isDragDisabled={!!isDragDisabled}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`bg-white border-2 rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 shadow-sm hover:shadow-xl transition-all duration-300 ease-out group relative hover:-translate-y-1 ${
                        snapshot.isDragging 
                            ? 'rotate-2 shadow-2xl z-50 border-blue-500 scale-105' 
                            : isMyTask ? 'border-blue-400/30 bg-blue-50/10' : 'border-slate-100 hover:border-slate-200'
                    } ${isDragDisabled ? 'cursor-not-allowed opacity-90' : 'cursor-grab active:cursor-grabbing'}`}
                >
                    {isMyTask && (
                        <div className="absolute top-0 right-10 -translate-y-1/2 bg-blue-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg shadow-blue-500/30 italic">
                            Tu Prioridad
                        </div>
                    )}

                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest ${config.bgColor} ${config.color} border border-current opacity-70`}>
                                {config.label}
                            </span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest ${
                                item.prioridad === 'alta' ? 'bg-red-600 text-white shadow-sm' :
                                item.prioridad === 'media' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-200'
                                }`}>
                                {item.prioridad || 'media'}
                            </span>
                        </div>
                        {isDragDisabled && !isMyTask && (
                            <div className="p-1 bg-slate-50 rounded-lg text-slate-300" title="Solo lectura">
                                <KanbanIcon className="w-3.5 h-3.5" />
                            </div>
                        )}
                    </div>

                    <Link to={item.route}>
                        <h4 className="text-[13px] font-black text-[#0F172A] mb-6 leading-relaxed hover:text-blue-600 transition-colors line-clamp-2 tracking-tight">
                            {item.titulo}
                        </h4>
                    </Link>

                    <div className="flex items-center justify-between border-t border-[#F8F9FA] pt-4 mt-auto">
                        <div className="flex items-center gap-3 text-[#ADB5BD]">
                            <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter hover:text-blue-500 transition-colors">
                                <MessageSquare className="w-3.5 h-3.5" /> {item.comentarios_count || 0}
                            </div>
                            <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter hover:text-emerald-500 transition-colors">
                                <Paperclip className="w-3.5 h-3.5" /> {item.adjuntos_count || 0}
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 bg-slate-50/80 pr-4 pl-1.5 py-1.5 rounded-2xl border border-slate-100/50 shadow-sm group-hover:bg-white transition-colors duration-300">
                             <Avatar 
                                username={item.asignado_a_detalle?.username || '?'} 
                                photo={typeof item.asignado_a_detalle?.perfil?.foto_perfil === 'string' ? item.asignado_a_detalle.perfil.foto_perfil : undefined} 
                                size="sm" 
                                className="ring-2 ring-white shadow-sm flex-shrink-0"
                             />
                             <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-black text-[#1E293B] leading-none truncate">
                                    {item.asignado_a_detalle ? (item.asignado_a_detalle.first_name || item.asignado_a_detalle.username) : 'Sin asignar'}
                                </span>
                                {item.asignado_a_detalle && (
                                    <span className="text-[7px] font-bold text-slate-400 leading-none mt-1 uppercase tracking-widest opacity-80">Asignado</span>
                                )}
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

const KanbanColumn: React.FC<{ 
    title: string; 
    items: KanbanItem[]; 
    droppableId: string; 
    projectId: string; 
    isOwner: boolean;
    userId: number | undefined;
}> = ({ title, items, droppableId, projectId, isOwner, userId }) => (
    <div className="w-[85vw] sm:w-full sm:min-w-[320px] max-w-[340px] sm:max-w-[360px] md:max-w-[420px] lg:max-w-[500px] xl:max-w-[600px] 2xl:max-w-[680px] shrink-0 md:shrink md:flex-1 snap-center flex flex-col h-[calc(100vh-200px)] md:h-[calc(100vh-250px)] bg-slate-50/60 backdrop-blur-md rounded-[32px] sm:rounded-[40px] border border-slate-200/60 shadow-sm overflow-hidden transition-colors hover:bg-slate-50/80">
        <div className="p-7 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                    droppableId === 'pendiente' ? 'bg-red-400' :
                    droppableId === 'en progreso' ? 'bg-amber-400' : 'bg-emerald-400'
                }`}></div>
                <h3 className="text-[11px] font-black text-[#1A1A1A] uppercase tracking-[0.2em]">{title}</h3>
                <span className="bg-white text-slate-500 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-slate-100 shadow-sm">
                    {items.length}
                </span>
            </div>
            {isOwner && (
                <Link
                    to={`/project/${projectId}/work-items`}
                    className="p-2 bg-white border border-[#DEE2E6] hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all shadow-sm group"
                >
                    <Plus className="w-3.5 h-3.5 group-hover:scale-125 transition-transform" />
                </Link>
            )}
        </div>

        <Droppable droppableId={droppableId}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto px-5 pt-4 pb-8 space-y-5 transition-all custom-scrollbar ${
                        snapshot.isDraggingOver ? 'bg-blue-50/30' : ''
                    }`}
                >
                    {items.map((item, index) => {
                        const isMyTask = item.asignado_a === userId;
                        const isDragDisabled = !(isOwner || isMyTask);
                        
                        return (
                            <KanbanCard 
                                key={`${item.type}-${item.id}`} 
                                item={item} 
                                index={index} 
                                isDragDisabled={isDragDisabled}
                                isMyTask={isMyTask}
                            />
                        );
                    })}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    </div>
);

const KanbanPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const [items, setItems] = useState<KanbanItem[]>([]);
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const user = authService.getUser();

    const fetchData = React.useCallback(async () => {
        if (!projectId) return;
        try {
            setLoading(true);
            const [sRes, mRes, tRes, bRes, pRes] = await Promise.all([
                storyService.getByProject(projectId),
                projectService.getMembers(projectId),
                taskService.getByProject(projectId),
                bugService.getByProject(projectId),
                projectService.getById(projectId)
            ]);

            const allItems: KanbanItem[] = [
                ...sRes.data.map((i: UserStory) => ({ 
                    id: i.id!, 
                    type: 'Historia' as const, 
                    titulo: i.titulo,
                    estado: i.estado,
                    prioridad: i.prioridad,
                    asignado_a: i.asignado_a || null,
                    asignado_a_detalle: i.asignado_a_detalle || null,
                    comentarios_count: i.comentarios_count || 0,
                    adjuntos_count: i.adjuntos_count || 0,
                    route: `/project/${projectId}/story/${i.id}/edit` 
                })),
                ...tRes.data.map((i: Task) => ({ 
                    id: i.id!, 
                    type: 'Tarea' as const, 
                    titulo: i.titulo,
                    estado: i.estado,
                    prioridad: i.prioridad || 'media',
                    asignado_a: i.asignado_a || null,
                    asignado_a_detalle: i.asignado_a_detalle || null,
                    comentarios_count: (i as any).comentarios_count || 0,
                    adjuntos_count: (i as any).adjuntos_count || 0,
                    route: `/project/${projectId}/tasks/${i.id}/edit` 
                })),
                ...bRes.data.map((i: Bug) => ({ 
                    id: i.id!, 
                    type: 'Bug' as const, 
                    titulo: i.titulo,
                    estado: i.estado,
                    prioridad: i.prioridad,
                    asignado_a: i.asignado_a || null,
                    asignado_a_detalle: i.asignado_a_detalle || null,
                    comentarios_count: (i as any).comentarios_count || 0,
                    adjuntos_count: (i as any).adjuntos_count || 0,
                    route: `/project/${projectId}/bugs/${i.id}/edit` 
                }))
            ];
            
            setItems(allItems);
            setMembers(mRes.data);
            setProject(pRes.data);
        } catch (err: unknown) {
            console.error(err);
            let errorMsg = 'Error al cargar el tablero';
            if (axios.isAxiosError(err)) {
                errorMsg = err.response?.data?.error || err.response?.data?.detail || errorMsg;
            }
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const isOwner = !!(
        user?.is_staff || 
        project?.creador.id === user?.id ||
        members.some(m => m.usuario_detalle.id === user?.id && m.rol_proyecto.toLowerCase() === 'dueño')
    );

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const newStatus = destination.droppableId;
        const [type, id] = draggableId.split('-');

        // Optimistic update
        const updatedItems = items.map(item =>
            (item.type === type && item.id.toString() === id) ? { ...item, estado: newStatus } : item
        );
        setItems(updatedItems);

        try {
            if (type === 'Historia') await storyService.changeStatus(id, newStatus);
            else if (type === 'Tarea') await taskService.changeStatus(id, newStatus);
            else if (type === 'Bug') await bugService.changeStatus(id, newStatus);
            toast.success("Estado actualizado con éxito");
        } catch (err: unknown) {
            console.error(err);
            let errorMsg = "No tienes permiso para mover este item";
            if (axios.isAxiosError(err)) {
                errorMsg = err.response?.data?.detail || errorMsg;
            }
            toast.error(errorMsg);
            fetchData();
        }
    };

    const columns = [
        { id: 'pendiente', title: 'Por hacer' },
        { id: 'en progreso', title: 'En progreso' },
        { id: 'terminado', title: 'Hecho' },
    ];

    const getColumnItems = (statusId: string) => {
        return items.filter(item => {
            if (statusId === 'en progreso') {
                return item.estado === 'en progreso' || item.estado === 'en pruebas' || item.estado === 'Activo';
            }
            if (statusId === 'pendiente') {
                return item.estado === 'pendiente' || item.estado === 'Nuevo';
            }
            if (statusId === 'terminado') {
                return item.estado === 'terminado' || item.estado === 'Cerrado';
            }
            return item.estado === statusId;
        });
    };

    return (
        <ProjectLayout>
            <div className="h-full flex flex-col overflow-hidden">
                <div className="mb-8 lg:mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 px-4 sm:px-0">
                    <div>
                        <h2 className="text-2xl lg:text-3xl font-black flex items-center gap-3 tracking-tighter">
                            Tablero Ágil <KanbanIcon className="w-6 lg:w-8 h-6 lg:h-8 text-[#10B981]" />
                        </h2>
                        <p className="text-[10px] lg:text-xs text-[#64748B] font-bold mt-1.5 uppercase tracking-widest italic opacity-70">Arrastra y suelta para actualizar el flujo</p>
                    </div>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex gap-4 sm:gap-6 lg:gap-8 xl:justify-center h-full overflow-x-auto pb-8 px-4 sm:px-2 no-scrollbar md:custom-scrollbar scroll-smooth snap-x snap-mandatory md:snap-none">
                        {loading && items.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-[#ADB5BD] font-black uppercase tracking-[0.3em] animate-pulse italic">
                                Sincronizando tablero...
                            </div>
                        ) : (
                            columns.map(col => (
                                <KanbanColumn
                                    key={col.id}
                                    title={col.title}
                                    droppableId={col.id}
                                    projectId={projectId || ''}
                                    isOwner={isOwner}
                                    userId={user?.id}
                                    items={getColumnItems(col.id)}
                                />
                            ))
                        )}
                    </div>
                </DragDropContext>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E9ECEF; border-radius: 10px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </ProjectLayout>
    );
};

export default KanbanPage;
