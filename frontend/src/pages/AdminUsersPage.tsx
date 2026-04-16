import React, { useState, useEffect } from 'react';
import { 
    Users, 
    UserPlus, 
    Search, 
    Edit2,
    Trash2, 
    Shield, 
    CheckCircle, 
    XCircle,
    User as UserIcon,
    RefreshCw,
    X,
    Menu
} from 'lucide-react';
import { userService } from '../services/api';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import type { User } from '../types';
import axios from 'axios';

const AdminUsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Navegación móvil
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    // Edit handling
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: ''
    });

    // Create handling
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        is_staff: false
    });

    const fetchUsers = React.useCallback(async () => {
        setLoading(true);
        try {
            const response = await userService.adminGetAll();
            setUsers(response.data);
        } catch (error) {
            toast.error('Error al cargar usuarios');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleToggleActive = async (user: User) => {
        try {
            await userService.adminUpdate(user.id, { is_active: !user.is_active });
            toast.success(`Usuario ${user.is_active ? 'desactivado' : 'activado'} correctamente`);
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar estado');
        }
    };

    const handleToggleStaff = async (user: User) => {
        try {
            await userService.adminUpdate(user.id, { is_staff: !user.is_staff });
            toast.success(`Permisos de administrador ${user.is_staff ? 'removidos' : 'concedidos'}`);
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar permisos');
        }
    };

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    };

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setEditForm({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            password: ''
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        try {
            const data: Partial<User> & { password?: string } = { ...editForm };
            if (!data.password) delete data.password;
            
            await userService.adminUpdate(editingUser.id, data);
            toast.success('Usuario actualizado correctamente');
            setShowEditModal(false);
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar usuario');
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await userService.adminCreate(createForm);
            toast.success('Usuario creado exitosamente');
            setShowCreateModal(false);
            setCreateForm({
                username: '',
                email: '',
                password: '',
                first_name: '',
                last_name: '',
                is_staff: false
            });
            fetchUsers();
        } catch (error: unknown) {
            let errorMsg = 'Error al crear usuario';
            if (axios.isAxiosError(error)) {
                errorMsg = error.response?.data?.username?.[0] || errorMsg;
            }
            toast.error(errorMsg);
        }
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await userService.adminDelete(userToDelete.id);
            toast.success('Usuario eliminado (Soft Delete)');
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error('Error al eliminar usuario');
        } finally {
            setShowDeleteModal(false);
            setUserToDelete(null);
        }
    };

    const filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
                                    <Users className="text-[#10B981] w-6 h-6" />
                                </div>
                                <h1 className="text-3xl font-black tracking-tight">Gestión de Usuarios</h1>
                            </div>
                            <p className="text-slate-500 font-medium">Panel de administración global de DevGestión</p>
                        </div>
                        
                        <button 
                            className="bg-[#10B981] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-[#059669] transition-all shadow-lg shadow-[#10B981]/20 active:scale-95"
                            onClick={() => setShowCreateModal(true)}
                        >
                            <UserPlus className="w-5 h-5" />
                            Nuevo Usuario
                        </button>
                    </div>

                    {/* Search and Stats */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                        <div className="lg:col-span-3 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input 
                                type="text"
                                placeholder="Buscar por nombre, usuario o email..."
                                className="w-full pl-12 pr-4 py-4 bg-white border border-[#E9ECEF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#10B981]/10 focus:border-[#10B981] transition-all shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-[#E9ECEF] flex items-center justify-between shadow-sm">
                            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total</div>
                            <div className="text-2xl font-black text-[#10B981]">{users.length}</div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-3xl border border-[#E9ECEF] shadow-sm overflow-hidden overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#F8F9FA] border-b border-[#E9ECEF]">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Usuario</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Rol</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E9ECEF]">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <RefreshCw className="w-8 h-8 text-[#10B981] animate-spin" />
                                                <span className="font-bold text-slate-400">Cargando usuarios...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-[#F8F9FA]/50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-white transition-colors">
                                                        <UserIcon className="w-6 h-6 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-[#0F172A]">
                                                            {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                                                        </div>
                                                        <div className="text-xs text-slate-400 font-medium">@{user.username} • {user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <button 
                                                    onClick={() => handleToggleActive(user)}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${
                                                        user.is_active 
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                        : 'bg-rose-50 text-rose-600 border-rose-100'
                                                    }`}
                                                >
                                                    {user.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                    {user.is_active ? 'Activo' : 'Inactivo'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-5">
                                                <button 
                                                    onClick={() => handleToggleStaff(user)}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${
                                                        user.is_staff 
                                                        ? 'bg-amber-50 text-amber-600 border-amber-100' 
                                                        : 'bg-slate-50 text-slate-600 border-slate-100'
                                                    }`}
                                                >
                                                    <Shield className="w-3 h-3" />
                                                    {user.is_staff ? 'Admin' : 'Usuario'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handleEditClick(user)}
                                                        className="p-2 text-slate-400 hover:text-[#10B981] hover:bg-[#10B981]/10 rounded-lg transition-all"
                                                        title="Editar usuario"
                                                    >
                                                        <Edit2 className="w-5 h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteClick(user)}
                                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                        title="Eliminar usuario"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center text-slate-400 font-bold">
                                            No se encontraron usuarios
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <ConfirmDeleteModal 
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Eliminar Usuario"
                message={`¿Estás seguro que deseas eliminar a @${userToDelete?.username}? Esto realizará un borrado lógico (quedará inactivo).`}
            />

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-[#E9ECEF] flex items-center justify-between bg-[#F8F9FA]">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
                                    <Edit2 className="text-[#10B981] w-5 h-5" />
                                </div>
                                <h3 className="font-black text-xl text-[#0F172A]">Editar Usuario</h3>
                            </div>
                            <button 
                                onClick={() => setShowEditModal(false)}
                                className="text-slate-400 hover:text-[#0F172A] p-2 hover:bg-white rounded-xl transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#10B981]/10 focus:border-[#10B981] transition-all font-medium"
                                        value={editForm.first_name}
                                        onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Apellido</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#10B981]/10 focus:border-[#10B981] transition-all font-medium"
                                        value={editForm.last_name}
                                        onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</label>
                                <input 
                                    type="email" 
                                    required
                                    className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#10B981]/10 focus:border-[#10B981] transition-all font-medium"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nueva Contraseña (opcional)</label>
                                <input 
                                    type="password" 
                                    placeholder="Dejar en blanco para no cambiar"
                                    className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#10B981]/10 focus:border-[#10B981] transition-all font-medium"
                                    value={editForm.password}
                                    onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 bg-[#F8F9FA] hover:bg-[#E9ECEF] transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-white bg-[#10B981] hover:bg-[#059669] transition-all shadow-lg shadow-[#10B981]/20 active:scale-95"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-[#E9ECEF] flex items-center justify-between bg-[#F8F9FA]">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
                                    <UserPlus className="text-[#10B981] w-5 h-5" />
                                </div>
                                <h3 className="font-black text-xl text-[#0F172A]">Nuevo Usuario</h3>
                            </div>
                            <button 
                                onClick={() => setShowCreateModal(false)}
                                className="text-slate-400 hover:text-[#0F172A] p-2 hover:bg-white rounded-xl transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateSubmit} className="p-8 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Username *</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#10B981]/10 focus:border-[#10B981] transition-all font-medium"
                                    value={createForm.username}
                                    placeholder="ej: juanperez123"
                                    onChange={(e) => setCreateForm({...createForm, username: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#10B981]/10 focus:border-[#10B981] transition-all font-medium"
                                        value={createForm.first_name}
                                        onChange={(e) => setCreateForm({...createForm, first_name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Apellido</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#10B981]/10 focus:border-[#10B981] transition-all font-medium"
                                        value={createForm.last_name}
                                        onChange={(e) => setCreateForm({...createForm, last_name: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email *</label>
                                <input 
                                    type="email" 
                                    required
                                    className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#10B981]/10 focus:border-[#10B981] transition-all font-medium"
                                    value={createForm.email}
                                    placeholder="correo@ejemplo.com"
                                    onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contraseña *</label>
                                <input 
                                    type="password" 
                                    required
                                    className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#10B981]/10 focus:border-[#10B981] transition-all font-medium"
                                    value={createForm.password}
                                    placeholder="Mínimo 8 caracteres"
                                    onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                                />
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl">
                                <input 
                                    type="checkbox"
                                    id="is_staff_create"
                                    className="w-5 h-5 accent-[#10B981] cursor-pointer"
                                    checked={createForm.is_staff}
                                    onChange={(e) => setCreateForm({...createForm, is_staff: e.target.checked})}
                                />
                                <label htmlFor="is_staff_create" className="text-sm font-bold text-slate-600 cursor-pointer">
                                    Asignar rol de Administrador
                                </label>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 bg-[#F8F9FA] hover:bg-[#E9ECEF] transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-white bg-[#10B981] hover:bg-[#059669] transition-all shadow-lg shadow-[#10B981]/20 active:scale-95"
                                >
                                    Crear Usuario
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;
