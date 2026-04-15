import React, { useState } from 'react';
import {
    X,
    ChevronRight,
    FileText,
    AlertCircle
} from 'lucide-react';
import { storyService } from '../services/api';
import axios from 'axios';
import type { Priority } from '../types';

interface CreateStoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onStoryCreated?: () => void;
}

const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ isOpen, onClose, projectId, onStoryCreated }) => {
    const [formData, setFormData] = useState<{
        titulo: string;
        descripcion: string;
        prioridad: Priority;
    }>({
        titulo: '',
        descripcion: '',
        prioridad: 'media',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!formData.titulo.trim()) {
            setError('El título es obligatorio.');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await storyService.create({
                ...formData,
                proyecto: Number(projectId)
            });
            if (onStoryCreated) onStoryCreated();
            onClose();
            setFormData({ titulo: '', descripcion: '', prioridad: 'media' });
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
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-[#E9ECEF] animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 bg-[#0F172A] text-white flex justify-between items-center relative">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight uppercase tracking-widest text-sm">Nueva Historia de Usuario</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#ADB5BD] uppercase tracking-widest">Título de la Historia</label>
                        <input
                            type="text"
                            placeholder="Ej. Implementar autenticación JWT"
                            className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-[#1A1A1A]"
                            value={formData.titulo}
                            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#ADB5BD] uppercase tracking-widest">Descripción / Criterios</label>
                        <textarea
                            rows={4}
                            placeholder="Como [rol], quiero [acción], para que [beneficio]..."
                            className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-[#64748B]"
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#ADB5BD] uppercase tracking-widest">Prioridad</label>
                        <div className="flex bg-[#F8F9FA] p-1 rounded-xl border border-[#DEE2E6]">
                            {(['baja', 'media', 'alta'] as Priority[]).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setFormData({ ...formData, prioridad: p })}
                                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.prioridad === p ? 'bg-white shadow-sm text-blue-500' : 'text-[#ADB5BD]'}`}
                                >
                                    {p.toUpperCase()}
                                </button>
                            ))}
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
                        className="flex-[2] bg-blue-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
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
