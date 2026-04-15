import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ChevronLeft,
    Save,
    Trash2,
    Globe,
    Lock,
    AlertCircle,
    Activity,
    FolderKanban,
    User as UserIcon,
    Search as SearchIcon,
    Menu,
    X
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { projectService, userService } from '../services/api';
import { authService } from '../services/authService';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import type { User, ProjectVisibility } from '../types';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ProjectFormPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const isEdit = !!projectId;

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        visibilidad: 'privado' as ProjectVisibility,
        repositorio_url: '',
        creator_id: undefined as number | undefined
    });

    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const isAdmin = authService.getUser()?.is_staff || false;
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const fetchAdminUsers = React.useCallback(async () => {
        if (isAdmin && !isEdit) {
            try {
                const res = await userService.adminGetAll();
                setAllUsers(res.data);
            } catch (err: unknown) {
                console.error('Error fetching users for admin:', err);
            }
        }
    }, [isAdmin, isEdit]);

    const fetchProjectData = React.useCallback(async () => {
        if (isEdit && projectId) {
            try {
                setFetching(true);
                const res = await projectService.getById(projectId);
                setFormData(prev => ({
                    ...prev,
                    nombre: res.data.nombre,
                    descripcion: res.data.descripcion,
                    visibilidad: res.data.visibilidad,
                    repositorio_url: res.data.repositorio_url || '',
                }));
            } catch (err: unknown) {
                console.error(err);
                setError('No se pudo cargar la información del proyecto.');
                toast.error('Error al cargar el proyecto');
            } finally {
                setFetching(false);
            }
        }
    }, [isEdit, projectId]);

    useEffect(() => {
        fetchAdminUsers();
        fetchProjectData();
    }, [fetchAdminUsers, fetchProjectData]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nombre.trim()) {
            setError('El nombre del proyecto es obligatorio.');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            if (isEdit && projectId) {
                await projectService.update(projectId, formData);
                toast.success('Proyecto actualizado con éxito');
                navigate(`/project/${projectId}`);
            } else {
                const res = await projectService.create(formData);
                toast.success('Proyecto creado con éxito');
                navigate(`/project/${res.data.id}`);
            }
        } catch (err: unknown) {
            let errorMsg = 'Error al procesar la solicitud.';
            if (axios.isAxiosError(err)) {
                errorMsg = err.response?.data?.error || err.response?.data?.detail || errorMsg;
            }
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!projectId) return;
        try {
            setLoading(true);
            await projectService.delete(projectId);
            toast.success('Proyecto eliminado');
            navigate('/dashboard');
        } catch (err: unknown) {
            let errorMsg = 'No se pudo eliminar el proyecto.';
            if (axios.isAxiosError(err)) {
                errorMsg = err.response?.data?.error || err.response?.data?.detail || errorMsg;
            }
            setError(errorMsg);
            toast.error(errorMsg);
            setLoading(false);
            setShowDeleteModal(false);
        }
    };

    if (fetching) {
        return (
            <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
                <div className="text-[#ADB5BD] font-black uppercase tracking-[0.3em] animate-pulse italic">
                    Configurando entorno...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex text-[#1A1A1A] font-sans selection:bg-[#10B981]/20 overflow-x-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[100] md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar with Responsive Classes */}
            <div className={`fixed inset-y-0 left-0 z-[101] transition-transform duration-300 transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <Sidebar />
                {isSidebarOpen && (
                    <button 
                        onClick={() => setIsSidebarOpen(false)}
                        className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg md:hidden"
                    >
                        <X className="w-5 h-5 text-[#64748B]" />
                    </button>
                )}
            </div>

            <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto max-h-screen">
                {/* Mobile Header Toggle */}
                <div className="md:hidden flex items-center justify-between mb-8 px-2">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-3 bg-white border border-[#E9ECEF] rounded-2xl text-[#64748B] shadow-sm active:scale-95 transition-all"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <img src="/logo.png" alt="DevGestión" className="h-8 w-auto" />
                </div>
                <div className="max-w-4xl mx-auto">
                    {/* Breadcrumbs / Header */}
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 text-[10px] font-black text-[#10B981] uppercase tracking-widest italic mb-4 hover:translate-x-[-4px] transition-transform"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" /> Volver al panel
                            </button>
                            <h1 className="text-4xl lg:text-5xl font-black text-[#1A1A1A] tracking-tighter leading-none mb-1">
                                {isEdit ? 'Propiedades del' : 'Inicializar'} <span className="text-[#10B981]">Proyecto</span>
                            </h1>
                            <p className="text-[#64748B] text-sm font-medium mt-2 italic">
                                {isEdit ? 'Ajusta los parámetros estratégicos y configuración general.' : 'Define la visión y alcance de tu nuevo desarrollo.'}
                            </p>
                        </div>

                        {isEdit && (
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(true)}
                                className="p-4 text-[#FDA4AF] hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all border border-transparent hover:border-red-100 z-30"
                                title="Eliminar Proyecto"
                            >
                                <Trash2 className="w-6 h-6" />
                            </button>
                        )}
                    </div>

                    <ConfirmDeleteModal 
                        isOpen={showDeleteModal}
                        onClose={() => setShowDeleteModal(false)}
                        onConfirm={handleDelete}
                        loading={loading}
                    />

                    {/* Form Card */}
                    <form onSubmit={handleSave} className="bg-white border border-[#E9ECEF] rounded-[40px] p-8 lg:p-12 shadow-sm relative overflow-hidden group">
                        {/* Decorative Background Icon */}
                        <FolderKanban className="absolute -bottom-10 -right-10 w-64 h-64 text-[#F0FDF4] opacity-50 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />

                        <div className="relative z-10 space-y-10">
                            {/* General Info */}
                            <section className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.2em] flex items-center gap-2 italic">
                                        <Activity className="w-3 h-3 text-[#10B981]" /> Identificador del proyecto
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Sistema de Logística Global"
                                        className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl py-4 px-6 text-lg font-black text-[#1A1A1A] outline-none focus:ring-4 focus:ring-[#10B981]/10 focus:border-[#10B981] transition-all"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.2em] italic">Descripción Estratégica</label>
                                    <textarea
                                        rows={5}
                                        placeholder="Define el propósito clave, stack tecnológico y alcance de este proyecto..."
                                        className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl py-4 px-6 text-sm font-medium text-[#64748B] outline-none focus:ring-4 focus:ring-[#10B981]/10 focus:border-[#10B981] transition-all leading-relaxed"
                                        value={formData.descripcion}
                                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.2em] flex items-center gap-2 italic">
                                        <Globe className="w-3 h-3 text-[#10B981]" /> URL del Repositorio (GitHub/GitLab)
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://github.com/usuario/mi-repositorio"
                                        className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl py-4 px-6 text-sm font-bold text-[#1A1A1A] outline-none focus:ring-4 focus:ring-[#10B981]/10 focus:border-[#10B981] transition-all"
                                        value={formData.repositorio_url}
                                        onChange={(e) => setFormData({ ...formData, repositorio_url: e.target.value })}
                                    />
                                </div>
                            </section>

                            {/* Admin-only Creator Selection (Searchable) */}
                            {isAdmin && !isEdit && (
                                <section className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 bg-[#F8F9FA] p-8 rounded-[32px] border border-[#DEE2E6]">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.2em] flex items-center gap-2 italic">
                                            <UserIcon className="w-3.5 h-3.5 text-[#10B981]" /> Propietario del Proyecto (Solo Admin)
                                        </label>
                                        
                                        <div className="relative group">
                                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ADB5BD] group-focus-within:text-[#10B981] transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Buscar usuario por nombre o username..."
                                                className="w-full bg-white border border-[#DEE2E6] rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-[#1A1A1A] outline-none focus:ring-4 focus:ring-[#10B981]/10 focus:border-[#10B981] transition-all"
                                                value={userSearch}
                                                onChange={(e) => setUserSearch(e.target.value)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                            <div 
                                                onClick={() => {
                                                    setFormData({ ...formData, creator_id: undefined });
                                                    setUserSearch('');
                                                }}
                                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between group ${
                                                    !formData.creator_id ? 'border-[#10B981] bg-white shadow-md' : 'border-transparent bg-white/50 hover:border-slate-200'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">YO</div>
                                                    <span className="text-xs font-bold">Asignarme a mí</span>
                                                </div>
                                                {!formData.creator_id && <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>}
                                            </div>

                                            {allUsers
                                                .filter(u => 
                                                    u.username.toLowerCase().includes(userSearch.toLowerCase()) || 
                                                    (u.first_name + ' ' + u.last_name).toLowerCase().includes(userSearch.toLowerCase())
                                                )
                                                .slice(0, 10)
                                                .map(u => (
                                                    <div 
                                                        key={u.id}
                                                        onClick={() => setFormData({ ...formData, creator_id: u.id })}
                                                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between group ${
                                                            formData.creator_id === u.id ? 'border-[#10B981] bg-white shadow-md' : 'border-transparent bg-white/50 hover:border-slate-200'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-[#F0FDF4] flex items-center justify-center text-[10px] font-black text-[#10B981]">
                                                                {u.username.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold leading-none mb-1">{u.first_name} {u.last_name}</p>
                                                                <p className="text-[10px] text-slate-400 font-medium leading-none italic">@{u.username}</p>
                                                            </div>
                                                        </div>
                                                        {formData.creator_id === u.id && <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>}
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Configuración de Visibilidad Restaurada */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div 
                                    onClick={() => setFormData({ ...formData, visibilidad: 'publico' })}
                                    className={`p-6 rounded-[24px] border-2 transition-all cursor-pointer group ${
                                        formData.visibilidad === 'publico' 
                                            ? 'border-[#10B981] bg-[#F0FDF4]' 
                                            : 'border-[#E9ECEF] bg-white hover:border-[#10B981]/30'
                                    }`}
                                >
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                            formData.visibilidad === 'publico' ? 'bg-[#10B981] text-white' : 'bg-[#F8F9FA] text-[#ADB5BD] group-hover:text-[#10B981]'
                                        }`}>
                                            <Globe className="w-5 h-5" />
                                        </div>
                                        <span className={`text-sm font-black uppercase tracking-widest ${
                                            formData.visibilidad === 'publico' ? 'text-[#10B981]' : 'text-[#64748B]'
                                        }`}>Público</span>
                                    </div>
                                    <p className="text-xs text-[#64748B] font-medium leading-relaxed">Cualquier usuario de la plataforma podrá ver y seguir este proyecto.</p>
                                </div>

                                <div 
                                    onClick={() => setFormData({ ...formData, visibilidad: 'privado' })}
                                    className={`p-6 rounded-[24px] border-2 transition-all cursor-pointer group ${
                                        formData.visibilidad === 'privado' 
                                            ? 'border-[#10B981] bg-[#F0FDF4]' 
                                            : 'border-[#E9ECEF] bg-white hover:border-[#10B981]/30'
                                    }`}
                                >
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                            formData.visibilidad === 'privado' ? 'bg-[#10B981] text-white' : 'bg-[#F8F9FA] text-[#ADB5BD] group-hover:text-[#10B981]'
                                        }`}>
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <span className={`text-sm font-black uppercase tracking-widest ${
                                            formData.visibilidad === 'privado' ? 'text-[#10B981]' : 'text-[#64748B]'
                                        }`}>Privado</span>
                                    </div>
                                    <p className="text-xs text-[#64748B] font-medium leading-relaxed">Solo tú y los miembros invitados podrán acceder al contenido.</p>
                                </div>
                            </div>

                            {/* Errors */}
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-[11px] font-black uppercase tracking-widest italic animate-in slide-in-from-top-2">
                                    <AlertCircle className="w-4 h-4" /> {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="pt-8 border-t border-[#F8F9FA] flex flex-col sm:flex-row items-center gap-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full sm:flex-[2] bg-[#10B981] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#10B981]/20 hover:bg-[#059669] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 italic"
                                >
                                    {loading ? 'Sincronizando...' : (
                                        <>
                                            <Save className="w-4 h-4 font-black" /> {isEdit ? 'Actualizar Propiedades' : 'Inicializar Proyecto'}
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="w-full sm:flex-1 py-4 text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] hover:text-[#1A1A1A] transition-all italic"
                                >
                                    Descartar Cambios
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default ProjectFormPage;
