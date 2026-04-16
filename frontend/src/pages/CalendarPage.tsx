import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProjectLayout from '../components/ProjectLayout';
import { sprintService } from '../services/api';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Filter,
    Activity,
    ChevronDown,
    X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Sprint } from '../types';

const CalendarPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!projectId) return;
            try {
                setLoading(true);
                const sRes = await sprintService.getByProject(projectId);
                setSprints(sRes.data);
            } catch (err: unknown) {
                console.error(err);
                toast.error("Error al cargar los Sprints del calendario");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [projectId]);

    const filteredSprints = useMemo(() => {
        return sprints.filter(s => {
            return filterStatus === 'all' || s.estado === filterStatus;
        });
    }, [sprints, filterStatus]);

    // Helpers
    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };

    const isDateInSprint = (date: Date, sprint: Sprint) => {
        const d = new Date(date).setHours(0, 0, 0, 0);
        const [sy, sm, sd] = sprint.fecha_inicio.split('-').map(Number);
        const start = new Date(sy, sm - 1, sd).setHours(0, 0, 0, 0);
        
        const [ey, em, ed] = sprint.fecha_fin.split('-').map(Number);
        const end = new Date(ey, em - 1, ed).setHours(0, 0, 0, 0);
        
        return d >= start && d <= end;
    };

    const isSprintStart = (date: Date, sprint: Sprint) => {
        const [sy, sm, sd] = sprint.fecha_inicio.split('-').map(Number);
        const start = new Date(sy, sm - 1, sd);
        return start.toDateString() === date.toDateString();
    };

    // Generate Calendar Grid (42 cells: 6 weeks * 7 days)
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const cells = [];
        
        // Previous month days
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            cells.push({
                date: new Date(year, month - 1, daysInPrevMonth - i),
                isCurrentMonth: false
            });
        }
        
        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            cells.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            });
        }
        
        // Next month days (to fill 42 cells)
        const remaining = 42 - cells.length;
        for (let i = 1; i <= remaining; i++) {
            cells.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false
            });
        }
        
        return cells;
    }, [currentDate]);

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    return (
        <ProjectLayout>
            <div className="h-full flex flex-col p-2 sm:p-4 lg:p-8 bg-[#F8F9FA] overflow-hidden">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6 shrink-0">
                    <div>
                        <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-[#1A1A1A] tracking-tight flex items-center gap-2 sm:gap-3">
                            <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-[#10B981]" />
                            Calendario
                        </h1>
                        <p className="text-[10px] sm:text-xs font-semibold text-[#64748B] tracking-widest uppercase mt-1 sm:mt-2 opacity-80">
                            Vista mensual de iteraciones
                        </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-2 sm:gap-3 bg-white p-1.5 sm:p-2 border border-[#E9ECEF] rounded-[16px] sm:rounded-2xl shadow-sm">
                        <button 
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                            className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-colors text-slate-500 hover:text-[#10B981]"
                        >
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <div 
                            className="flex-1 sm:w-48 text-center cursor-pointer hover:text-[#10B981] transition-colors"
                            onClick={() => setCurrentDate(new Date())}
                            title="Volver a hoy"
                        >
                            <span className="text-[11px] sm:text-base font-black text-[#1A1A1A] uppercase tracking-wider">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </span>
                        </div>
                        <button 
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                            className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-colors text-slate-500 hover:text-[#10B981]"
                        >
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>

                        <div className="w-px h-6 sm:h-8 bg-slate-200 mx-0.5 sm:mx-1"></div>

                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-colors ${showFilters ? 'bg-[#10B981] text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-[#10B981]'}`}
                        >
                            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="mb-6 p-4 bg-white border border-[#E9ECEF] rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2 shrink-0 flex flex-wrap items-end gap-6 justify-between">
                        <div className="flex-1 w-full max-w-sm">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1block">Filtrar por Estado</label>
                            <div className="relative mt-2">
                                <select 
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#10B981]/50 premium-select transition-all cursor-pointer"
                                >
                                    <option value="all">⚡ Todos</option>
                                    <option value="planeado">📂 Planificado</option>
                                    <option value="activo">🟢 Activo</option>
                                    <option value="terminado">🔵 Terminado</option>
                                </select>
                            </div>
                        </div>
                        <button 
                            onClick={() => setFilterStatus('all')}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 font-bold text-xs uppercase"
                        >
                            <X className="w-4 h-4" /> Limpiar
                        </button>
                    </div>
                )}

                {/* Calendar Grid Container */}
                <div className="flex-1 min-h-0 bg-white border border-[#E9ECEF] rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-sm flex flex-col">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                            <div className="w-12 h-12 border-4 border-slate-100 border-t-[#10B981] rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <>
                            {/* Days Header */}
                            <div className="grid grid-cols-7 border-b border-[#E9ECEF] bg-slate-50 shrink-0">
                                {weekDays.map((day, idx) => (
                                    <div key={idx} className="py-2 sm:py-3 text-center border-r border-[#E9ECEF] last:border-0">
                                        <span className="text-[8px] sm:text-[11px] font-black text-[#64748B] uppercase tracking-widest select-none">
                                            {day}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Body */}
                            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-7 h-full w-full">
                                    {calendarDays.map((cell, idx) => {
                                        const daySprints = filteredSprints.filter(s => isDateInSprint(cell.date, s));
                                        const visibleSprints = daySprints.slice(0, 2);
                                        const hiddenCount = daySprints.length - visibleSprints.length;
                                        
                                        const currentIsToday = isToday(cell.date);

                                        return (
                                            <div 
                                                key={idx} 
                                                className={`
                                                    min-h-[70px] sm:min-h-[120px] p-0.5 sm:p-2 border-b border-r border-[#E9ECEF] last:border-r-0 flex flex-col group transition-colors relative
                                                    ${cell.isCurrentMonth ? 'bg-white hover:bg-slate-50/50' : 'bg-slate-50/50 opacity-60'}
                                                    ${currentIsToday ? 'bg-emerald-50/10' : ''}
                                                `}
                                            >
                                                {/* Day Number */}
                                                <div className="flex justify-end mb-0.5 sm:mb-1">
                                                    <div className={`
                                                        w-4 h-4 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[9px] sm:text-xs font-black select-none transition-all
                                                        ${currentIsToday 
                                                            ? 'bg-[#10B981] text-white shadow-md shadow-[#10B981]/30 ring-1 sm:ring-2 ring-emerald-100' 
                                                            : 'text-[#64748B] group-hover:bg-slate-200/50'}
                                                    `}>
                                                        {cell.date.getDate()}
                                                    </div>
                                                </div>

                                                {/* Events List */}
                                                <div className="flex-1 flex flex-col gap-0.5 sm:gap-1 overflow-visible">
                                                    {visibleSprints.map(s => {
                                                        const isStart = isSprintStart(cell.date, s);
                                                        return (
                                                            <Link
                                                                key={s.id}
                                                                to={`/project/${projectId}/sprints/${s.id}`}
                                                                className="px-0.5 sm:px-2 py-0.5 sm:py-1 rounded-[4px] sm:rounded-lg text-white shadow-sm hover:shadow-md transition-all hover:scale-[1.02] flex items-center min-w-0"
                                                                style={{ backgroundColor: s.color || '#6366f1' }}
                                                                title={`${s.nombre} (${s.estado})`}
                                                            >
                                                                <span className="text-[7px] sm:text-[10px] font-bold truncate leading-none sm:leading-tight drop-shadow-sm flex items-center min-w-0">
                                                                    {isStart && <Activity className="hidden sm:block w-3 h-3 mr-1 opacity-80 shrink-0" />}
                                                                    <span className="truncate">{s.nombre}</span>
                                                                </span>
                                                            </Link>
                                                        );
                                                    })}
                                                    
                                                    {/* +X More Indicator */}
                                                    {hiddenCount > 0 && (
                                                        <div className="mt-auto px-0.5 sm:px-1">
                                                            <span className="text-[6px] sm:text-[9px] font-extrabold text-[#64748B] bg-slate-100 px-1 sm:px-1.5 py-0.5 rounded-[4px] sm:rounded-md select-none block w-full text-center hover:bg-slate-200 transition-colors cursor-help" title={`${hiddenCount} sprints más activos hoy.`}>
                                                                +{hiddenCount} <span className="hidden sm:inline">más</span>
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #94A3B8; }
            `}</style>
        </ProjectLayout>
    );
};

export default CalendarPage;

