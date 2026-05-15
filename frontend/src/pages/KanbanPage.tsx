import React, { useState, useEffect, useRef } from 'react';
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
    Bug as BugIcon,
    Search
} from 'lucide-react';
import ProjectLayout from '../components/ProjectLayout';
import { storyService, projectService, taskService, bugService, sprintService } from '../services/api';
import { authService } from '../services/authService';
import Avatar from '../components/Avatar';
import toast from 'react-hot-toast';
import type { User, ProjectMember, UserStory, Task, Bug, Project, Sprint } from '../types';
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
    sprint?: number | null;
    talla?: string | null;
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
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest ${
                                item.talla === 'XS' ? 'bg-slate-500 text-white' :
                                item.talla === 'S' ? 'bg-emerald-500 text-white' :
                                item.talla === 'M' ? 'bg-blue-500 text-white' :
                                item.talla === 'L' ? 'bg-orange-500 text-white' :
                                item.talla === 'XL' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'
                            }`}>
                                {item.talla || 'Sin estimar'}
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
                    droppableId === 'todo' ? 'bg-red-400' :
                    droppableId === 'inprogress' ? 'bg-amber-400' : 'bg-emerald-400'
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
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [selectedSprintId, setSelectedSprintId] = useState<number | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [filterAssignee, setFilterAssignee] = useState<number | 'all'>('all');
    const [loading, setLoading] = useState(true);
    const hasInitialized = useRef(false);
    const user = authService.getUser();

    const fetchData = React.useCallback(async () => {
        if (!projectId) return;
        try {
            setLoading(true);
            const [sRes, mRes, tRes, bRes, pRes, sprRes] = await Promise.all([
                storyService.getByProject(projectId),
                projectService.getMembers(projectId),
                taskService.getByProject(projectId),
                bugService.getByProject(projectId),
                projectService.getById(projectId),
                sprintService.getByProject(projectId)
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
                    route: `/project/${projectId}/story/${i.id}/edit`,
                    sprint: i.sprint || null,
                    talla: i.talla || null
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
                    route: `/project/${projectId}/tasks/${i.id}/edit`,
                    sprint: i.sprint || null
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
                    route: `/project/${projectId}/bugs/${i.id}/edit`,
                    sprint: i.sprint || null
                }))
            ];
            
            setItems(allItems);
            setMembers(mRes.data);
            setProject(pRes.data);
            
            const fetchedSprints = sprRes.data;
            setSprints(fetchedSprints);
            
            // Default to 'all' for general board view
            if (!hasInitialized.current) {
                setSelectedSprintId('all');
                hasInitialized.current = true;
            }
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
        const [type, idStr] = draggableId.split('-');
        const id = Number(idStr);

        // Map visual columns to internal statuses
        const internalStatus = 
            newStatus === 'todo' ? 'pendiente' :
            newStatus === 'inprogress' ? 'en progreso' : 'terminado';

        // Optimistic update
        const updatedItems = items.map(item =>
            (item.type === type && item.id === id) 
                ? { ...item, estado: internalStatus } 
                : item
        );
        setItems(updatedItems);

        try {
            if (type === 'Historia') {
                await storyService.changeStatus(id, internalStatus);
            } else if (type === 'Tarea') {
                await taskService.changeStatus(id, internalStatus);
            } else if (type === 'Bug') {
                const bugStatus = internalStatus === 'pendiente' ? 'nuevo' : internalStatus;
                await bugService.changeStatus(id, bugStatus);
            }
            toast.success("Estado actualizado");
        } catch (err: unknown) {
            console.error(err);
            toast.error("Error al mover el item");
            fetchData();
        }
    };

    const columns = [
        { id: 'todo', title: 'Por hacer', color: 'bg-red-400' },
        { id: 'inprogress', title: 'En progreso', color: 'bg-amber-400' },
        { id: 'done', title: 'Hecho', color: 'bg-emerald-400' },
    ];

    const getColumnItems = (columnId: string) => {
        return items.filter(item => {
            // Filtros avanzados (Búsqueda, Prioridad, Asignado)
            if (searchTerm && !item.titulo.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            if (filterPriority !== 'all' && item.prioridad !== filterPriority) return false;
            if (filterAssignee !== 'all' && item.asignado_a !== filterAssignee) return false;

            // Filtro de Sprint
            if (selectedSprintId !== 'all' && item.sprint !== selectedSprintId) return false;

            const estado = item.estado.toLowerCase();

            if (columnId === 'todo') {
                return ['backlog', 'pendiente', 'ready', 'pending', 'nuevo'].includes(estado);
            }
            if (columnId === 'inprogress') {
                return ['en progreso', 'en pruebas', 'in progress', 'in review', 'testing', 'activo'].includes(estado);
            }
            if (columnId === 'done') {
                return ['terminado', 'done', 'completed', 'closed', 'archived', 'cerrado'].includes(estado);
            }
            return false;
        });
    };

    return (
        <ProjectLayout>
            <div className="h-full flex flex-col overflow-hidden">
                <div className="mb-8 lg:mb-10 flex flex-col gap-8 px-4 sm:px-0">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div>
                            <h2 className="text-2xl lg:text-3xl font-black flex items-center gap-3 tracking-tighter">
                                Tablero General <KanbanIcon className="w-6 lg:w-8 h-6 lg:h-8 text-[#10B981]" />
                            </h2>
                            <p className="text-[10px] lg:text-xs text-[#64748B] font-black mt-1.5 uppercase tracking-widest italic opacity-70">
                                Visualización completa del flujo de trabajo del proyecto
                            </p>
                        </div>

                        {/* Advanced Filters */}
                        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-3xl border border-slate-100 shadow-sm">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-[#10B981] transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar..."
                                    className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-2xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-[#10B981]/10 transition-all w-32 lg:w-48"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <select 
                                className="bg-slate-50 border-none rounded-2xl px-4 py-2 text-[11px] font-bold outline-none cursor-pointer text-slate-500"
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value)}
                            >
                                <option value="all">Prioridad: Todas</option>
                                <option value="alta">Alta</option>
                                <option value="media">Media</option>
                                <option value="baja">Baja</option>
                            </select>
                            <select 
                                className="bg-slate-50 border-none rounded-2xl px-4 py-2 text-[11px] font-bold outline-none cursor-pointer text-slate-500"
                                value={filterAssignee === 'all' ? 'all' : filterAssignee.toString()}
                                onChange={(e) => setFilterAssignee(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            >
                                <option value="all">Responsable: Todos</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.usuario_detalle.id}>{m.usuario_detalle.username}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Sprint Tabs Selector */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-slate-100">
                        <button
                            onClick={() => setSelectedSprintId('all')}
                            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap border-2 ${
                                selectedSprintId === 'all'
                                    ? 'bg-[#10B981] text-white border-[#10B981] shadow-lg shadow-[#10B981]/20'
                                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                            }`}
                        >
                            Vista General
                        </button>
                        {sprints.map(sprint => (
                            <button
                                key={sprint.id}
                                onClick={() => setSelectedSprintId(sprint.id)}
                                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap border-2 ${
                                    selectedSprintId === sprint.id
                                        ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-lg shadow-[#0F172A]/20'
                                        : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                                }`}
                            >
                                {sprint.nombre}
                                {sprint.estado === 'activo' && (
                                    <span className="ml-2 w-1.5 h-1.5 bg-[#10B981] rounded-full inline-block animate-pulse"></span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex gap-4 sm:gap-6 lg:gap-8 xl:justify-center h-full overflow-x-auto pb-8 px-4 sm:px-2 no-scrollbar md:custom-scrollbar scroll-smooth snap-x snap-mandatory md:snap-none">
                        {loading && items.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-[#ADB5BD] font-black uppercase tracking-[0.3em] animate-pulse italic">
                                Sincronizando tablero...
                            </div>
                        ) : (
                            columns
                                .map(col => (
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
