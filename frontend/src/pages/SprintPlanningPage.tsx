import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import { 
    AlertCircle,
    ArrowLeftRight,
    Calendar,
    ChevronRight,
    Layers, 
    LayoutGrid,
    List,
    Lock,
    MousePointer2,
    MoveHorizontal,
    Search, 
    Sparkles,
    Target,
    Trash2, 
    Zap, 
} from 'lucide-react';

import ProjectLayout from '../components/ProjectLayout';
import Avatar from '../components/Avatar';
import { storyService, sprintService } from '../services/api';
import { type UserStory, type Sprint } from '../types';

const SprintPlanningPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    
    const [backlog, setBacklog] = useState<UserStory[]>([]);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);
    const [sprintStories, setSprintStories] = useState<UserStory[]>([]);
    const [loading, setLoading] = useState(true);
    const [switchingSprint, setSwitchingSprint] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const hasInitialized = useRef(false);

    const filteredBacklog = useMemo(() => 
        backlog.filter(s => s.titulo.toLowerCase().includes(searchTerm.toLowerCase())),
    [backlog, searchTerm]);

    const selectedSprint = useMemo(() => 
        sprints.find(s => s.id === selectedSprintId), 
    [sprints, selectedSprintId]);

    const isLocked = useMemo(() => 
        selectedSprint?.estado === 'activo' || selectedSprint?.estado === 'terminado',
    [selectedSprint]);

    // Regla principal: Backlog = Historias sin sprint asignado
    const fetchData = useCallback(async (showLoading = true) => {
        if (!projectId) return;
        try {
            if (showLoading) setLoading(true);
            
            // 1. Obtener backlog y sprints
            const [bRes, sRes] = await Promise.all([
                storyService.getBacklog(projectId),
                sprintService.getByProject(projectId)
            ]);
            
            setBacklog(bRes.data);
            
            // 2. Obtener todos los sprints del proyecto
            const allSprints = sRes.data;
            setSprints(allSprints);
            
            if (!hasInitialized.current && allSprints.length > 0) {
                // Preferir el primer sprint planeado, si no hay, el primero disponible
                const firstPlanned = allSprints.find((s: Sprint) => s.estado === 'planeado');
                setSelectedSprintId(firstPlanned ? firstPlanned.id : allSprints[0].id);
                hasInitialized.current = true;
            }
        } catch (error) {
            toast.error('Error al sincronizar datos de planificación');
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Cargar historias del sprint seleccionado
    useEffect(() => {
        if (selectedSprintId && projectId) {
            setSwitchingSprint(true);
            storyService.getBySprint(selectedSprintId.toString())
                .then(res => setSprintStories(res.data))
                .catch(() => toast.error('Error al cargar historias del sprint'))
                .finally(() => setSwitchingSprint(false));
        } else {
            setSprintStories([]);
        }
    }, [selectedSprintId, projectId]);

    const totalPoints = useMemo(() => 
        sprintStories.reduce((acc, s) => acc + (s.puntos || 0), 0),
    [sprintStories]);

    const capacityPercent = useMemo(() => {
        if (!selectedSprint || !selectedSprint.capacidad) return 0;
        return Math.min((totalPoints / selectedSprint.capacidad) * 100, 100);
    }, [totalPoints, selectedSprint]);

    const capacityColor = useMemo(() => {
        if (capacityPercent >= 100) return 'bg-red-500';
        if (capacityPercent >= 85) return 'bg-amber-500';
        return 'bg-[#10B981]';
    }, [capacityPercent]);

    const onDragEnd = async (result: DropResult) => {
        if (isLocked) {
            toast.error('Este sprint ya está iniciado o finalizado y no puede modificarse.');
            return;
        }

        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId) return;

        const storyId = Number(draggableId);
        const isAddingToSprint = destination.droppableId === 'sprint';
        const targetSprintId = isAddingToSprint ? selectedSprintId : null;

        try {
            // Optimistic UI Update
            if (isAddingToSprint) {
                const story = backlog.find(s => s.id === storyId);
                if (story) {
                    setBacklog(prev => prev.filter(s => s.id !== storyId));
                    setSprintStories(prev => [...prev, { ...story, sprint: targetSprintId }]);
                }
            } else {
                const story = sprintStories.find(s => s.id === storyId);
                if (story) {
                    setSprintStories(prev => prev.filter(s => s.id !== storyId));
                    setBacklog(prev => [...prev, { ...story, sprint: null }]);
                }
            }

            await storyService.bulkAssign(targetSprintId, [storyId]);
            toast.success(isAddingToSprint ? 'Asignada al sprint' : 'Devuelta al backlog');
        } catch (err: any) {
            let msg = 'Error al actualizar asignación';
            if (isAxiosError(err)) {
                msg = err.response?.data?.error || err.response?.data?.detail || msg;
            }
            toast.error(msg);
            fetchData(false); // Revert to server state
        }
    };

    const handleBulkAction = async (toSprint: boolean) => {
        if (isLocked) {
            toast.error('No se permiten cambios masivos en un sprint bloqueado.');
            return;
        }
        if (selectedIds.length === 0) return;
        const targetSprintId = toSprint ? selectedSprintId : null;

        try {
            setLoading(true);
            await storyService.bulkAssign(targetSprintId, selectedIds);
            toast.success(`${selectedIds.length} historias actualizadas`);
            setSelectedIds([]);
            await fetchData(false);
            
            // Re-fetch current sprint stories
            if (selectedSprintId) {
                const res = await storyService.getBySprint(selectedSprintId.toString());
                setSprintStories(res.data);
            }
        } catch (err: unknown) {
            let msg = 'Error en la acción masiva';
            if (isAxiosError(err)) {
                msg = err.response?.data?.error || err.response?.data?.detail || msg;
            }
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const autoCompleteSprint = () => {
        if (isLocked) {
            toast.error('La planificación automática está deshabilitada para sprints activos.');
            return;
        }
        if (!selectedSprint || !selectedSprint.capacidad) return;
        let remaining = selectedSprint.capacidad - totalPoints;
        if (remaining <= 0) {
            toast.error('El sprint ya está a su capacidad máxima');
            return;
        }

        const toAdd: number[] = [];
        const sortedBacklog = [...backlog].sort((a, b) => {
            const prioMap: Record<string, number> = { alta: 3, media: 2, baja: 1 };
            return prioMap[b.prioridad] - prioMap[a.prioridad];
        });

        for (const story of sortedBacklog) {
            if ((story.puntos || 0) <= remaining) {
                toAdd.push(story.id);
                remaining -= (story.puntos || 0);
            }
        }

        if (toAdd.length > 0) {
            setSelectedIds(toAdd);
            toast.success(`Sugerencia: ${toAdd.length} historias para completar capacidad.`);
        } else {
            toast.error('No hay historias en el backlog que quepan en el espacio restante.');
        }
    };



    if (loading && !backlog.length) return (
        <ProjectLayout>
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin"></div>
                <p className="text-xs font-black text-[#ADB5BD] uppercase tracking-widest animate-pulse italic">Sincronizando Workspace...</p>
            </div>
        </ProjectLayout>
    );

    return (
        <ProjectLayout>
            <div className="max-w-[1600px] mx-auto h-[calc(100vh-12rem)] flex flex-col gap-6">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter flex items-center gap-3">
                            Planning Workspace <Sparkles className="w-6 h-6 text-[#10B981]" />
                        </h1>
                        <div className="flex items-center gap-3">
                            <p className="text-[10px] text-[#64748B] font-black uppercase tracking-widest italic opacity-60">
                                Asignación estratégica de Historias de Usuario
                            </p>
                            {isLocked && (
                                <span className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-amber-100">
                                    <Lock className="w-2.5 h-2.5" /> Planificación Bloqueada
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-[#E9ECEF] shadow-sm">
                        <div className="flex bg-[#F8F9FA] p-1 rounded-xl">
                            <button 
                                onClick={() => setViewMode('card')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-white shadow-sm text-[#10B981]' : 'text-[#ADB5BD]'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setViewMode('table')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-[#10B981]' : 'text-[#ADB5BD]'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="h-6 w-[1px] bg-[#E9ECEF]"></div>
                        <button 
                            disabled={isLocked}
                            onClick={autoCompleteSprint}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all group ${
                                isLocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981] hover:text-white'
                            }`}
                        >
                            <Zap className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> Auto-Plan
                        </button>
                    </div>
                </div>

                {/* Locked Message Banner */}
                {isLocked && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-amber-900 uppercase tracking-tight">Planificación Congelada</p>
                            <p className="text-[10px] text-amber-700 font-bold italic">Este sprint ya está {selectedSprint?.estado} y no permite cambios en su alcance desde este panel.</p>
                        </div>
                    </div>
                )}

                {/* Workspace Panels */}
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
                        
                        {/* Panel Izquierdo: Backlog Disponible (Historias SIN SPRINT) */}
                        <div className={`flex flex-col bg-white border border-[#E9ECEF] rounded-[40px] shadow-sm overflow-hidden min-h-0 relative group/panel ${isLocked ? 'opacity-80' : ''}`}>
                            <div className="p-6 bg-[#F8F9FA]/50 border-b border-[#E9ECEF] flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#0F172A] rounded-2xl flex items-center justify-center text-[#10B981] shadow-lg shadow-[#0F172A]/10">
                                        <Layers className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-[#0F172A] uppercase tracking-tighter">Backlog Disponible</h2>
                                        <p className="text-[9px] text-[#ADB5BD] font-black uppercase tracking-widest italic">{filteredBacklog.length} historias {searchTerm ? 'filtradas' : 'listas'}</p>
                                    </div>
                                </div>
                                <div className="relative group/search">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#ADB5BD] group-focus-within/search:text-[#10B981] transition-colors" />
                                    <input 
                                        type="text" 
                                        placeholder="Filtrar backlog..."
                                        className="bg-white border border-[#DEE2E6] rounded-xl py-2 pl-9 pr-4 text-[11px] font-bold outline-none focus:ring-4 focus:ring-[#10B981]/5 focus:border-[#10B981] transition-all w-48"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Droppable droppableId="backlog" isDropDisabled={isLocked}>
                                {(provided) => (
                                    <div 
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar bg-[#FDFDFD]"
                                    >
                                        {filteredBacklog.map((story, index) => (
                                            <StoryPlanningCard 
                                                key={story.id} 
                                                story={story} 
                                                index={index} 
                                                isSelected={selectedIds.includes(story.id)}
                                                onSelect={() => toggleSelect(story.id)}
                                                onEdit={() => navigate(`/project/${projectId}/story/${story.id}/edit`)}
                                                viewMode={viewMode}
                                                isDisabled={isLocked}
                                            />
                                        ))}
                                        {backlog.length === 0 && !loading && (
                                            <div className="h-full flex flex-col items-center justify-center text-center opacity-20 p-12">
                                                <Target className="w-16 h-16 mb-4" />
                                                <p className="text-xs font-black uppercase tracking-widest max-w-[250px]">El backlog está vacío o todas las historias ya tienen sprint</p>
                                            </div>
                                        )}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>

                        {/* Panel Derecho: Sprint Seleccionado */}
                        <div className="flex flex-col bg-white border border-[#E9ECEF] rounded-[40px] shadow-sm overflow-hidden min-h-0 relative">
                            <div className="p-6 bg-[#0F172A] text-white flex flex-col gap-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[#0F172A] shadow-lg ${isLocked ? 'bg-amber-400' : 'bg-[#10B981]'}`}>
                                            {isLocked ? <Lock className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <select 
                                                className="bg-transparent border-none text-base font-black text-white outline-none cursor-pointer p-0 m-0 tracking-tight"
                                                value={selectedSprintId || ''}
                                                onChange={(e) => setSelectedSprintId(e.target.value ? Number(e.target.value) : null)}
                                            >
                                                {sprints.map(s => (
                                                    <option key={s.id} value={s.id} className="text-black">{s.nombre} ({s.estado})</option>
                                                ))}
                                                {sprints.length === 0 && <option value="">No hay sprints definidos</option>}
                                            </select>
                                            <p className="text-[9px] text-[#10B981] font-black uppercase tracking-widest mt-0.5 italic flex items-center gap-1.5">
                                                {isLocked ? 'Vista de Consulta' : 'Configurando Alcance'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right">
                                        <p className="text-[9px] text-white/40 font-black uppercase tracking-widest mb-1 italic">Compromiso (Pts)</p>
                                        <div className="text-2xl font-black text-[#10B981] leading-none tracking-tighter">
                                            {totalPoints} <span className="text-[10px] text-white/60 font-medium tracking-normal">/ {selectedSprint?.capacidad || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Capacity Viz */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest italic">
                                        <span className="text-white/60">Carga de Trabajo</span>
                                        <span className={capacityPercent >= 100 ? 'text-red-400' : 'text-[#10B981]'}>
                                            {capacityPercent.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden p-[1px]">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-700 shadow-[0_0_15px_rgba(16,185,129,0.3)] ${capacityColor}`} 
                                            style={{ width: `${capacityPercent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <Droppable droppableId="sprint" isDropDisabled={isLocked}>
                                {(provided) => (
                                    <div 
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar bg-[#F8FAFC] transition-colors ${isLocked ? 'bg-slate-50/50' : ''}`}
                                    >
                                        {switchingSprint ? (
                                            <div className="h-full flex flex-col items-center justify-center gap-3 opacity-30">
                                                <div className="w-8 h-8 border-2 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin"></div>
                                                <p className="text-[10px] font-black uppercase tracking-widest italic">Actualizando vista...</p>
                                            </div>
                                        ) : (
                                            <>
                                                {sprintStories.map((story, index) => (
                                                    <StoryPlanningCard 
                                                        key={story.id} 
                                                        story={story} 
                                                        index={index}
                                                        isSelected={selectedIds.includes(story.id)}
                                                        onSelect={() => toggleSelect(story.id)}
                                                        onEdit={() => navigate(`/project/${projectId}/story/${story.id}/edit`)}
                                                        viewMode={viewMode}
                                                        isFromSprint
                                                        isDisabled={isLocked}
                                                    />
                                                ))}
                                                {sprintStories.length === 0 && (
                                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-12">
                                                        <MousePointer2 className="w-12 h-12 mb-4 animate-bounce" />
                                                        <p className="text-xs font-black uppercase tracking-widest max-w-[200px]">El sprint está vacío. Arrastra historias aquí para planificar.</p>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    </div>
                </DragDropContext>

                {/* Floating Bulk Action Bar */}
                {selectedIds.length > 0 && !isLocked && (
                    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white px-8 py-5 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex items-center gap-10 z-50 animate-in slide-in-from-bottom-12 duration-500 border border-white/10">
                        <div className="flex items-center gap-4 pr-10 border-r border-white/10">
                            <div className="w-12 h-12 bg-[#10B981] text-[#0F172A] rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-[#10B981]/20">
                                {selectedIds.length}
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest">Seleccionados</p>
                                <p className="text-[9px] text-white/40 italic">Preparado para acción masiva</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => handleBulkAction(true)}
                                className="flex items-center gap-2 px-8 py-3 bg-white text-[#0F172A] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#10B981] hover:text-white transition-all shadow-md group"
                            >
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /> Asignar a Sprint
                            </button>
                            <button 
                                onClick={() => handleBulkAction(false)}
                                className="flex items-center gap-2 px-8 py-3 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:border-red-500 transition-all group"
                            >
                                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> Quitar de Sprint
                            </button>
                            <button 
                                onClick={() => setSelectedIds([])}
                                className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-all ml-4 italic"
                            >
                                Cancelar selección
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E2E8F0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #CBD5E1;
                }
            `}</style>
        </ProjectLayout>
    );
};

interface StoryPlanningCardProps {
    story: UserStory;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
    onEdit?: () => void;
    viewMode: 'card' | 'table';
    isFromSprint?: boolean;
    isDisabled?: boolean;
}

const StoryPlanningCard: React.FC<StoryPlanningCardProps> = ({ 
    story, 
    index, 
    isSelected, 
    onSelect, 
    onEdit,
    viewMode,
    isFromSprint,
    isDisabled 
}) => {
    const isTable = viewMode === 'table';

    return (
        <Draggable draggableId={story.id.toString()} index={index} isDragDisabled={isDisabled}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`group transition-all duration-300 ${snapshot.isDragging ? 'z-50 scale-105 rotate-1 shadow-2xl' : ''}`}
                >
                    <div 
                        onClick={() => !isDisabled && onSelect()}
                        className={`bg-white border rounded-2xl transition-all relative overflow-hidden ${
                            isDisabled ? 'cursor-default opacity-90 grayscale-[0.3]' : 'cursor-pointer'
                        } ${
                            isSelected 
                                ? 'border-[#10B981] bg-[#10B981]/5 shadow-md ring-2 ring-[#10B981]/10' 
                                : 'border-[#E9ECEF] hover:border-[#10B981]/40 hover:shadow-sm'
                        } ${isTable ? 'p-2.5' : 'p-4'}`}
                    >
                        {/* Indicador de Prioridad Lateral */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                            story.prioridad === 'alta' ? 'bg-red-400' : 
                            story.prioridad === 'media' ? 'bg-amber-400' : 'bg-[#10B981]'
                        }`}></div>

                        <div className={`flex items-center gap-3 ${isTable ? 'pl-1' : 'pl-2'}`}>
                            {!isDisabled && (
                                <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        onSelect();
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 rounded-lg border-[#DEE2E6] text-[#10B981] focus:ring-[#10B981]/20 cursor-pointer shrink-0"
                                />
                            )}

                            <div className="flex-1 min-w-0">
                                <div className={`flex items-center gap-2 ${isTable ? 'mb-0.5' : 'mb-1.5'}`}>
                                    <span className="text-[8px] font-black text-[#64748B] bg-[#F8F9FA] px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-sm border border-[#E9ECEF]">HU-{story.id}</span>
                                    {!isTable && (
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                                            story.prioridad === 'alta' ? 'text-red-500 bg-red-50' : 
                                            story.prioridad === 'media' ? 'text-amber-600 bg-amber-50' : 'text-[#10B981] bg-emerald-50'
                                        }`}>{story.prioridad}</span>
                                    )}
                                </div>
                                <h4 className={`font-black truncate transition-colors leading-tight ${
                                    isTable ? 'text-[10px]' : 'text-xs pr-8'
                                } ${
                                    isDisabled ? 'text-slate-500' : 'text-[#0F172A] group-hover:text-[#10B981]'
                                }`}>{story.titulo}</h4>
                            </div>

                            <div className={`flex items-center shrink-0 border-[#E9ECEF] ${isTable ? 'gap-3 pl-3 border-l' : 'gap-4 pl-4 border-l'}`}>
                                <div className="text-center">
                                    <p className="text-[8px] text-[#ADB5BD] font-black uppercase tracking-widest leading-none mb-1 italic opacity-60">Pts</p>
                                    <p className={`${isTable ? 'text-[11px]' : 'text-sm'} font-black text-[#0F172A] tracking-tighter`}>{story.puntos || 0}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[8px] text-[#ADB5BD] font-black uppercase tracking-widest leading-none mb-1 italic opacity-60">Talla</p>
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                                        story.talla === 'XS' ? 'bg-slate-500 text-white' :
                                        story.talla === 'S' ? 'bg-emerald-500 text-white' :
                                        story.talla === 'M' ? 'bg-blue-500 text-white' :
                                        story.talla === 'L' ? 'bg-orange-500 text-white' :
                                        story.talla === 'XL' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        {story.talla || '?'}
                                    </span>
                                </div>
                                <Avatar 
                                    username={story.asignado_a_detalle?.username || '?'} 
                                    photo={typeof story.asignado_a_detalle?.perfil?.foto_perfil === 'string' ? story.asignado_a_detalle.perfil.foto_perfil : undefined} 
                                    size="xs" 
                                    className="ring-1 ring-white shadow-sm flex-shrink-0"
                                />
                            </div>
                        </div>

                        {/* Botón Editar */}
                        {!isDisabled && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit?.();
                                }}
                                className="absolute right-12 top-1/2 -translate-y-1/2 p-2 hover:bg-[#F8F9FA] rounded-xl text-[#ADB5BD] hover:text-[#10B981] transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                            </button>
                        )}

                        {/* Drag Handle UI (Visual Only) */}
                        {!isDisabled && !isTable && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-[-4px]">
                                {isFromSprint ? <MoveHorizontal className="w-4 h-4 text-[#ADB5BD]" /> : <ArrowLeftRight className="w-4 h-4 text-[#ADB5BD]" />}
                            </div>
                        )}
                        
                        {isDisabled && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
                                <Lock className="w-3 h-3" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default SprintPlanningPage;
