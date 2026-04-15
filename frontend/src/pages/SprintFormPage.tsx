import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProjectLayout from '../components/ProjectLayout';
import { sprintService } from '../services/api';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { 
    Flag, 
    Calendar, 
    Target, 
    Save, 
    X, 
    ChevronLeft,
    Loader2,
    Palette
} from 'lucide-react';

interface SprintFormData {
    nombre: string;
    objetivo: string;
    fecha_inicio: string;
    fecha_fin: string;
    estado: 'planeado' | 'activo' | 'terminado';
    proyecto: number;
    color: string;
}

const SprintFormPage: React.FC = () => {
    const { projectId, sprintId } = useParams<{ projectId: string, sprintId?: string }>();
    const navigate = useNavigate();
    const isEditing = !!sprintId;

    const [formData, setFormData] = useState<SprintFormData>({
        nombre: '',
        objetivo: '',
        fecha_inicio: '',
        fecha_fin: '',
        estado: 'planeado',
        proyecto: projectId ? parseInt(projectId) : 0,
        color: '#10B981'
    });

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditing);

    useEffect(() => {
        if (isEditing && sprintId) {
            setFetching(true);
            sprintService.getById(sprintId)
                .then(res => {
                    const data = res.data;
                    setFormData({
                        nombre: data.nombre,
                        objetivo: data.objetivo,
                        fecha_inicio: data.fecha_inicio,
                        fecha_fin: data.fecha_fin,
                        estado: data.estado as 'planeado' | 'activo' | 'terminado',
                        proyecto: data.proyecto,
                        color: data.color || '#10B981'
                    });
                })
                .catch(err => {
                    console.error(err);
                    toast.error('Error al cargar el sprint');
                    navigate(`/project/${projectId}/sprints`);
                })
                .finally(() => setFetching(false));
        }
    }, [isEditing, sprintId, projectId, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Validation: Sprint duration must not exceed 1 month (approx 30 days)
        const start = new Date(formData.fecha_inicio);
        const end = new Date(formData.fecha_fin);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 30) {
            toast.error('Un sprint no puede durar más de un mes (30 días)');
            setLoading(false);
            return;
        }

        try {
            if (isEditing && sprintId) {
                await sprintService.update(sprintId, formData);
                toast.success('Sprint actualizado con éxito');
            } else {
                await sprintService.create(formData);
                toast.success('Sprint creado con éxito');
            }
            navigate(`/project/${projectId}/sprints`);
        } catch (error: unknown) {
            console.error(error);
            let errorMsg = 'Error al guardar el sprint';
            if (axios.isAxiosError(error)) {
                errorMsg = error.response?.data?.error || error.response?.data?.detail || errorMsg;
            }
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <ProjectLayout>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-12 h-12 text-[#10B981] animate-spin" />
                </div>
            </ProjectLayout>
        );
    }

    return (
        <ProjectLayout>
            <div className="max-w-4xl mx-auto space-y-10 lg:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <button 
                            onClick={() => navigate(`/project/${projectId}/sprints`)}
                            className="flex items-center gap-2 text-[#64748B] hover:text-[#10B981] text-[10px] font-black uppercase tracking-widest transition-all mb-4 group"
                        >
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver a Sprints
                        </button>
                        <h1 className="text-3xl lg:text-4xl font-black text-[#1A1A1A] tracking-tighter flex items-center gap-3">
                            {isEditing ? 'Editar Sprint' : 'Nuevo Sprint'} <Flag className="w-8 h-8 text-[#10B981]" />
                        </h1>
                        <p className="text-[10px] lg:text-xs text-[#64748B] font-black italic uppercase tracking-[0.2em] opacity-70 mt-2">
                            {isEditing ? 'Ajusta la planificación de tu ciclo' : 'Define los objetivos de la próxima iteración'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white border border-[#E9ECEF] rounded-[40px] shadow-sm overflow-hidden">
                    <div className="p-8 lg:p-12 space-y-10">
                        {/* Nombre del Sprint */}
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B] ml-1">
                                <span className="w-6 h-6 rounded-lg bg-emerald-50 text-[#10B981] flex items-center justify-center text-[10px]">01</span>
                                Título de la Iteración
                            </label>
                            <input 
                                required
                                type="text" 
                                placeholder="Ej: Sprint 1 - Core Backend Development"
                                className="w-full px-8 py-5 bg-[#F8F9FA] border border-transparent rounded-[24px] focus:bg-white focus:border-[#10B981]/30 focus:ring-4 focus:ring-[#10B981]/5 transition-all outline-none text-lg font-black tracking-tight placeholder:opacity-30"
                                value={formData.nombre}
                                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                            />
                        </div>

                        {/* Objetivo del Sprint */}
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B] ml-1">
                                <span className="w-6 h-6 rounded-lg bg-emerald-50 text-[#10B981] flex items-center justify-center text-[10px]">02</span>
                                <Target className="w-4 h-4" /> Objetivo Estratégico
                            </label>
                            <textarea 
                                required
                                rows={4}
                                placeholder="Describe qué quieres lograr en este periodo de tiempo..."
                                className="w-full px-8 py-5 bg-[#F8F9FA] border border-transparent rounded-[24px] focus:bg-white focus:border-[#10B981]/30 transition-all outline-none font-medium leading-relaxed resize-none"
                                value={formData.objetivo}
                                onChange={(e) => setFormData({...formData, objetivo: e.target.value})}
                            ></textarea>
                        </div>

                        {/* Fechas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B] ml-1">
                                    <Calendar className="w-4 h-4" /> Fecha de Inicio
                                </label>
                                <input 
                                    required
                                    type="date" 
                                    className="w-full px-8 py-5 bg-[#F8F9FA] border border-transparent rounded-[24px] focus:bg-white focus:border-[#10B981]/30 transition-all outline-none font-black text-sm"
                                    value={formData.fecha_inicio}
                                    onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B] ml-1">
                                    <Calendar className="w-4 h-4 text-red-500" /> Fecha de Finalización
                                </label>
                                <input 
                                    required
                                    type="date" 
                                    className="w-full px-8 py-5 bg-[#F8F9FA] border border-transparent rounded-[24px] focus:bg-white focus:border-[#10B981]/30 transition-all outline-none font-black text-sm"
                                    value={formData.fecha_fin}
                                    onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Estado */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B] ml-1">
                                    Estado Actual
                                </label>
                                <div className="flex flex-wrap gap-4">
                                    {['planeado', 'activo', 'terminado'].map((status) => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => setFormData({...formData, estado: status as 'planeado' | 'activo' | 'terminado'})}
                                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                                formData.estado === status 
                                                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xl' 
                                                    : 'bg-white text-[#64748B] border-[#E9ECEF] hover:border-[#10B981]'
                                            }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B] ml-1">
                                    <Palette className="w-4 h-4" /> Color Distintivo
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#1A1A1A'].map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setFormData({...formData, color: c})}
                                            className={`w-10 h-10 rounded-xl border-2 transition-all ${
                                                formData.color === c 
                                                    ? 'scale-110 shadow-lg' 
                                                    : 'opacity-50 hover:opacity-100'
                                            }`}
                                            style={{ backgroundColor: c, borderColor: formData.color === c ? 'white' : 'transparent' }}
                                        />
                                    ))}
                                    <input 
                                        type="color" 
                                        value={formData.color}
                                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                                        className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border-none p-0 overflow-hidden"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 lg:p-12 bg-[#F8F9FA]/50 border-t border-[#E9ECEF] flex flex-col sm:flex-row items-center justify-between gap-6">
                        <button 
                            type="button"
                            onClick={() => navigate(`/project/${projectId}/sprints`)}
                            className="flex items-center gap-2 text-xs font-black text-[#64748B] hover:text-[#1A1A1A] uppercase tracking-widest transition-all"
                        >
                            <X className="w-4 h-4" /> Cancelar Operación
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto px-12 py-5 bg-[#10B981] text-white rounded-[24px] text-xs font-black uppercase tracking-[0.2em] hover:bg-[#059669] shadow-xl shadow-[#10B981]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            {isEditing ? 'Confirmar Cambios' : 'Desplegar Sprint'}
                        </button>
                    </div>
                </form>
            </div>
        </ProjectLayout>
    );
};

export default SprintFormPage;
