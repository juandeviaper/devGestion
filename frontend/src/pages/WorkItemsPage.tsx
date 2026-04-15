import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Search,
    Filter,
    Bug as BugIcon,
    Target,
    FileText,
    ClipboardCheck,
    Plus,
    ChevronDown,
    Pencil,
    Trash2,
    X,
    FileUp,
    CheckCircle2,
    AlertTriangle
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import ProjectLayout from '../components/ProjectLayout';
import { storyService, epicService, taskService, bugService } from '../services/api';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import type { Epic, UserStory, Task, Bug } from '../types';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface WorkItem {
    id: number;
    titulo: string;
    type: 'Épica' | 'Historia' | 'Tarea' | 'Bug';
    icon: LucideIcon;
    color: string;
    route: string;
    estado: string;
    fecha_creacion: string;
}

const WorkItemsPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [items, setItems] = useState<WorkItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isNewItemMenuOpen, setIsNewItemMenuOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    
    // Filtros
    const [filterType, setFilterType] = useState('todos');
    const [filterStatus, setFilterStatus] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Eliminación
    const [itemToDelete, setItemToDelete] = useState<WorkItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchItems = React.useCallback(async () => {
        try {
            if (!projectId) return;
            setLoading(true);
            const [sRes, eRes, tRes, bRes] = await Promise.all([
                storyService.getByProject(projectId),
                epicService.getByProject(projectId),
                taskService.getByProject(projectId),
                bugService.getByProject(projectId)
            ]);

            const allItems: WorkItem[] = [
                ...eRes.data.map((item: Epic) => ({ 
                    id: item.id,
                    titulo: item.titulo,
                    estado: item.estado,
                    fecha_creacion: item.fecha_creacion,
                    type: 'Épica' as const, 
                    icon: Target, 
                    color: 'text-orange-500', 
                    route: `/project/${projectId}/epics/${item.id}/edit` 
                })),
                ...sRes.data.map((item: UserStory) => ({ 
                    id: item.id,
                    titulo: item.titulo,
                    estado: item.estado,
                    fecha_creacion: item.fecha_creacion,
                    type: 'Historia' as const, 
                    icon: FileText, 
                    color: 'text-blue-500', 
                    route: `/project/${projectId}/story/${item.id}/edit` 
                })),
                ...tRes.data.map((item: Task) => ({ 
                    id: item.id,
                    titulo: item.titulo,
                    estado: item.estado,
                    fecha_creacion: item.fecha_creacion,
                    type: 'Tarea' as const, 
                    icon: ClipboardCheck, 
                    color: 'text-emerald-500', 
                    route: `/project/${projectId}/tasks/${item.id}/edit` 
                })),
                ...bRes.data.map((item: Bug) => ({ 
                    id: item.id,
                    titulo: item.titulo,
                    estado: item.estado,
                    fecha_creacion: item.fecha_creacion,
                    type: 'Bug' as const, 
                    icon: BugIcon, 
                    color: 'text-red-500', 
                    route: `/project/${projectId}/bugs/${item.id}/edit` 
                }))
            ].sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());

            setItems(allItems);
        } catch (err: unknown) {
            console.error("Error fetching work items", err);
            toast.error("No se pudieron cargar los elementos de trabajo.");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !projectId) return;

        // Validar extensión
        if (!file.name.endsWith('.xlsx')) {
            toast.error('Por favor, selecciona un archivo Excel (.xlsx)');
            return;
        }

        try {
            setImporting(true);
            const res = await storyService.importStories(projectId, file);
            const data = res.data;

            if (data.errors_count === 0) {
                toast.success(`¡Importación exitosa! Se crearon ${data.created_count} historias.`);
            } else {
                toast(
                    (t) => (
                        <div className="flex flex-col gap-2">
                            <p className="font-black text-xs uppercase tracking-tight">Resultado parcial: {data.created_count} creadas, {data.errors_count} errores.</p>
                            <div className="max-h-32 overflow-y-auto text-[10px] font-bold text-slate-500 italic">
                                {data.details.map((d: any, i: number) => (
                                    <div key={i} className="border-b border-slate-100 py-1">
                                        Fila {d.fila}: {d.errores.join(', ')}
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={() => toast.dismiss(t.id)}
                                className="mt-2 bg-[#1A1A1A] text-white py-1 px-3 rounded-lg text-[10px] font-black uppercase"
                            >
                                Entendido
                            </button>
                        </div>
                    ),
                    { duration: 6000, icon: <AlertTriangle className="w-5 h-5 text-amber-500" /> }
                );
            }
            fetchItems();
        } catch (err: any) {
            console.error('Error importing Excel:', err);
            const msg = err.response?.data?.error || 'Error al procesar el archivo Excel.';
            toast.error(msg);
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;

        try {
            setIsDeleting(true);
            const { id, type } = itemToDelete;

            if (type === 'Épica') await epicService.delete(String(id));
            else if (type === 'Historia') await storyService.delete(String(id));
            else if (type === 'Tarea') await taskService.delete(String(id));
            else if (type === 'Bug') await bugService.delete(String(id));

            toast.success(`${type} eliminada con éxito.`);
            await fetchItems();
            setItemToDelete(null);
        } catch (err: unknown) {
            console.error("Error al eliminar elemento", err);
            let errorMsg = "No se pudo eliminar el elemento.";
            if (axios.isAxiosError(err)) {
                errorMsg = err.response?.data?.error || errorMsg;
            }
            toast.error(errorMsg);
        } finally {
            setIsDeleting(false);
        }
    };

    const normalize = (text: string) => 
        text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const filteredItems = items.filter(item => {
        const normalizedSearch = normalize(searchTerm);
        const itemTitle = normalize(item.titulo);
        const itemType = normalize(item.type);
        const itemId = item.id.toString();

        const matchesSearch = itemTitle.includes(normalizedSearch) || 
                            itemId.includes(normalizedSearch) ||
                            itemType.includes(normalizedSearch);

        const matchesType = filterType === 'todos' || normalize(item.type) === normalize(filterType);
        const matchesStatus = filterStatus === 'todos' || normalize(item.estado) === normalize(filterStatus);
        
        return matchesSearch && matchesType && matchesStatus;
    });

    const newItemTypes = [
        { label: 'Historia de Usuario', icon: FileText, color: 'text-blue-500', path: `/project/${projectId}/story/new` },
        { label: 'Épica', icon: Target, color: 'text-orange-500', path: `/project/${projectId}/epics/new` },
        { label: 'Tarea', icon: ClipboardCheck, color: 'text-emerald-500', path: `/project/${projectId}/tasks/new` },
        { label: 'Bug (Error)', icon: BugIcon, color: 'text-red-500', path: `/project/${projectId}/bugs/new` },
    ];

    const getStatusColors = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pendiente':
            case 'nuevo':
                return 'bg-red-50 text-red-500 border-red-200';
            case 'en progreso':
            case 'activo':
                return 'bg-amber-50 text-amber-500 border-amber-200';
            case 'terminado':
            case 'hecho':
            case 'cerrado':
                return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            default:
                return 'bg-slate-50 text-slate-500 border-slate-200';
        }
    };

    return (
        <ProjectLayout>
            <main className="flex-1">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">Elementos de trabajo</h1>
                        <p className="text-[#64748B] text-sm font-medium mt-1">Gestiona y haz seguimiento a todos los tipos de trabajo de tu proyecto.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="relative">
                            <button
                                onClick={() => setIsNewItemMenuOpen(!isNewItemMenuOpen)}
                                className="bg-[#10B981] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#059669] transition-all shadow-lg shadow-[#10B981]/20 group"
                            >
                                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                                <span>Nuevo elemento</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isNewItemMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isNewItemMenuOpen && (
                                <div className="absolute top-full right-0 w-56 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                                    {newItemTypes.map((type) => (
                                        <Link
                                            key={type.label}
                                            to={type.path}
                                            className="w-full px-4 py-3 text-left text-xs font-bold text-slate-700 hover:bg-[#F8F9FA] flex items-center gap-3 transition-colors"
                                            onClick={() => setIsNewItemMenuOpen(false)}
                                        >
                                            <type.icon className={`w-4 h-4 ${type.color}`} />
                                            {type.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={importing}
                            className="bg-[#1A1A1A] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-black transition-all shadow-lg shadow-black/10 disabled:opacity-50"
                            title="Subir archivo Excel (.xlsx) para importar Historias de Usuario de forma masiva"
                        >
                            {importing ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <FileUp className="w-4 h-4" />
                            )}
                            <span>Importar HU (Excel)</span>
                        </button>

                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImportExcel} 
                            accept=".xlsx" 
                            className="hidden" 
                        />
                        
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#10B981] transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar elemento..."
                                className="bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] outline-none transition-all w-48 md:w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 border ${
                                showFilters ? 'bg-[#10B981]/10 border-[#10B981] text-[#10B981]' : 'bg-white border-slate-200 text-[#495057] hover:bg-[#F8F9FA]'
                            }`}
                        >
                            <Filter className="w-4 h-4" /> Filtros
                        </button>
                    </div>
                </header>

                {/* Sección de Filtros Dinámicos */}
                {showFilters && (
                    <div className="mb-8 p-6 bg-white border border-[#E9ECEF] rounded-[24px] shadow-sm animate-in slide-in-from-top-2 duration-300">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1 space-y-2">
                                <label className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-widest italic">Tipo de Item</label>
                                <div className="flex flex-wrap gap-2">
                                    {['todos', 'historia', 'epica', 'tarea', 'bug'].map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setFilterType(t)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                filterType === t 
                                                    ? 'bg-[#10B981] text-white' 
                                                    : 'bg-[#F8F9FA] text-[#64748B] hover:bg-[#E9ECEF]'
                                            }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 space-y-2">
                                <label className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-widest italic">Estado</label>
                                <div className="flex flex-wrap gap-2">
                                    {['todos', 'pendiente', 'en progreso', 'terminado'].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setFilterStatus(s)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                filterStatus === s 
                                                    ? 'bg-[#10B981] text-white' 
                                                    : 'bg-[#F8F9FA] text-[#64748B] hover:bg-[#E9ECEF]'
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => { setFilterType('todos'); setFilterStatus('todos'); setSearchTerm(''); }}
                                className="self-end p-2 text-[#ADB5BD] hover:text-[#F85149] transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-[32px] shadow-sm border border-[#E9ECEF] overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#F8F9FA] border-b border-[#E9ECEF] text-[10px] font-extrabold text-[#ADB5BD] uppercase tracking-widest">
                                <th className="px-8 py-5">ID</th>
                                <th className="px-8 py-5">Tipo</th>
                                <th className="px-8 py-5">Título</th>
                                <th className="px-8 py-5">Estado</th>
                                <th className="px-8 py-5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F3F5]">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-[#ADB5BD] font-black uppercase tracking-[.3em] italic animate-pulse">
                                        Sincronizando registros...
                                    </td>
                                </tr>
                            ) : filteredItems.length > 0 ? (
                                filteredItems.map((item) => (
                                    <tr 
                                        key={`${item.type}-${item.id}`} 
                                        className="hover:bg-[#F0FDF4]/30 transition-colors group"
                                    >
                                        <td className="px-8 py-5 text-sm font-bold text-[#ADB5BD]">#{item.id}</td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-lg bg-white shadow-sm border border-[#E9ECEF]`}>
                                                    <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.type}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-bold text-[#1A1A1A]">{item.titulo}</td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getStatusColors(item.estado)}`}>
                                                {item.estado}
                                            </span>
                                        </td>
    
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => navigate(item.route)}
                                                    className="p-2 text-[#ADB5BD] hover:text-[#10B981] hover:bg-[#10B981]/10 rounded-lg transition-all"
                                                    title="Editar"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => setItemToDelete(item)}
                                                    className="p-2 text-[#ADB5BD] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText className="w-12 h-12 text-[#DEE2E6] mb-2" />
                                            <p className="text-[#ADB5BD] text-xs font-black uppercase tracking-widest italic">No hay elementos de trabajo todavía</p>
                                            <button 
                                                onClick={() => setIsNewItemMenuOpen(true)}
                                                className="mt-4 text-[#10B981] text-[10px] font-black uppercase tracking-widest hover:underline"
                                            >
                                                Crear el primero
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <ConfirmDeleteModal 
                    isOpen={!!itemToDelete}
                    onClose={() => setItemToDelete(null)}
                    onConfirm={handleDelete}
                    loading={isDeleting}
                    title="¿Eliminar Work Item?"
                    message={`¿Estás seguro de que deseas eliminar permanentemente esta ${itemToDelete?.type}? Esta acción no se puede deshacer.`}
                />
            </main>
        </ProjectLayout>
    );
};

export default WorkItemsPage;
