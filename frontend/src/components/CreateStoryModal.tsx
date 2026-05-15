import React, { useState, useEffect } from 'react';
import {
    X,
    ChevronRight,
    FileText,
    AlertCircle,
    Layout,
    User,
    Zap,
    Target
} from 'lucide-react';
import { storyService } from '../services/api';
import axios from 'axios';
import type { Priority, StorySize } from '../types';

interface CreateStoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onStoryCreated?: () => void;
}

const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ isOpen, onClose, projectId, onStoryCreated }) => {
    const [formData, setFormData] = useState<{
        titulo: string;
        rol: string;
        necesidad: string;
        beneficio: string;
        puntos: number;
        prioridad: Priority;
        talla: StorySize | null;
    }>({
        titulo: '',
        rol: '',
        necesidad: '',
        beneficio: '',
        puntos: 0,
        prioridad: 'media',
        talla: null,
    });
    
    const [preview, setPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const text = `Yo como ${formData.rol || '[rol]'}, quiero ${formData.necesidad || '[funcionalidad]'}, para ${formData.beneficio || '[beneficio]'}.`;
        setPreview(text);
    }, [formData.rol, formData.necesidad, formData.beneficio]);

    const handleSubmit = async () => {
        if (!formData.titulo.trim() || !formData.rol.trim() || !formData.necesidad.trim() || !formData.beneficio.trim()) {
            setError('Todos los campos del formato Scrum son obligatorios.');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await storyService.create({
                ...formData,
                descripcion: preview,
                proyecto: Number(projectId)
            });
            if (onStoryCreated) onStoryCreated();
            onClose();
            setFormData({ 
                titulo: '', 
                rol: '', 
                necesidad: '', 
                beneficio: '', 
                puntos: 0, 
                prioridad: 'media',
                talla: null 
            });
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.detail || 'Error al crear la historia.');
            } else {
                setError('Error inesperado al crear la historia.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0F172A]/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-[#E9ECEF] animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 bg-[#0F172A] text-white flex justify-between items-center relative">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#10B981] rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-[#0F172A]" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight uppercase tracking-widest">Nueva Historia de Usuario</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Título Principal */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#ADB5BD] uppercase tracking-widest flex items-center gap-2">
                            <Layout className="w-3 h-3" /> Título de la Historia
                        </label>
                        <input
                            type="text"
                            placeholder="Ej. Registro de usuarios con Google"
                            className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] outline-none transition-all font-bold text-[#1A1A1A]"
                            value={formData.titulo}
                            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                        />
                    </div>

                    {/* Formato Scrum Grid */}
                    <div className="grid grid-cols-1 gap-4 bg-[#F8F9FA] p-6 rounded-2xl border border-[#DEE2E6]">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#10B981] uppercase tracking-widest flex items-center gap-2">
                                <User className="w-3 h-3" /> Yo como... (Rol)
                            </label>
                            <input
                                type="text"
                                placeholder="Ej. Administrador"
                                className="w-full bg-white border border-[#DEE2E6] rounded-xl py-2 px-4 focus:border-[#10B981] outline-none transition-all text-sm"
                                value={formData.rol}
                                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#10B981] uppercase tracking-widest flex items-center gap-2">
                                <Zap className="w-3 h-3" /> Quiero... (Necesidad/Funcionalidad)
                            </label>
                            <textarea
                                rows={2}
                                placeholder="Ej. ver un dashboard de métricas"
                                className="w-full bg-white border border-[#DEE2E6] rounded-xl py-2 px-4 focus:border-[#10B981] outline-none transition-all text-sm"
                                value={formData.necesidad}
                                onChange={(e) => setFormData({ ...formData, necesidad: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#10B981] uppercase tracking-widest flex items-center gap-2">
                                <Target className="w-3 h-3" /> Para... (Beneficio/Valor)
                            </label>
                            <textarea
                                rows={2}
                                placeholder="Ej. tomar decisiones informadas sobre el progreso"
                                className="w-full bg-white border border-[#DEE2E6] rounded-xl py-2 px-4 focus:border-[#10B981] outline-none transition-all text-sm"
                                value={formData.beneficio}
                                onChange={(e) => setFormData({ ...formData, beneficio: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="p-4 bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl">
                        <label className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest block mb-2">Vista Previa Scrum</label>
                        <p className="text-sm text-[#0F172A] italic">"{preview}"</p>
                    </div>

                    {/* Selectors Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#ADB5BD] uppercase tracking-widest">Story Points</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl py-2 px-4 focus:border-[#10B981] outline-none transition-all text-sm font-bold"
                                value={formData.puntos}
                                onChange={(e) => setFormData({ ...formData, puntos: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#ADB5BD] uppercase tracking-widest">Prioridad</label>
                            <div className="flex bg-[#F8F9FA] p-1 rounded-xl border border-[#DEE2E6]">
                                {(['baja', 'media', 'alta'] as Priority[]).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, prioridad: p })}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.prioridad === p ? 'bg-white shadow-sm text-[#10B981] border border-[#DEE2E6]' : 'text-[#ADB5BD]'}`}
                                    >
                                        {p.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-bold text-[#ADB5BD] uppercase tracking-widest">Estimación (Talla)</label>
                            <select
                                className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] outline-none transition-all font-bold text-sm text-[#1A1A1A] appearance-none cursor-pointer"
                                value={formData.talla || ''}
                                onChange={(e) => setFormData({ ...formData, talla: (e.target.value as StorySize) || null })}
                            >
                                <option value="">Sin estimar</option>
                                <option value="XS">XS - Extra Small</option>
                                <option value="S">S - Small</option>
                                <option value="M">M - Medium</option>
                                <option value="L">L - Large</option>
                                <option value="XL">XL - Extra Large</option>
                            </select>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-[#F8F9FA] border-t border-[#E9ECEF] flex gap-3">
                    <button onClick={onClose} disabled={loading} className="flex-1 py-3 text-sm font-bold text-[#64748B] hover:bg-[#E9ECEF] rounded-xl transition-all">Cancelar</button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-[2] bg-[#10B981] text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-[#10B981]/20 hover:bg-[#0da673] transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? 'Creando...' : (
                            <>
                                Agregar al Backlog <ChevronRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateStoryModal;
