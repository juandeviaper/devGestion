import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ChevronLeft,
    Save,
    Target,
    Activity,
    AlertCircle
} from 'lucide-react';
import ProjectLayout from '../components/ProjectLayout';
import { epicService } from '../services/api';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface EpicFormData {
    titulo: string;
    descripcion: string;
    estado: 'pendiente' | 'en progreso' | 'terminado';
}

const EpicFormPage: React.FC = () => {
    const { projectId, epicId } = useParams<{ projectId: string, epicId: string }>();
    const navigate = useNavigate();
    const isEdit = !!epicId;

    const [formData, setFormData] = useState<EpicFormData>({
        titulo: '',
        descripcion: '',
        estado: 'pendiente'
    });

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [error, setError] = useState<string | null>(null);

    const fetchEpic = React.useCallback(async () => {
        if (isEdit && epicId) {
            try {
                setFetching(true);
                const res = await epicService.getById(epicId);
                setFormData({
                    titulo: res.data.titulo,
                    descripcion: res.data.descripcion,
                    estado: res.data.estado
                });
            } catch (err: unknown) {
                console.error(err);
                setError('No se pudo cargar la épica.');
            } finally {
                setFetching(false);
            }
        }
    }, [isEdit, epicId]);

    useEffect(() => {
        fetchEpic();
    }, [fetchEpic]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.titulo.trim()) {
            setError('El título es requerido');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const payload = { ...formData, proyecto: projectId ? parseInt(projectId) : undefined };

            if (isEdit && epicId) {
                await epicService.update(epicId, payload);
                toast.success('Épica actualizada');
            } else {
                await epicService.create(payload);
                toast.success('Épica creada');
            }

            navigate(`/project/${projectId}/work-items`);
        } catch (err: unknown) {
            console.error(err);
            let errorMsg = 'Error al guardar la épica.';
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
                    Cargando épica...
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
                            {isEdit ? 'Editando' : 'Nueva'} <span className="text-orange-500">Épica</span> <Target className="w-8 h-8 opacity-10" />
                        </h1>
                        <p className="text-[#64748B] text-[10px] sm:text-xs font-bold mt-2 uppercase tracking-widest italic opacity-70">
                            Las épicas representan grandes bloques de funcionalidad.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6 sm:space-y-8">
                    <div className="bg-white border border-[#E9ECEF] rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 lg:p-10 shadow-sm space-y-6 sm:space-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.2em] flex items-center gap-2 italic">
                                <Activity className="w-3.5 h-3.5 text-orange-500" /> Título de la Épica
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: Rediseño de la pasarela de pagos"
                                className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl py-3 sm:py-4 px-5 sm:px-6 text-base sm:text-lg font-black text-[#1A1A1A] outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                                value={formData.titulo}
                                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.2em] italic">Descripción</label>
                            <textarea
                                rows={6}
                                placeholder="Define el alcance y los objetivos de esta épica..."
                                className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl py-3 sm:py-4 px-5 sm:px-6 text-sm font-medium text-[#64748B] outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all leading-relaxed"
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            />
                        </div>

                        <div className="w-full sm:w-1/2 lg:w-1/3 space-y-2">
                            <label className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.2em] italic">Estado</label>
                            <select
                                className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl py-3 px-5 sm:px-6 text-sm font-bold text-[#1A1A1A] outline-none focus:border-orange-500 transition-all"
                                value={formData.estado}
                                onChange={(e) => setFormData({ ...formData, estado: e.target.value as 'pendiente' | 'en progreso' | 'terminado' })}
                            >
                                <option value="pendiente">Pendiente</option>
                                <option value="en progreso">En Progreso</option>
                                <option value="terminado">Terminado</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-orange-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 hover:bg-orange-600 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 italic order-1 sm:order-2"
                        >
                            <Save className="w-4 h-4" /> {loading ? 'Guardando...' : 'Guardar Épica'}
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

export default EpicFormPage;
