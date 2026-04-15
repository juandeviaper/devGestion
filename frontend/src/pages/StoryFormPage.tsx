import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ChevronLeft,
    Save,
    Plus,
    Trash2,
    FileText,
    AlertCircle,
    CheckSquare,
    Target,
    Clock,
    User as UserIcon,
    Activity
} from 'lucide-react';
import ProjectLayout from '../components/ProjectLayout';
import { storyService, projectService, sprintService, epicService } from '../services/api';
import { authService } from '../services/authService';
import type { ProjectMember, Sprint, UserStory, Priority, ItemStatus, Epic, AcceptanceCriterion } from '../types';
import axios from 'axios';
import toast from 'react-hot-toast';

// --- Local Interfaces for form state ---
interface CriterionForm {
    id?: number;
    descripcion: string;
    completado: boolean;
}

interface StoryFormData {
    titulo: string;
    descripcion: string;
    prioridad: Priority;
    estado: ItemStatus;
    epica: string;
    sprint: string;
    asignado_a: string;
    horas_estimadas: number | '';
    horas_reales: number | '';
}

const StoryFormPage: React.FC = () => {
    const { projectId, storyId } = useParams<{ projectId: string, storyId: string }>();
    const navigate = useNavigate();
    const isEdit = !!storyId;

    const [formData, setFormData] = useState<StoryFormData>({
        titulo: '',
        descripcion: '',
        prioridad: 'media',
        estado: 'pendiente',
        epica: '',
        sprint: '',
        asignado_a: '',
        horas_estimadas: '',
        horas_reales: ''
    });

    const [criteria, setCriteria] = useState<CriterionForm[]>([]);
    const [newCriterion, setNewCriterion] = useState('');

    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [epics, setEpics] = useState<Epic[]>([]);

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchContext = React.useCallback(async () => {
        try {
            if (!projectId) return;
            
            const [mRes, sRes, eRes] = await Promise.all([
                projectService.getMembers(projectId),
                sprintService.getByProject(projectId),
                epicService.getByProject(projectId)
            ]);
            setMembers(mRes.data);
            setSprints(sRes.data);
            setEpics(eRes.data);

            const currentUser = authService.getUser();
            if (!mRes.data.some((m: ProjectMember) => m.usuario === currentUser?.id)) {
                setError('Solo los miembros del proyecto pueden crear o editar historias.');
            }

            if (isEdit && storyId) {
                const storyRes = await storyService.getById(storyId);
                const story: UserStory = storyRes.data;
                setFormData({
                    titulo: story.titulo,
                    descripcion: story.descripcion,
                    prioridad: story.prioridad,
                    estado: story.estado,
                    epica: story.epica?.toString() || '',
                    sprint: story.sprint?.toString() || '',
                    asignado_a: story.asignado_a?.toString() || '',
                    horas_estimadas: story.horas_estimadas || '',
                    horas_reales: story.horas_reales || ''
                });
                setCriteria(story.criterios ? story.criterios.map((c: AcceptanceCriterion) => ({ 
                    id: c.id,
                    descripcion: c.descripcion, 
                    completado: c.completado 
                })) : []);
            }

        } catch (err: unknown) {
            console.error(err);
            setError('No se pudo cargar la información necesaria.');
        } finally {
            setFetching(false);
        }
    }, [projectId, storyId, isEdit]);

    useEffect(() => {
        fetchContext();
    }, [fetchContext]);

    const isMember = members.some(m => m.usuario === authService.getUser()?.id);

    const handleAddCriterion = () => {
        if (!newCriterion.trim()) return;
        setCriteria([...criteria, { descripcion: newCriterion, completado: false }]);
        setNewCriterion('');
    };

    const removeCriterion = (index: number) => {
        setCriteria(criteria.filter((_, i) => i !== index));
    };

    const toggleCriterion = (index: number) => {
        setCriteria(criteria.map((c, i) => i === index ? { ...c, completado: !c.completado } : c));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.titulo.trim()) {
            setError('El título es requerido');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            const payload: Partial<UserStory> = { 
                titulo: formData.titulo,
                descripcion: formData.descripcion,
                prioridad: formData.prioridad,
                estado: formData.estado,
                epica: formData.epica ? parseInt(formData.epica) : null,
                sprint: formData.sprint ? parseInt(formData.sprint) : null,
                asignado_a: formData.asignado_a ? parseInt(formData.asignado_a) : null,
                horas_estimadas: formData.horas_estimadas === '' ? 0 : Number(formData.horas_estimadas),
                horas_reales: formData.horas_reales === '' ? 0 : Number(formData.horas_reales),
                proyecto: projectId ? parseInt(projectId) : 0 
            };

            const fullPayload = {
                ...payload,
                criterios: criteria
            };

            if (isEdit && storyId) {
                await storyService.update(storyId, fullPayload as unknown as Partial<UserStory>);
                toast.success('Historia actualizada con éxito');
            } else {
                await storyService.create(fullPayload as unknown as Partial<UserStory>);
                toast.success('Historia creada con éxito');
            }
            navigate(`/project/${projectId}/work-items`);
        } catch (err: unknown) {
            console.error('Error saving HU:', err);
            if (axios.isAxiosError(err)) {
                const serverError = err.response?.data;
                if (!serverError) {
                    setError('Error de conexión con el servidor.');
                    return;
                }
                
                if (typeof serverError === 'string') {
                    setError(serverError);
                    return;
                }
                
                let errorMessage = 'Error de validación.';
                
                const extractFirstString = (obj: unknown): string | null => {
                    if (typeof obj === 'string') return obj;
                    if (Array.isArray(obj) && obj.length > 0) return extractFirstString(obj[0]);
                    if (typeof obj === 'object' && obj !== null) {
                        const values = Object.values(obj);
                        if (values.length > 0) return extractFirstString(values[0]);
                    }
                    return null;
                };

                const extracted = extractFirstString(serverError);
                errorMessage = extracted ? String(extracted) : JSON.stringify(serverError);
                setError(errorMessage);
            } else {
                setError('Error inesperado al guardar la historia.');
            }
        } finally {
            setLoading(false);
        }

    };

    if (fetching) {
        return (
            <ProjectLayout>
                <div className="flex items-center justify-center h-64 text-[#ADB5BD] font-black uppercase tracking-[0.3em] animate-pulse italic">
                    Preparando backlog...
                </div>
            </ProjectLayout>
        );
    }

    if (!isMember && !fetching) {
        return (
            <ProjectLayout>
                <div className="max-w-2xl mx-auto py-20 text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black text-[#1A1A1A] mb-4">Acceso Restringido</h2>
                    <p className="text-[#64748B] font-medium mb-8">No tienes permisos para modificar este proyecto. Solicita al dueño que te invite como colaborador.</p>
                    <button onClick={() => navigate(-1)} className="px-8 py-3 bg-[#1A1A1A] text-white rounded-xl font-bold hover:bg-black transition-all">
                        Volver
                    </button>
                </div>
            </ProjectLayout>
        );
    }

    return (
        <ProjectLayout>
            <div className="max-w-6xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 lg:mb-12">
                    <div>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-[10px] font-black text-[#10B981] uppercase tracking-widest italic mb-4 hover:translate-x-[-4px] transition-transform"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" /> Volver
                        </button>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1A1A1A] tracking-tighter leading-none mb-1 flex items-center gap-3">
                            {isEdit ? 'Refinando' : 'Nueva'} <span className="text-[#10B981]">Historia de Usuario</span> <FileText className="w-8 h-8 opacity-10" />
                        </h1>
                        <p className="text-[#64748B] text-[10px] sm:text-xs font-bold mt-2 uppercase tracking-widest italic opacity-70">
                            {isEdit ? 'Ajusta los requisitos técnicos y criterios de aceptación.' : 'Define un nuevo requerimiento para el equipo de desarrollo.'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                        {/* Content Card */}
                        <div className="bg-white border border-[#E9ECEF] rounded-[24px] lg:rounded-[32px] p-6 lg:p-10 shadow-sm space-y-6 lg:space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.2em] flex items-center gap-2 italic">
                                    <Activity className="w-3.5 h-3.5 text-[#10B981]" /> Título del requerimiento
                                </label>
                                <input
                                    type="text"
                                    placeholder="Como [usuario], quiero [acción] para [beneficio]..."
                                    className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl py-3 lg:py-4 px-5 lg:px-6 text-base lg:text-lg font-black text-[#1A1A1A] outline-none focus:ring-4 focus:ring-[#10B981]/10 focus:border-[#10B981] transition-all"
                                    value={formData.titulo}
                                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.2em] italic">Descripción Detallada</label>
                                <textarea
                                    rows={8}
                                    placeholder="Describe el contexto, las reglas de negocio y cualquier detalle técnico relevante..."
                                    className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl py-3 lg:py-4 px-5 lg:px-6 text-sm font-medium text-[#64748B] outline-none focus:ring-4 focus:ring-[#10B981]/10 focus:border-[#10B981] transition-all leading-relaxed"
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Acceptance Criteria Card */}
                        <div className="bg-white border border-[#E9ECEF] rounded-[24px] lg:rounded-[32px] p-6 lg:p-10 shadow-sm">
                            <h3 className="text-xs font-black text-[#1A1A1A] uppercase tracking-[0.2em] mb-6 lg:mb-8 flex items-center gap-2 italic">
                                <CheckSquare className="w-4 h-4 text-[#10B981]" /> Criterios de Aceptación
                            </h3>

                            <div className="flex items-center gap-3 mb-6 lg:mb-8">
                                <input
                                    type="text"
                                    placeholder="Añadir condición de éxito..."
                                    className="flex-1 bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl py-2.5 lg:py-3 px-4 lg:px-5 text-sm font-bold outline-none focus:border-[#10B981] transition-all"
                                    value={newCriterion}
                                    onChange={(e) => setNewCriterion(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCriterion())}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCriterion}
                                    className="p-2.5 lg:p-3 bg-[#10B981] text-white rounded-xl shadow-lg shadow-[#10B981]/20 hover:bg-[#059669] transition-all"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {criteria.map((c, i) => (
                                    <div key={i} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-[#F8F9FA] rounded-[16px] sm:rounded-[20px] group border border-transparent hover:border-[#10B981]/20 transition-all">
                                        <button
                                            type="button"
                                            onClick={() => toggleCriterion(i)}
                                            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${c.completado ? 'bg-[#10B981] border-[#10B981] text-white' : 'bg-white border-[#DEE2E6] text-transparent hover:border-[#10B981]'}`}
                                        >
                                            <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </button>
                                        <input
                                            type="text"
                                            className={`flex-1 bg-transparent border-none outline-none text-xs sm:text-sm font-bold ${c.completado ? 'line-through text-[#ADB5BD]' : 'text-[#1A1A1A]'}`}
                                            value={c.descripcion}
                                            onChange={(e) => {
                                                const newC = [...criteria];
                                                newC[i].descripcion = e.target.value;
                                                setCriteria(newC);
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeCriterion(i)}
                                            className="p-1.5 sm:p-2 text-[#ADB5BD] hover:text-red-500 lg:opacity-0 lg:group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </button>
                                    </div>
                                ))}
                                {criteria.length === 0 && (
                                    <div className="text-center py-8 lg:py-10 text-[#ADB5BD] text-[10px] sm:text-xs font-bold italic border-2 border-dashed border-[#DEE2E6] rounded-[24px]">
                                        No se han definido criterios. La historia no podrá ser validada.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Configuration Column */}
                    <div className="space-y-6 lg:space-y-8">
                        <div className="bg-[#1A1A1A] rounded-[32px] p-8 text-white space-y-8 relative overflow-hidden group shadow-2xl">
                            <Activity className="absolute -top-10 -left-10 w-48 h-48 text-white/5 group-hover:scale-110 transition-transform duration-700" />
                            <h3 className="text-[11px] font-black text-white/50 uppercase tracking-[0.3em] italic mb-8 relative z-10">Configuración Técnica</h3>

                            <div className="space-y-8 relative z-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2 italic">
                                        <AlertCircle className="w-4 h-4 text-[#10B981]" /> PRIORIDAD
                                    </label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all appearance-none cursor-pointer"
                                        value={formData.prioridad}
                                        onChange={(e) => setFormData({ ...formData, prioridad: e.target.value as Priority })}
                                    >
                                        <option value="baja" className="text-black">Baja</option>
                                        <option value="media" className="text-black">Media</option>
                                        <option value="alta" className="text-black">Alta</option>
                                    </select>
                                </div>

                                {isEdit && (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2 italic">
                                            <Activity className="w-4 h-4 text-[#10B981]" /> ESTADO
                                        </label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all appearance-none cursor-pointer"
                                            value={formData.estado}
                                            onChange={(e) => setFormData({ ...formData, estado: e.target.value as ItemStatus })}
                                        >
                                            <option value="pendiente" className="text-black">Pendiente</option>
                                            <option value="en progreso" className="text-black">En Progreso</option>
                                            <option value="en pruebas" className="text-black">En Pruebas</option>
                                            <option value="terminado" className="text-black">Terminado</option>
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2 italic">
                                        <UserIcon className="w-4 h-4 text-[#10B981]" /> RESPONSABLE
                                    </label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all appearance-none cursor-pointer"
                                        value={formData.asignado_a}
                                        onChange={(e) => setFormData({ ...formData, asignado_a: e.target.value })}
                                    >
                                        <option value="" className="text-black">Sin asignar</option>
                                        {members.map(m => (
                                            <option key={m.usuario} value={m.usuario} className="text-black">{m.usuario_detalle.username}</option>
                                        ))}
                                    </select>
                                </div>

                                {isEdit && (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2 italic">
                                            <Clock className="w-4 h-4 text-[#10B981]" /> SPRINT / ITERACIÓN
                                        </label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all appearance-none cursor-pointer"
                                            value={formData.sprint}
                                            onChange={(e) => setFormData({ ...formData, sprint: e.target.value })}
                                        >
                                            <option value="" className="text-black">Backlog general</option>
                                            {sprints.map(s => (
                                                <option key={s.id} value={s.id} className="text-black">{s.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2 italic">
                                        <Target className="w-4 h-4 text-[#10B981]" /> ÉPICA RELACIONADA
                                    </label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all appearance-none cursor-pointer"
                                        value={formData.epica}
                                        onChange={(e) => setFormData({ ...formData, epica: e.target.value })}
                                    >
                                        <option value="" className="text-black">Sin épica asociada</option>
                                        {epics.map(e => (
                                            <option key={e.id} value={e.id} className="text-black">{e.titulo}</option>
                                        ))}

                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2 italic">
                                            <Clock className="w-4 h-4 text-[#10B981]" /> EST. (HRS)
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
                                            value={formData.horas_estimadas}
                                            onChange={(e) => setFormData({ ...formData, horas_estimadas: e.target.value === '' ? '' : Number(e.target.value) })}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2 italic">
                                            <Activity className="w-4 h-4 text-[#10B981]" /> REAL (HRS)
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
                                            value={formData.horas_reales}
                                            onChange={(e) => setFormData({ ...formData, horas_reales: e.target.value === '' ? '' : Number(e.target.value) })}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Save Banner */}
                        <div className="space-y-4">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-[10px] font-black uppercase tracking-widest italic animate-in slide-in-from-top-2">
                                    <AlertCircle className="w-4 h-4" /> {error}
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#10B981] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#10B981]/20 hover:bg-[#059669] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 italic"
                            >
                                {loading ? 'Sincronizando...' : (
                                    <>
                                        <Save className="w-4 h-4" /> {isEdit ? 'Actualizar Historia' : 'Completar Registro'}
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="w-full py-4 text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] hover:text-[#1A1A1A] transition-all italic text-center"
                            >
                                Cancelar y volver
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </ProjectLayout>
    );
};

export default StoryFormPage;

