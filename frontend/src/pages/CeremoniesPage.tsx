import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProjectLayout from '../components/ProjectLayout';
import { ceremoniaService, sprintService } from '../services/api';
import { 
    Calendar, 
    Plus, 
    Clock, 
    MessageSquare,
    Video,
    RefreshCw,
} from 'lucide-react';
import type { Ceremonia, Sprint } from '../types';
import toast from 'react-hot-toast';

// --- Helper Components ---
const X = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// Target icon fallback (lucide-react does not export a "Target" that looks like crosshairs in all versions)
const Target = ({ className }: { className?: string }) => <RefreshCw className={className} />;

const CeremoniesPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const [ceremonies, setCeremonies] = useState<Ceremonia[]>([]);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [formData, setFormData] = useState<Partial<Ceremonia>>({
        tipo: 'daily',
        notas: '',
        reunion_url: '',
        estado: 'programada',
        fecha: new Date().toISOString().split('T')[0]
    });

    const fetchData = React.useCallback(async () => {
        if (!projectId) return;
        try {
            setLoading(true);
            const [cRes, sRes] = await Promise.all([
                ceremoniaService.getByProject(projectId),
                sprintService.getByProject(projectId)
            ]);
            setCeremonies(cRes.data);
            setSprints(sRes.data);
        } catch (err) {
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId) return;
        try {
            await ceremoniaService.create({
                ...formData,
                proyecto: Number(projectId)
            });
            toast.success('Ceremonia registrada');
            setIsModalOpen(false);
            setFormData({ tipo: 'daily', notas: '', reunion_url: '', estado: 'programada', fecha: new Date().toISOString().split('T')[0] });
            fetchData();
        } catch (err) {
            toast.error('Error al registrar ceremonia');
        }
    };

    const getTipoIcon = (tipo: string) => {
        switch(tipo) {
            case 'daily': return <Clock className="w-5 h-5 text-[#10B981]" />;
            case 'review': return <RefreshCw className="w-5 h-5 text-[#0F172A]" />;
            case 'planning': return <Target className="w-5 h-5 text-blue-600" />;
            case 'retro': return <MessageSquare className="w-5 h-5 text-emerald-600" />;
            default: return <Calendar className="w-5 h-5 text-gray-400" />;
        }
    };


    return (
        <ProjectLayout>
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tighter">Ceremonias Scrum</h1>
                        <p className="text-xs text-[#64748B] font-bold uppercase tracking-widest">Rituales ágiles</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-[#10B981] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[#10B981]/20"
                    >
                        <Plus className="w-4 h-4" /> Registrar Ceremonia
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 text-center font-bold text-[#ADB5BD] animate-pulse">CARGANDO...</div>
                    ) : ceremonies.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white border-2 border-dashed border-[#DEE2E6] rounded-[32px]">
                            <Calendar className="w-12 h-12 text-[#DEE2E6] mx-auto mb-4" />
                            <p className="text-[#64748B] font-bold">No hay ceremonias registradas aún.</p>
                        </div>
                    ) : (
                        ceremonies.map(c => (
                            <div key={c.id} className="bg-white border border-[#E9ECEF] p-6 rounded-[32px] shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4">
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${c.estado === 'finalizada' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {c.estado_display}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-[#F8F9FA] rounded-2xl flex items-center justify-center border border-[#DEE2E6] group-hover:bg-[#10B981] group-hover:text-white transition-all">
                                        {getTipoIcon(c.tipo)}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-[#1A1A1A] uppercase text-sm">{c.tipo_display}</h3>
                                        <p className="text-xs text-[#64748B] font-medium">{new Date(c.fecha).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-xs text-[#64748B] line-clamp-3 italic font-medium bg-[#F8F9FA] p-3 rounded-xl border border-[#DEE2E6]">
                                        "{c.notas || 'Sin notas registradas'}"
                                    </p>
                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex -space-x-2">
                                            {c.participantes_detalle?.slice(0, 3).map(p => (
                                                <div key={p.id} className="w-7 h-7 rounded-lg bg-[#0F172A] border-2 border-white flex items-center justify-center text-[8px] font-bold text-white uppercase" title={p.username}>
                                                    {p.username[0]}
                                                </div>
                                            ))}
                                            {c.participantes.length > 3 && (
                                                <div className="w-7 h-7 rounded-lg bg-[#DEE2E6] border-2 border-white flex items-center justify-center text-[8px] font-bold text-[#64748B]">
                                                    +{c.participantes.length - 3}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-black text-[#10B981]">HU-S{c.sprint || 'N/A'}</span>
                                    </div>
                                    
                                    {c.reunion_url && (
                                        <a 
                                            href={c.reunion_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="mt-4 w-full py-2.5 bg-[#F0FDF4] text-[#10B981] border border-[#10B981]/20 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#10B981] hover:text-white transition-all shadow-sm"
                                        >
                                            <Video className="w-3.5 h-3.5" /> 
                                            {c.tipo === 'daily' ? 'Entrar a la daily' : 'Entrar a la reunión'}
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal de Registro */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <form onSubmit={handleCreate}>
                            <div className="p-8 bg-[#0F172A] text-white flex justify-between items-center">
                                <h2 className="text-xl font-black uppercase tracking-tighter">Registrar Ceremonia</h2>
                                <button type="button" onClick={() => setIsModalOpen(false)}><X className="w-6 h-6" /></button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-[#64748B]">Tipo</label>
                                        <select 
                                            className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl py-3 px-4 text-xs font-bold focus:border-[#10B981] outline-none"
                                            value={formData.tipo}
                                            onChange={e => setFormData({...formData, tipo: e.target.value as any})}
                                        >
                                            <option value="daily">Daily Scrum</option>
                                            <option value="planning">Sprint Planning</option>
                                            <option value="review">Sprint Review</option>
                                            <option value="retro">Sprint Retrospective</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-[#64748B]">Fecha</label>
                                        <input 
                                            type="date"
                                            className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl py-3 px-4 text-xs font-bold focus:border-[#10B981] outline-none"
                                            value={formData.fecha}
                                            onChange={e => setFormData({...formData, fecha: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-[#64748B]">Sprint Relacionado</label>
                                    <select 
                                        className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl py-3 px-4 text-xs font-bold focus:border-[#10B981] outline-none"
                                        value={formData.sprint || ''}
                                        onChange={e => setFormData({...formData, sprint: e.target.value ? Number(e.target.value) : undefined})}
                                    >
                                        <option value="">Ninguno / Backlog</option>
                                        {sprints.map(s => (
                                            <option key={s.id} value={s.id}>{s.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-[#64748B]">Enlace de la Reunión (Opcional)</label>
                                    <div className="relative group">
                                        <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ADB5BD] group-focus-within:text-[#10B981] transition-colors" />
                                        <input 
                                            type="url"
                                            placeholder="https://meet.google.com/..."
                                            className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl py-3 pl-11 pr-4 text-xs font-medium focus:border-[#10B981] outline-none transition-all"
                                            value={formData.reunion_url || ''}
                                            onChange={e => setFormData({...formData, reunion_url: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-[#64748B]">Notas de la Sesión</label>
                                    <textarea 
                                        rows={4}
                                        placeholder="Resumen, impedimentos, acuerdos..."
                                        className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl py-3 px-4 text-xs font-medium focus:border-[#10B981] outline-none"
                                        value={formData.notas}
                                        onChange={e => setFormData({...formData, notas: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="p-8 bg-gray-50 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-xs font-black uppercase text-[#64748B]">Cancelar</button>
                                <button type="submit" className="flex-[2] py-3 bg-[#10B981] text-white rounded-xl font-black uppercase text-xs shadow-lg shadow-[#10B981]/20">Guardar Registro</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ProjectLayout>
    );
};


export default CeremoniesPage;
