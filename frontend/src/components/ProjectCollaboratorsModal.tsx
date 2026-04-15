import React, { useState, useEffect } from 'react';
import {
    X,
    Users,
    UserPlus,
    Shield,
    Trash2,
    AtSign,
    Loader2
} from 'lucide-react';
import { projectService, userService } from '../services/api';
import Avatar from './Avatar';
import type { ProjectMember, User } from '../types';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface CollaboratorsModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    projectName: string;
}

const ProjectCollaboratorsModal: React.FC<CollaboratorsModalProps> = ({ isOpen, onClose, projectId, projectName }) => {
    const [collaborators, setCollaborators] = useState<ProjectMember[]>([]);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    const fetchMembers = React.useCallback(async () => {
        try {
            const res = await projectService.getMembers(projectId);
            setCollaborators(res.data);
        } catch (err: unknown) {
            console.error("Error fetching members", err);
            toast.error("No se pudo cargar la lista de colaboradores.");
        }
    }, [projectId]);

    useEffect(() => {
        if (isOpen && projectId) {
            fetchMembers();
        }
    }, [isOpen, projectId, fetchMembers]);

    const handleSearch = async (val: string) => {
        setSearch(val);
        if (val.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            setSearching(true);
            const res = await userService.search(val);
            // Filter out existing members
            const existingIds = collaborators.map(c => c.usuario);
            setSearchResults(res.data.filter((u: User) => !existingIds.includes(u.id)));
        } catch (err: unknown) {
            console.error("Search error", err);
        } finally {
            setSearching(false);
        }
    };

    const addMember = async (username: string) => {
        try {
            setLoading(true);
            await projectService.addMember(projectId, username);
            await fetchMembers();
            setSearch('');
            setSearchResults([]);
            toast.success(`@${username} añadido al equipo.`);
        } catch (err: unknown) {
            console.error("Add member error", err);
            let errorMsg = "No se pudo añadir al miembro.";
            if (axios.isAxiosError(err)) {
                errorMsg = err.response?.data?.error || err.response?.data?.detail || errorMsg;
            }
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const removeMember = async (username: string) => {
        if (!confirm(`¿Estás seguro de eliminar a @${username} del proyecto?`)) return;
        try {
            setLoading(true);
            await projectService.removeMember(projectId, username);
            await fetchMembers();
            toast.success(`@${username} eliminado del proyecto.`);
        } catch (err: unknown) {
            console.error("Remove member error", err);
            let errorMsg = "No se pudo eliminar al miembro.";
            if (axios.isAxiosError(err)) {
                errorMsg = err.response?.data?.error || err.response?.data?.detail || errorMsg;
            }
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-md animate-in fade-in duration-300 font-sans">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-[#E9ECEF] animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 pb-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tighter">Gestionar Equipo</h2>
                        <p className="text-[10px] font-black text-[#10B981] uppercase tracking-[0.2em] italic">{projectName}</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-[#F8F9FA] hover:bg-[#E9ECEF] rounded-2xl transition-all">
                        <X className="w-5 h-5 text-[#64748B]" />
                    </button>
                </div>

                {/* Search / Add */}
                <div className="px-8 mb-6 relative">
                    <div className="relative group">
                        <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ADB5BD] group-focus-within:text-[#10B981]" />
                        <input
                            type="text"
                            placeholder="Invitar por @username..."
                            className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl py-4 pl-11 pr-4 text-sm font-bold focus:outline-none focus:border-[#10B981] transition-all"
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#10B981] animate-spin" />}
                    </div>

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                        <div className="absolute left-8 right-8 top-full mt-2 bg-white border border-[#E9ECEF] rounded-2xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2">
                             {searchResults.map(user => (
                                 <button 
                                     key={user.id} 
                                     onClick={() => addMember(user.username)}
                                     disabled={loading}
                                     className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-all border-b border-[#F1F3F5] last:border-0 disabled:opacity-50"
                                 >
                                     <div className="flex items-center gap-3">
                                         <Avatar username={user.username} photo={typeof user.perfil?.foto_perfil === 'string' ? user.perfil?.foto_perfil : null} size="sm" />
                                         <div className="text-left">
                                             <p className="text-sm font-black text-[#1A1A1A]">@{user.username}</p>
                                             <p className="text-[10px] font-bold text-[#64748B]">{user.first_name} {user.last_name}</p>
                                         </div>
                                     </div>
                                     <UserPlus className="w-4 h-4 text-[#10B981]" />
                                 </button>
                             ))}
                        </div>
                    )}
                </div>

                {/* List */}
                <div className="px-8 pb-8 space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar">
                    <p className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-[0.2em] mb-4 px-1 italic">Colaboradores Activos</p>
                    {collaborators.map((collab) => (
                        <div key={collab.usuario_detalle.username} className="flex items-center justify-between p-4 bg-white border border-[#F1F3F5] rounded-[24px] hover:border-[#10B981]/20 transition-all group">
                            <div className="flex items-center gap-3">
                                <Avatar 
                                    username={collab.usuario_detalle.username} 
                                    photo={typeof collab.usuario_detalle.perfil?.foto_perfil === 'string' ? collab.usuario_detalle.perfil?.foto_perfil : null} 
                                    size="md" 
                                 />
                                <div>
                                    <p className="text-sm font-black text-[#1A1A1A]">@{collab.usuario_detalle.username}</p>
                                    <p className="text-[10px] font-bold text-[#10B981] flex items-center gap-1.5 italic uppercase tracking-wider">
                                        <Shield className="w-2.5 h-2.5" /> {collab.rol_proyecto}
                                    </p>
                                </div>
                            </div>
                            {collab.rol_proyecto !== 'dueño' && (
                                <button 
                                    onClick={() => removeMember(collab.usuario_detalle.username)}
                                    disabled={loading}
                                    className="p-2.5 text-[#ADB5BD] hover:text-[#F85149] hover:bg-[#F85149]/5 rounded-xl transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                    {collaborators.length === 0 && (
                        <div className="flex flex-col items-center py-10 text-[#ADB5BD]">
                            <IconUsers className="w-10 h-10 mb-3 opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-widest italic">Cargando equipo...</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-[#F8F9FA] border-t border-[#E9ECEF]">
                    <button onClick={onClose} className="w-full py-4 text-[10px] font-black text-[#64748B] hover:text-[#1A1A1A] rounded-2xl transition-all uppercase tracking-[0.2em] italic">
                        Cerrar Gestión
                    </button>
                </div>
            </div>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E9ECEF;
          border-radius: 10px;
        }
      `}</style>
        </div>
    );
};

const IconUsers = Users;

export default ProjectCollaboratorsModal;
