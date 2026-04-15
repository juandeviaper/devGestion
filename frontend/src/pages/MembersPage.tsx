import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProjectLayout from '../components/ProjectLayout';
import {
    Users,
    UserPlus,
    MoreHorizontal,
    Mail,
    Shield,
    ShieldCheck,
    ShieldAlert,
    ExternalLink,
    Filter,
    ArrowRight,
    Search,
    Loader2,
    X,
    Trash2
} from 'lucide-react';
import { invitationService, userService, projectService } from '../services/api';
import { authService } from '../services/authService';
import { toast } from 'react-hot-toast';
import type { ProjectMember, User, ProjectRole } from '../types';
import axios from 'axios';

const MembersPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [inviteRole, setInviteRole] = useState<ProjectRole>('colaborador');
    const [isRemoving, setIsRemoving] = useState<number | null>(null);
    const user = authService.getUser();

    const fetchMembers = React.useCallback(() => {
        if (projectId) {
            setLoading(true);
            projectService.getMembers(projectId)
                .then(res => setMembers(res.data))
                .catch(err => console.error('Error fetching members:', err))
                .finally(() => setLoading(false));
        }
    }, [projectId]);

    const handleSearch = React.useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsSearching(true);
        try {
            const response = await userService.search(searchQuery);
            setSearchResults(response.data);
        } catch (error) {
            console.error(error);
            toast.error('Error al buscar usuarios');
        } finally {
            setIsSearching(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim()) {
                handleSearch();
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, handleSearch]);

    const handleSendInvitation = async (userId: number) => {
        if (!projectId) return;
        try {
            await invitationService.create({
                proyecto: parseInt(projectId),
                usuario_invitado: userId,
                rol_invitado: inviteRole
            });
            toast.success('Invitación enviada con éxito');
            setIsInviteModalOpen(false);
            setSearchQuery('');
            setSearchResults([]);
        } catch (error: unknown) {
            let errorMsg = 'Error al enviar invitación';
            if (axios.isAxiosError(error)) {
                errorMsg = error.response?.data?.error || error.response?.data?.[0] || errorMsg;
            }
            toast.error(errorMsg);
        }
    };

    const handleRemoveMember = async (username: string, memberId: number) => {
        if (!projectId) return;
        if (!window.confirm(`¿Estás seguro de que deseas eliminar a @${username} del proyecto?`)) return;

        setIsRemoving(memberId);
        try {
            await projectService.removeMember(projectId, username);
            toast.success(`@${username} ha sido eliminado del proyecto`);
            fetchMembers();
        } catch (error: unknown) {
            let errorMsg = 'Error al eliminar miembro';
            if (axios.isAxiosError(error)) {
                errorMsg = error.response?.data?.error || errorMsg;
            }
            toast.error(errorMsg);
        } finally {
            setIsRemoving(null);
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role.toLowerCase()) {
            case 'dueño': return <ShieldAlert className="w-4 h-4 text-red-500" />;
            case 'colaborador': return <ShieldCheck className="w-4 h-4 text-[#10B981]" />;
            default: return <Shield className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <ProjectLayout>
            <div className="max-w-6xl mx-auto space-y-10 lg:space-y-12 h-full flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 shrink-0">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-black text-[#1A1A1A] mb-2 tracking-tighter">Equipo <Users className="w-6 lg:w-8 h-6 lg:h-8 text-[#10B981] inline-block ml-2 mb-1" /></h1>
                        <p className="text-[10px] lg:text-xs text-[#64748B] font-black italic tracking-[0.2em] uppercase opacity-70">Control de acceso y gobernanza</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button className="flex-1 sm:flex-none p-3 lg:p-3.5 bg-white border border-[#E9ECEF] text-[#64748B] rounded-2xl hover:text-[#10B981] transition-all shadow-sm">
                            <Filter className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setIsInviteModalOpen(true)}
                            className="flex-[3] sm:flex-none px-8 py-3.5 bg-[#1A1A1A] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#0F172A] transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#1A1A1A]/10"
                        >
                            <UserPlus className="w-4 h-4 text-[#10B981]" /> Invitar
                        </button>
                    </div>
                </div>

                <div className="bg-white border border-[#E9ECEF] rounded-[40px] overflow-hidden shadow-sm flex-1 min-h-[400px]">
                    <div className="overflow-x-auto min-w-full no-scrollbar md:custom-scrollbar h-full">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-[#F8F9FA]/50 border-b border-[#E9ECEF]">
                                    <th className="px-8 py-6 text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] italic">Colaborador</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] italic">Rol</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] italic">Miembro desde</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] italic text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F8F9FA]">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center text-[#ADB5BD] font-black uppercase tracking-[0.3em] animate-pulse italic">
                                            Identificando roles autorizados...
                                        </td>
                                    </tr>
                                ) : members.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center text-[#ADB5BD] font-bold italic">
                                            No hay miembros registrados en este proyecto.
                                        </td>
                                    </tr>
                                ) : (
                                    members.map((member) => (
                                        <tr key={member.id} className="hover:bg-[#F0FDF4]/30 transition-all group border-l-[6px] border-l-transparent hover:border-l-[#10B981]">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl flex items-center justify-center text-sm font-black text-[#64748B] shadow-sm group-hover:bg-[#10B981] group-hover:text-white transition-all">
                                                        {member.usuario_detalle.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-black text-[#1A1A1A] group-hover:text-[#10B981] transition-colors truncate">
                                                            {member.usuario_detalle.username}
                                                        </p>
                                                        <p className="text-[11px] text-[#64748B] font-medium flex items-center gap-1.5 opacity-60">
                                                            <Mail className="w-3 h-3" /> {member.usuario_detalle.email || 'sin-correo@dev.com'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#DEE2E6] rounded-lg shadow-sm">
                                                    {getRoleIcon(member.rol_proyecto)}
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">{member.rol_proyecto}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-xs font-black text-[#64748B] italic">
                                                    {new Date(member.fecha_union).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </td>
                                             <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {projectService.isOwner(members, user?.id) && member.usuario_detalle.id !== user?.id && (
                                                        <button 
                                                            onClick={() => handleRemoveMember(member.usuario_detalle.username, member.id)}
                                                            disabled={isRemoving === member.id}
                                                            className="p-3 text-[#ADB5BD] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 shadow-none hover:shadow-sm"
                                                            title="Eliminar Colaborador"
                                                        >
                                                            {isRemoving === member.id ? (
                                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-5 h-5" />
                                                            )}
                                                        </button>
                                                    )}
                                                    <button className="p-3 text-[#ADB5BD] hover:text-[#10B981] hover:bg-white rounded-xl transition-all border border-transparent hover:border-[#10B981]/20 shadow-none hover:shadow-sm">
                                                        <MoreHorizontal className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-8 bg-[#1A1A1A] p-8 lg:p-10 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-8 shrink-0 relative overflow-hidden group">
                    <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
                    <div className="flex items-center gap-8 relative z-10">
                        <div className="w-14 h-14 bg-[#10B981] rounded-[22px] flex items-center justify-center shadow-xl shadow-[#10B981]/20 group-hover:scale-105 transition-transform">
                            <Users className="w-7 h-7 text-white" />
                        </div>
                        <div className="text-center md:text-left">
                            <h4 className="text-xl font-black tracking-tighter italic">Capital Humano</h4>
                            <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em]">{members.length} colaboradores activos autorizados</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-3 text-[10px] font-black text-[#10B981] hover:text-[#34D399] uppercase tracking-[0.2em] transition-all group/btn relative z-10 italic">
                        Auditoría de Acceso <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Modal de Invitación */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-500 rounded-2xl">
                                    <UserPlus className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Añadir Miembro</h2>
                            </div>
                            <button 
                                onClick={() => setIsInviteModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-8">
                            <form onSubmit={(e) => handleSearch(e)} className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Buscar por usuario o email</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Nombre de usuario..."
                                        className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all font-medium"
                                    />
                                    <button type="submit" className="absolute left-4 top-1/2 -translate-y-1/2">
                                        <Search className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>
                            </form>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Resultados</label>
                                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                    {isSearching ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        searchResults.map((userResult) => (
                                            <div key={userResult.id} className="p-4 bg-gray-50 hover:bg-emerald-50 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-all flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center font-black text-gray-500 uppercase">
                                                        {userResult.username.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{userResult.username}</p>
                                                        <p className="text-[10px] text-gray-500">{userResult.email || 'Sin correo'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <select 
                                                        value={inviteRole}
                                                        onChange={(e) => setInviteRole(e.target.value as ProjectRole)}
                                                        className="bg-transparent border-none text-[10px] font-bold uppercase tracking-widest text-emerald-600 focus:outline-none cursor-pointer"
                                                    >
                                                        <option value="colaborador">Colaborador</option>
                                                        <option value="dueño">Dueño</option>
                                                    </select>
                                                    <button 
                                                        onClick={() => handleSendInvitation(userResult.id)}
                                                        className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200 group-hover:scale-105 transition-transform"
                                                    >
                                                        <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-gray-400">
                                            <p className="text-sm font-medium italic">Inicia una búsqueda para ver resultados</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">DevGestión Governance</p>
                            <button 
                                onClick={() => setIsInviteModalOpen(false)}
                                className="text-xs font-black text-gray-500 hover:text-gray-900 uppercase tracking-widest transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ProjectLayout>
    );
};

export default MembersPage;
