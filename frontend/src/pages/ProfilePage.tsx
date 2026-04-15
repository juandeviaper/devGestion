import React, { useState, useRef } from 'react';
import {
    Mail,
    Shield,
    Award,
    Edit3,
    Save,
    X,
    MessageSquare,
    Camera,
    Trash2,
    LogOut,
    CheckCircle2,
    Settings,
    Menu
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import Avatar from '../components/Avatar';
import NotificationGroup from '../components/NotificationGroup';
import { authService } from '../services/authService';
import { userService } from '../services/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const currentUser = authService.getUser();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        first_name: currentUser?.first_name || '',
        last_name: currentUser?.last_name || '',
        username: currentUser?.username || '',
        perfil: {
            bio: currentUser?.perfil?.bio || '',
            especialidades: currentUser?.perfil?.especialidades || ''
        }
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>((currentUser?.perfil?.foto_perfil as string) || null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const submitData = new FormData();
            submitData.append('first_name', formData.first_name);
            submitData.append('last_name', formData.last_name);
            submitData.append('username', formData.username);
            submitData.append('perfil.bio', formData.perfil.bio);
            submitData.append('perfil.especialidades', formData.perfil.especialidades);
            
            if (selectedFile) {
                submitData.append('perfil.foto_perfil', selectedFile);
            }

            const updatedUserResponse = await userService.updateProfile(submitData);
            
            // Refresh local session data
            localStorage.setItem('devgestion_user_data', JSON.stringify(updatedUserResponse));
            toast.success('Perfil actualizado correctamente');
            setIsEditing(false);
            setSelectedFile(null);
            
            // Reload page to reflect changes globally if necessary
            window.location.reload();
        } catch (err: unknown) {
            console.error(err);
            let errorMsg = 'Error al actualizar el perfil.';
            if (axios.isAxiosError(err)) {
                errorMsg = err.response?.data?.error || err.response?.data?.detail || errorMsg;
            }
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm('¿ESTÁS ABSOLUTAMENTE SEGURO? Esta acción es irreversible y eliminará todos tus datos, proyectos y contribuciones.')) return;
        
        setLoading(true);
        try {
            await userService.deleteProfile();
            authService.logout();
            toast.success('Cuenta eliminada permanentemente');
            navigate('/login');
        } catch (err: unknown) {
            console.error(err);
            let errorMsg = 'Error al eliminar la cuenta.';
            if (axios.isAxiosError(err)) {
                errorMsg = err.response?.data?.error || err.response?.data?.detail || errorMsg;
            }
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) return null;

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
                <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="flex-1">
                        <nav className="flex items-center gap-2 text-[10px] font-black text-[#10B981] mb-2 uppercase tracking-[0.2em] italic">
                            <Award className="w-3.5 h-3.5" /> Centro de Control de Identidad
                        </nav>
                        <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none mb-2">Perfil de Usuario</h1>
                        <p className="text-[#64748B] font-bold text-sm italic opacity-70">Gestiona tu presencia, conocimientos y seguridad.</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                        <NotificationGroup />
                        
                        {!isEditing ? (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="bg-white border border-[#DEE2E6] px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-sm hover:border-[#10B981] hover:text-[#10B981] transition-all group italic"
                            >
                                <Edit3 className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Editar Perfil
                            </button>
                        ) : (
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => {
                                        setIsEditing(false);
                                        setPreviewUrl((currentUser?.perfil?.foto_perfil as string) || null);
                                        setSelectedFile(null);
                                    }}
                                    className="bg-white border border-[#DEE2E6] px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all text-[#64748B] italic"
                                >
                                    <X className="w-4 h-4" /> Cancelar
                                </button>
                                <button 
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="bg-[#10B981] text-white px-10 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-[#10B981]/20 hover:bg-[#059669] hover:-translate-y-1 transition-all disabled:opacity-50 italic"
                                >
                                    {loading ? 'Sincronizando...' : <><Save className="w-4 h-4" /> Guardar Cambios</>}
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-1 space-y-8">
                        {/* Core Identity Card */}
                        <div className="border border-[#E9ECEF] bg-white rounded-[48px] p-10 shadow-sm relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#10B981]/5 rounded-full blur-3xl group-hover:bg-[#10B981]/10 transition-colors"></div>
                            
                            <div className="flex flex-col items-center text-center relative z-10">
                                <div className="relative mb-8">
                                    <Avatar 
                                        username={currentUser.username} 
                                        photo={previewUrl} 
                                        size="xl" 
                                        className="shadow-3xl ring-[12px] ring-[#F0FDF4] rounded-full" 
                                    />
                                    {isEditing && (
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute bottom-2 right-2 p-4 bg-[#10B981] text-white rounded-[20px] shadow-2xl hover:bg-[#059669] hover:scale-110 transition-all border-4 border-white"
                                        >
                                            <Camera className="w-5 h-5" />
                                        </button>
                                    )}
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>

                                {isEditing ? (
                                    <div className="space-y-5 w-full">
                                        <div className="relative">
                                            <label className="text-[9px] font-black text-[#10B981] uppercase tracking-widest block mb-2 px-1 text-left italic">Username (@)</label>
                                            <input 
                                                type="text"
                                                className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl px-6 py-4 text-center font-black text-[#1A1A1A] outline-none focus:border-[#10B981] transition-all"
                                                value={formData.username}
                                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1 text-left">
                                                <label className="text-[8px] font-black text-[#ADB5BD] uppercase tracking-widest px-1">Nombres</label>
                                                <input 
                                                    type="text"
                                                    className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-[#10B981]"
                                                    value={formData.first_name}
                                                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-1 text-left">
                                                <label className="text-[8px] font-black text-[#ADB5BD] uppercase tracking-widest px-1">Apellidos</label>
                                                <input 
                                                    type="text"
                                                    className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-[#10B981]"
                                                    value={formData.last_name}
                                                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-4xl font-black mb-2 text-[#1A1A1A] tracking-tighter leading-tight">@{currentUser.username}</h2>
                                        <p className="text-base font-bold text-[#64748B] mb-4">{currentUser.first_name} {currentUser.last_name}</p>
                                        <div className="flex items-center gap-2 px-6 py-2 bg-[#F0FDF4] text-[#10B981] rounded-full text-[10px] font-black uppercase tracking-widest italic border border-[#10B981]/10">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Usuario Verificado
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="mt-10 space-y-6 pt-10 border-t border-[#F8F9FA]">
                                <InfoRow 
                                    icon={<Mail className="w-4 h-4" />} 
                                    label="Correo Electrónico" 
                                    value={currentUser.email}
                                    help="Identificador de sistema"
                                />
                                <InfoRow 
                                    icon={<Shield className="w-4 h-4" />} 
                                    label="Estado de Membresía" 
                                    value="Miembro Activo" 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-10">
                        {/* Bio Section */}
                        <div className="bg-white border border-[#E9ECEF] rounded-[48px] p-10 shadow-sm relative overflow-hidden">
                            <h3 className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.3em] mb-8 flex items-center gap-2 italic">
                                <MessageSquare className="w-5 h-5 text-[#10B981]" /> Manifiesto Personal
                            </h3>
                            {isEditing ? (
                                <textarea 
                                    className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-3xl p-8 text-base font-medium text-[#64748B] outline-none focus:border-[#10B981] h-56 leading-relaxed resize-none transition-all"
                                    placeholder="Define tu filosofía de desarrollo, visión y rol en la plataforma..."
                                    value={formData.perfil.bio}
                                    onChange={(e) => setFormData({
                                        ...formData, 
                                        perfil: { ...formData.perfil, bio: e.target.value }
                                    })}
                                />
                            ) : (
                                <p className="text-[#64748B] text-lg leading-loose font-medium italic border-l-[6px] border-[#10B981] pl-10 py-4 bg-[#F0FDF4]/30 rounded-r-3xl">
                                    {currentUser.perfil?.bio ? `"${currentUser.perfil.bio}"` : "Tu manifiesto profesional guiará tu colaboración en DevGestión."}
                                </p>
                            )}
                        </div>

                        {/* Specialties Section */}
                        <div className="bg-white border border-[#E9ECEF] rounded-[48px] p-10 shadow-sm">
                            <h3 className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.3em] mb-8 flex items-center gap-2 italic">
                                <Settings className="w-5 h-5 text-[#10B981]" /> Especialidades & Stack
                            </h3>
                            {isEditing ? (
                                <div>
                                    <input 
                                        type="text"
                                        placeholder="React, Python, AWS, UX/UI..."
                                        className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl px-8 py-5 text-base font-bold text-[#1A1A1A] outline-none focus:border-[#10B981] transition-all"
                                        value={formData.perfil.especialidades}
                                        onChange={(e) => setFormData({
                                            ...formData, 
                                            perfil: { ...formData.perfil, especialidades: e.target.value }
                                        })}
                                    />
                                    <p className="text-[10px] text-[#ADB5BD] mt-5 italic font-black uppercase tracking-widest pl-2">※ Separa tus habilidades maestras mediante comas.</p>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-4">
                                    {currentUser.perfil?.especialidades ? 
                                        currentUser.perfil.especialidades.split(',').map((tag: string) => (
                                            <div key={tag} className="px-8 py-4 bg-white border border-[#E9ECEF] hover:border-[#10B981] hover:text-[#10B981] text-[#1A1A1A] rounded-[24px] font-black text-xs uppercase tracking-widest transition-all cursor-default shadow-sm hover:shadow-md">
                                                {tag.trim()}
                                            </div>
                                        )) : (
                                            <div className="w-full py-16 text-center border-2 border-dashed border-[#DEE2E6] rounded-[40px] text-[#ADB5BD] font-black uppercase tracking-[0.2em] text-[10px] italic">
                                                Configura tu stack tecnológico
                                            </div>
                                        )
                                    }
                                </div>
                            )}
                        </div>

                        {/* Account Settings Section */}
                        <div className="bg-white border border-[#E9ECEF] rounded-[48px] p-10 shadow-sm">
                            <h3 className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.3em] mb-8 flex items-center gap-2 italic">
                                <Shield className="w-5 h-5 text-[#10B981]" /> Configuración de Seguridad & Cuenta
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <button 
                                    onClick={() => authService.logout()}
                                    className="flex items-center justify-between p-6 bg-[#F8F9FA] rounded-[32px] hover:bg-slate-100 transition-all group border border-transparent hover:border-[#DEE2E6]"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#64748B] shadow-sm">
                                            <LogOut className="w-6 h-6" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-black text-[#1A1A1A]">Cerrar Sesión</p>
                                            <p className="text-[10px] text-[#ADB5BD] font-bold uppercase tracking-widest">Finalizar sesión actual</p>
                                        </div>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center justify-between p-6 bg-red-50/30 rounded-[32px] hover:bg-red-50 transition-all group border border-transparent hover:border-red-100"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-500 shadow-sm border border-red-50">
                                            <Trash2 className="w-6 h-6" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-black text-red-600">Eliminar Cuenta</p>
                                            <p className="text-[10px] text-red-400/70 font-bold uppercase tracking-widest">Acción irreversible</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal de confirmación de eliminación */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-[#1A1A1A]/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[48px] p-12 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center mb-8 mx-auto border border-red-100">
                            <Trash2 className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-black text-center mb-4 tracking-tighter">Eliminar Cuenta</h2>
                        <p className="text-[#64748B] text-center font-medium leading-relaxed mb-10">
                            Esta acción es final. Se perderá el acceso a todos tus proyectos, tareas y configuraciones personales. No hay marcha atrás.
                        </p>
                        <div className="flex flex-col gap-4">
                            <button 
                                onClick={handleDeleteAccount}
                                disabled={loading}
                                className="w-full py-5 bg-red-500 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-500/20"
                            >
                                {loading ? 'Procesando...' : 'Sí, eliminar cuenta permanentemente'}
                            </button>
                            <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                className="w-full py-5 bg-[#F8F9FA] text-[#64748B] rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                            >
                                Mantener mi cuenta
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const InfoRow: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    value: string;
    help?: string;
}> = ({ icon, label, value, help }) => (
    <div className="flex items-start gap-5">
        <div className="w-12 h-12 rounded-2xl bg-[#F8F9FA] flex items-center justify-center text-[#10B981] border border-[#F1F3F5] shrink-0">
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-widest mb-1.5 italic leading-none">{label}</p>
            <p className="text-sm font-black text-[#1A1A1A] truncate leading-tight">{value}</p>
            {help && <p className="text-[9px] font-black text-[#10B981] uppercase tracking-[0.1em] mt-1.5 italic opacity-70 leading-none">{help}</p>}
        </div>
    </div>
);

export default ProfilePage;


