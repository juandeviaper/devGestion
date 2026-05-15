import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { projectService } from '../services/api';
import {
    Layers,
    Kanban,
    Calendar,
    Users,
    Activity,
    ChevronRight,
    Search,
    Clock,
    Menu,
    ClipboardCheck,
    Settings,
    BarChart3,
    RefreshCw,
    TrendingUp,
    ChevronDown,
    MoreHorizontal,
} from 'lucide-react';
import NotificationGroup from './NotificationGroup';
import { authService } from '../services/authService';
import type { Project, ProjectMember } from '../types';


interface ProjectLayoutProps {
    children: React.ReactNode;
}

const ProjectLayout: React.FC<ProjectLayoutProps> = ({ children }) => {
    const { projectId } = useParams<{ projectId: string }>();
    const location = useLocation();
    const [project, setProject] = useState<Project | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const [role, setRole] = useState<string | null>(null);
    const user = authService.getUser();


    useEffect(() => {
        const fetchProjectData = async () => {
            if (!projectId) return;
            try {
                const [pRes, mRes] = await Promise.all([
                    projectService.getById(projectId),
                    projectService.getMembers(projectId)
                ]);
                setProject(pRes.data);
                const member = mRes.data.find((m: ProjectMember) => m.usuario === user?.id);
                setRole(member?.rol_proyecto || (pRes.data.creador.id === user?.id ? 'dueño' : null));
            } catch (err: unknown) {
                console.error("Error loading project context:", err);
            }
        };

        fetchProjectData();
    }, [projectId, user?.id]);

    useEffect(() => {
        if (project && user && !role) {
            if (project.creador.id === user.id) setRole('dueño');
        }
    }, [project, user, role]);

    const isMember = role !== null || user?.is_staff;
    const isOwner = role === 'dueño' || user?.is_staff;

    const allNavItems = [
        { icon: <Activity className="w-4 h-4" />, label: 'Overview', path: `/project/${projectId}` },
        { icon: <ClipboardCheck className="w-4 h-4" />, label: 'Work Items', path: `/project/${projectId}/work-items` },
        { icon: <Layers className="w-4 h-4" />, label: 'Backlog', path: `/project/${projectId}/backlog` },
        { icon: <Kanban className="w-4 h-4" />, label: 'Tablero', path: `/project/${projectId}/kanban` },
        { icon: <Clock className="w-4 h-4" />, label: 'Sprints', path: `/project/${projectId}/sprints` },
        { icon: <Calendar className="w-4 h-4" />, label: 'Calendario', path: `/project/${projectId}/calendar` },
        { icon: <RefreshCw className="w-4 h-4" />, label: 'Ceremonias', path: `/project/${projectId}/ceremonies` },
        { icon: <TrendingUp className="w-4 h-4" />, label: 'Analytics', path: `/project/${projectId}/analytics` },
        ...(isMember ? [
            { icon: <BarChart3 className="w-4 h-4" />, label: 'Reportes', path: `/project/${projectId}/reports` },
            { icon: <Users className="w-4 h-4" />, label: 'Miembros', path: `/project/${projectId}/members` }
        ] : []),
    ];

    const mainItems = allNavItems.slice(0, 5);
    const secondaryItems = allNavItems.slice(5);
    const isSecondaryActive = secondaryItems.some(item => location.pathname === item.path);

    // Close "More" dropdown when navigating
    useEffect(() => {
        setIsMoreOpen(false);
    }, [location.pathname]);

    // Close "More" dropdown when clicking outside
    useEffect(() => {
        if (!isMoreOpen) return;
        const handleClickOutside = () => setIsMoreOpen(false);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [isMoreOpen]);


    return (
        <div className="min-h-screen bg-[#F8F9FA] flex text-[#1A1A1A] font-sans selection:bg-[#10B981]/20 overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[100] md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Sidebar (Global) */}
            <div className={`fixed inset-y-0 left-0 z-[101] transition-transform duration-300 transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                {/* Header Superior */}
                <header className="h-16 bg-white border-b border-[#E9ECEF] flex items-center justify-between px-4 lg:px-8 shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 md:hidden text-[#64748B] hover:bg-[#F8F9FA] rounded-xl transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-2 text-xs text-[#64748B] font-bold overflow-hidden">
                            <Link to="/dashboard" className="hidden sm:inline hover:text-[#5e17eb] cursor-pointer transition-colors shrink-0">DevGestión</Link>
                            <ChevronRight className="hidden sm:inline w-3 h-3 shrink-0" />
                            <div className="w-8 h-8 bg-[#0F172A] rounded-lg flex items-center justify-center text-[#10B981] shrink-0 shadow-lg shadow-[#0F172A]/10">
                                {project?.nombre?.charAt(0).toUpperCase() || 'P'}
                            </div>
                            <span className="text-[#1A1A1A] font-black truncate max-w-[120px] sm:max-w-none">{project?.nombre || 'Cargando...'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="hidden md:flex relative group mr-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#ADB5BD]" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg py-1.5 pl-9 pr-3 text-[11px] w-48 focus:w-64 focus:ring-2 focus:ring-[#10B981]/10 focus:border-[#10B981] transition-all"
                            />
                        </div>
                        <NotificationGroup />

                        {isOwner && (
                            <Link 
                                to={`/project/${projectId}/settings`}
                                className="p-2 text-[#64748B] hover:bg-[#10B981]/5 hover:text-[#10B981] rounded-lg transition-all border border-transparent hover:border-[#10B981]/10"
                                title="Ajustes del Proyecto"
                            >
                                <Settings className="w-5 h-5" />
                            </Link>
                        )}
                        
                    </div>
                </header>

                {/* Sub-Header Horizontal Navigation (Tabs) */}
                <nav className="bg-white border-b border-[#E9ECEF] px-4 md:px-8 shrink-0 flex items-center h-14 relative z-20">
                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-1 h-full">
                        {mainItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.label}
                                    to={item.path}
                                    className={`flex items-center gap-2 px-4 h-full border-b-2 transition-all whitespace-nowrap text-xs font-bold leading-none ${isActive
                                            ? 'border-[#10B981] text-[#10B981] bg-[#F0FDF4]/50'
                                            : 'border-transparent text-[#64748B] hover:text-[#1A1A1A] hover:bg-[#F8F9FA]'
                                        }`}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}

                        {/* More Dropdown */}
                        {secondaryItems.length > 0 && (
                            <div className="relative h-full" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => setIsMoreOpen(!isMoreOpen)}
                                    className={`flex items-center gap-2 px-4 h-full border-b-2 transition-all whitespace-nowrap text-xs font-bold leading-none ${isSecondaryActive
                                            ? 'border-[#10B981] text-[#10B981] bg-[#F0FDF4]/50'
                                            : 'border-transparent text-[#64748B] hover:text-[#1A1A1A] hover:bg-[#F8F9FA]'
                                        }`}
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                    <span>Más</span>
                                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isMoreOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-[#E9ECEF] rounded-2xl shadow-xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {secondaryItems.map((item) => {
                                            const isActive = location.pathname === item.path;
                                            return (
                                                <Link
                                                    key={item.label}
                                                    to={item.path}
                                                    className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl text-xs font-bold transition-all ${isActive
                                                            ? 'bg-[#F0FDF4] text-[#10B981]'
                                                            : 'text-[#64748B] hover:bg-[#F8F9FA] hover:text-[#1A1A1A]'
                                                        }`}
                                                >
                                                    <span className={isActive ? 'text-[#10B981]' : 'text-[#94A3B8]'}>{item.icon}</span>
                                                    <span>{item.label}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Mobile/Tablet Scrollable Navigation */}
                    <div className="lg:hidden flex items-center gap-2 h-full overflow-x-auto no-scrollbar w-full">
                        {allNavItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.label}
                                    to={item.path}
                                    className={`flex items-center gap-2 px-4 h-full border-b-2 transition-all whitespace-nowrap text-xs font-bold leading-none ${isActive
                                            ? 'border-[#10B981] text-[#10B981] bg-[#F0FDF4]/50'
                                            : 'border-transparent text-[#64748B] hover:text-[#1A1A1A] hover:bg-[#F8F9FA]'
                                        }`}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Main Viewport */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 relative bg-[#F8F9FA]">
                    {children}
                </div>
            </main>

            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default ProjectLayout;
