import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ChevronLeft,
    Save,
    Bug as BugIcon,
    AlertCircle,
    Activity,
    Clock,
    User as UserIcon
} from 'lucide-react';
import ProjectLayout from '../components/ProjectLayout';
import { bugService, projectService, sprintService } from '../services/api';
import type { ProjectMember, Sprint, BugStatus } from '../types';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface BugFormData {
    titulo: string;
    descripcion: string;
    prioridad: 'baja' | 'media' | 'alta';
    estado: BugStatus;
    sprint: string | number;
    asignado_a: string | number;
    horas_estimadas: number | '';
    horas_reales: number | '';
}

const BugFormPage: React.FC = () => {
    const { projectId, bugId } = useParams<{ projectId: string, bugId: string }>();
    const navigate = useNavigate();
    const isEdit = !!bugId;

    const [formData, setFormData] = useState<BugFormData>({
        titulo: '',
        descripcion: '',
        prioridad: 'media',
        estado: 'nuevo',
        sprint: '',
        asignado_a: '',
        horas_estimadas: '',
        horas_reales: ''
    });

    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchContext = React.useCallback(async () => {
        try {
            if (!projectId) return;
            const [mRes, sRes] = await Promise.all([
                projectService.getMembers(projectId),
                sprintService.getByProject(projectId)
            ]);
            setMembers(mRes.data);
            setSprints(sRes.data);

            if (isEdit && bugId) {
                const bugRes = await bugService.getById(bugId);
                const bug = bugRes.data;
                setFormData({
                    titulo: bug.titulo,
                    descripcion: bug.descripcion,
                    prioridad: bug.prioridad,
                    estado: bug.estado,
                    sprint: bug.sprint || '',
                    asignado_a: bug.asignado_a || '',
                    horas_estimadas: bug.horas_estimadas || '',
                    horas_reales: bug.horas_reales || ''
                });
            }
        } catch (err: unknown) {
            console.error(err);
            setError('No se pudo cargar el contexto del bug.');
        } finally {
            setFetching(false);
        }
    }, [projectId, bugId, isEdit]);

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
                sprint: formData.sprint ? parseInt(formData.sprint.toString()) : null,
                asignado_a: formData.asignado_a ? parseInt(formData.asignado_a.toString()) : null,
                horas_estimadas: formData.horas_estimadas === '' ? 0 : Number(formData.horas_estimadas),
                horas_reales: formData.horas_reales === '' ? 0 : Number(formData.horas_reales)
            };

            if (isEdit && bugId) {
                await bugService.update(bugId, payload);
                toast.success('Bug actualizado');
            } else {
                await bugService.create(payload);
                toast.success('Bug reportado');
            }
            navigate(`/project/${projectId}/work-items`);
        } catch (err: unknown) {
            console.error(err);
            let errorMsg = 'Error al guardar el bug.';
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
                    Analizando reporte de error...
                </div>
            </ProjectLayout>
        );
    }

    return (
        <ProjectLayout>
            <div className="max-w-6xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 lg:mb-12">
                    <div>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-[10px] font-black text-[#10B981] uppercase tracking-widest italic mb-4 hover:translate-x-[-4px] transition-transform"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" /> Volver
                        </button>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1A1A1A] tracking-tighter leading-none mb-1 flex items-center gap-3">
                            {isEdit ? 'Corrigiendo' : 'Nuevo'} <span className="text-red-500">Bug</span> <BugIcon className="w-8 h-8 opacity-10" />
                        </h1>
                        <p className="text-[#64748B] text-[10px] sm:text-xs font-bold mt-2 uppercase tracking-widest italic opacity-70">
                            Reporta un error o comportamiento inesperado en el sistema.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                        <div className="bg-white border border-[#E9ECEF] rounded-[24px] lg:rounded-[32px] p-6 lg:p-10 shadow-sm space-y-6 lg:space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.2em] flex items-center gap-2 italic">
                                    <AlertCircle className="w-3.5 h-3.5 text-red-500" /> Título del Error
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: El botón de guardado no responde en Safari"
                                    className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl py-3 lg:py-4 px-5 lg:px-6 text-base lg:text-lg font-black text-[#1A1A1A] outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all"
                                    value={formData.titulo}
                                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.2em] italic">Descripción y Pasos para Reproducir</label>
                                <textarea
                                    rows={10}
                                    placeholder="Describe detalladamente el error y los pasos necesarios para visualizarlo..."
                                    className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl py-3 lg:py-4 px-5 lg:px-6 text-sm font-medium text-[#64748B] outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all leading-relaxed"
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 lg:space-y-8">
                        <div className="bg-[#1A1A1A] rounded-[24px] lg:rounded-[32px] p-6 lg:p-8 text-white space-y-6 lg:space-y-8 relative overflow-hidden group">
                            <BugIcon className="absolute -top-10 -left-10 w-48 h-48 text-white/5 group-hover:scale-110 transition-transform duration-700" />
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] italic mb-2">Clasificación</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6 relative z-10">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-white/30 uppercase tracking-widest flex items-center gap-1.5"><AlertCircle className="w-3 h-3 text-red-500" /> Prioridad</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:border-red-500 transition-all"
                                        value={formData.prioridad}
                                        onChange={(e) => setFormData({ ...formData, prioridad: e.target.value as 'baja' | 'media' | 'alta' })}
                                    >
                                        <option value="baja" className="text-black">Baja</option>
                                        <option value="media" className="text-black">Media</option>
                                        <option value="alta" className="text-black">Alta</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-white/30 uppercase tracking-widest flex items-center gap-1.5"><Activity className="w-3 h-3 text-red-500" /> Estado</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:border-red-500 transition-all"
                                        value={formData.estado}
                                        onChange={(e) => setFormData({ ...formData, estado: e.target.value as BugStatus })}
                                    >
                                        <option value="nuevo" className="text-black">Nuevo</option>
                                        <option value="en progreso" className="text-black">En Progreso</option>
                                        <option value="corregido" className="text-black">Corregido</option>
                                        <option value="cerrado" className="text-black">Cerrado</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-white/30 uppercase tracking-widest flex items-center gap-1.5"><UserIcon className="w-3 h-3 text-red-500" /> Responsable</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:border-red-500 transition-all"
                                        value={formData.asignado_a}
                                        onChange={(e) => setFormData({ ...formData, asignado_a: e.target.value })}
                                    >
                                        <option value="" className="text-black">Sin asignar</option>
                                        {members.map(m => (
                                            <option key={m.usuario} value={m.usuario} className="text-black">{m.usuario_detalle.username}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-white/30 uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3 h-3 text-red-500" /> Sprint</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:border-red-500 transition-all"
                                        value={formData.sprint}
                                        onChange={(e) => setFormData({ ...formData, sprint: e.target.value })}
                                    >
                                        <option value="" className="text-black">No asignado</option>
                                        {sprints.map(s => (
                                            <option key={s.id} value={s.id} className="text-black">{s.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-white/30 uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3 h-3 text-red-500" /> Est (hrs)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs font-bold text-white outline-none focus:border-red-500 transition-all"
                                            value={formData.horas_estimadas}
                                            onChange={(e) => setFormData({ ...formData, horas_estimadas: e.target.value === '' ? '' : Number(e.target.value) })}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-white/30 uppercase tracking-widest flex items-center gap-1.5"><Activity className="w-3 h-3 text-red-500" /> Real (hrs)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs font-bold text-white outline-none focus:border-red-500 transition-all"
                                            value={formData.horas_reales}
                                            onChange={(e) => setFormData({ ...formData, horas_reales: e.target.value === '' ? '' : Number(e.target.value) })}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-[10px] font-black uppercase tracking-widest italic animate-in slide-in-from-top-2">
                                    <AlertCircle className="w-4 h-4" /> {error}
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-red-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 hover:bg-red-600 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 italic"
                            >
                                {loading ? 'Sincronizando...' : (
                                    <>
                                        <Save className="w-4 h-4" /> {isEdit ? 'Actualizar Bug' : 'Reportar Bug'}
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

export default BugFormPage;
