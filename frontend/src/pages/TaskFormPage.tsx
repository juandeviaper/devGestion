import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ChevronLeft,
    Save,
    ClipboardCheck,
    AlertCircle,
    Activity,
    FileText,
} from 'lucide-react';

import ProjectLayout from '../components/ProjectLayout';
import { taskService, projectService, storyService } from '../services/api';
import type { ProjectMember, UserStory } from '../types';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface TaskFormData {
    titulo: string;
    descripcion: string;
    prioridad: 'baja' | 'media' | 'alta';
    estado: 'pendiente' | 'en progreso' | 'terminado';
    historia: string | number;
    asignado_a: string | number;
    horas_estimadas: number | '';
    horas_reales: number | '';
}

const TaskFormPage: React.FC = () => {
    const { projectId, taskId } = useParams<{ projectId: string, taskId: string }>();
    const navigate = useNavigate();
    const isEdit = !!taskId;

    const [formData, setFormData] = useState<TaskFormData>({
        titulo: '',
        descripcion: '',
        prioridad: 'media',
        estado: 'pendiente',
        historia: '',
        asignado_a: '',
        horas_estimadas: '',
        horas_reales: ''
    });

    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [stories, setStories] = useState<UserStory[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchContext = React.useCallback(async () => {
        try {
            if (!projectId) return;
            const [mRes, sRes] = await Promise.all([
                projectService.getMembers(projectId),
                storyService.getByProject(projectId)
            ]);
            setMembers(mRes.data);
            setStories(sRes.data);

            if (isEdit && taskId) {
                const taskRes = await taskService.getById(taskId);
                const task = taskRes.data;

                setFormData({
                    titulo: task.titulo,
                    descripcion: task.descripcion || '',
                    prioridad: task.prioridad,
                    estado: task.estado,
                    historia: task.historia || '',
                    asignado_a: task.asignado_a || '',
                    horas_estimadas: task.horas_estimadas || '',
                    horas_reales: task.horas_reales || ''
                });
            }
        } catch (err: unknown) {
            console.error(err);
            setError('No se pudo cargar el contexto de la tarea.');
        } finally {
            setFetching(false);
        }
    }, [projectId, taskId, isEdit]);

    useEffect(() => {
        fetchContext();
    }, [fetchContext]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.titulo.trim()) {
            setError('El título es requerido');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const payload = { 
                ...formData, 
                proyecto: projectId ? parseInt(projectId) : undefined,
                historia: formData.historia ? parseInt(formData.historia.toString()) : null,
                asignado_a: formData.asignado_a ? parseInt(formData.asignado_a.toString()) : null,
                horas_estimadas: formData.horas_estimadas === '' ? 0 : Number(formData.horas_estimadas),
                horas_reales: formData.horas_reales === '' ? 0 : Number(formData.horas_reales)
            };

            if (isEdit && taskId) {
                await taskService.update(taskId, payload);
                toast.success('Tarea actualizada');
            } else {
                await taskService.create(payload);
                toast.success('Tarea creada');
            }
            navigate(`/project/${projectId}/work-items`);
        } catch (err: unknown) {
            console.error(err);
            let errorMsg = 'Error al guardar la tarea.';
            if (axios.isAxiosError(err)) {
                errorMsg = err.response?.data?.error || err.response?.data?.detail || errorMsg;
            }
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <ProjectLayout>
                <div className="flex items-center justify-center h-64 text-[#ADB5BD] font-black uppercase tracking-[0.3em] animate-pulse italic">
                    Organizando tareas...
                </div>
            </ProjectLayout>
        );
    }

    return (
        <ProjectLayout>
            <div className="max-w-4xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 lg:mb-12">
                    <div>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-[10px] font-black text-[#10B981] uppercase tracking-widest italic mb-4 hover:translate-x-[-4px] transition-transform"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" /> Volver
                        </button>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1A1A1A] tracking-tighter leading-none mb-1 flex items-center gap-3">
                            {isEdit ? 'Refinando' : 'Nueva'} <span className="text-emerald-500">Tarea</span> <ClipboardCheck className="w-8 h-8 opacity-10" />
                        </h1>
                        <p className="text-[#64748B] text-[10px] sm:text-xs font-bold mt-2 uppercase tracking-widest italic opacity-70">
                            Divide el trabajo en acciones concretas y ejecutables.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6 lg:space-y-8">
                    <div className="bg-white border border-[#E9ECEF] rounded-[24px] lg:rounded-[32px] p-6 lg:p-10 shadow-sm space-y-6 lg:space-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.2em] flex items-center gap-2 italic">
                                <Activity className="w-3.5 h-3.5 text-emerald-500" /> Título de la Tarea
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: Implementar validación de email en backend"
                                className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl py-3 lg:py-4 px-5 lg:px-6 text-base lg:text-lg font-black text-[#1A1A1A] outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                                value={formData.titulo}
                                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.2em] italic">Descripción</label>
                            <textarea
                                rows={6}
                                placeholder="Detalla los pasos técnicos o requisitos..."
                                className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl py-3 lg:py-4 px-5 lg:px-6 text-sm font-medium text-[#64748B] outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all leading-relaxed"
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.2em] italic text-emerald-500">Prioridad</label>
                                    <select
                                        className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl py-3 px-5 text-sm font-bold text-[#1A1A1A] outline-none focus:border-emerald-500 transition-all"
                                        value={formData.prioridad}
                                        onChange={(e) => setFormData({ ...formData, prioridad: e.target.value as 'baja' | 'media' | 'alta' })}
                                    >
                                    <option value="baja">Baja</option>
                                    <option value="media">Media</option>
                                    <option value="alta">Alta</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.2em] italic">Estado</label>
                                    <select
                                        className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl py-3 px-5 text-sm font-bold text-[#1A1A1A] outline-none focus:border-emerald-500 transition-all"
                                        value={formData.estado}
                                        onChange={(e) => setFormData({ ...formData, estado: e.target.value as 'pendiente' | 'en progreso' | 'terminado' })}
                                    >
                                    <option value="pendiente">Pendiente</option>
                                    <option value="en progreso">En Progreso</option>
                                    <option value="terminado">Terminado</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.2em] italic">Est. Horas</label>
                                <input
                                    type="number"
                                    className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl py-3 px-5 text-sm font-bold text-[#1A1A1A] outline-none focus:border-emerald-500 transition-all"
                                    value={formData.horas_estimadas}
                                    onChange={(e) => setFormData({ ...formData, horas_estimadas: e.target.value === '' ? '' : Number(e.target.value) })}
                                    placeholder="0"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.2em] italic">Horas Reales</label>
                                <input
                                    type="number"
                                    className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl py-3 px-5 text-sm font-bold text-[#1A1A1A] outline-none focus:border-emerald-500 transition-all"
                                    value={formData.horas_reales}
                                    onChange={(e) => setFormData({ ...formData, horas_reales: e.target.value === '' ? '' : Number(e.target.value) })}
                                    placeholder="0"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.2em] italic">Responsable</label>
                                <select
                                    className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl py-3 px-5 text-sm font-bold text-[#1A1A1A] outline-none focus:border-emerald-500 transition-all"
                                    value={formData.asignado_a}
                                    onChange={(e) => setFormData({ ...formData, asignado_a: e.target.value })}
                                >
                                    <option value="">Sin asignar</option>
                                    {members.map(m => (
                                        <option key={m.usuario} value={m.usuario}>{m.usuario_detalle.username}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="sm:col-span-2 lg:col-span-3 space-y-2">
                                <label className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.2em] flex items-center gap-2 italic">
                                    <FileText className="w-3.5 h-3.5 text-emerald-500" /> Historia de Usuario Relacionada (Opcional)
                                </label>
                                <select
                                    className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl py-3 px-5 text-sm font-bold text-[#1A1A1A] outline-none focus:border-emerald-500 transition-all"
                                    value={formData.historia}
                                    onChange={(e) => setFormData({ ...formData, historia: e.target.value })}
                                >
                                    <option value="">Ninguna</option>
                                    {stories.map(s => (
                                        <option key={s.id} value={s.id}>{s.titulo}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 italic order-1 sm:order-2"
                        >
                            <Save className="w-4 h-4" /> {loading ? 'Sincronizando...' : (isEdit ? 'Actualizar Tarea' : 'Guardar Tarea')}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-8 py-4 text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] hover:text-[#1A1A1A] transition-all italic text-center order-2 sm:order-1"
                        >
                            Cancelar
                        </button>
                    </div>
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-[10px] font-black uppercase tracking-widest italic animate-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}
                </form>
            </div>
        </ProjectLayout>
    );
};

export default TaskFormPage;
