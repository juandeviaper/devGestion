import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProjectLayout from '../components/ProjectLayout';
import { sprintService } from '../services/api';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Filter,
    Layers,
    Clock,
    Target,
    LayoutDashboard,
    ChevronDown,
    X,
    Info,
    Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Sprint } from '../types';

// --- Tipos y Configuración ---
type ViewType = 'month' | 'week' | 'roadmap';

const VIEW_CONFIG = {
    month: { icon: CalendarIcon, label: 'Mensual' },
    week: { icon: Clock, label: 'Semanal' },
    roadmap: { icon: Layers, label: 'Roadmap' }
};

const CalendarPage: React.FC = () => {
    // El calendario siempre requiere contexto local.
    const { projectId } = useParams<{ projectId: string }>();
    const [view, setView] = useState<ViewType>('month');
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    
    // Filtros simplificados
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

    // --- Utilidades de Fecha ---
    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const days = [];
        const prevMonthDays = daysInMonth(year, month - 1);
        const firstDay = firstDayOfMonth(year, month);
        const totalDays = daysInMonth(year, month);

        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ day: prevMonthDays - i, currentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
        }
        for (let i = 1; i <= totalDays; i++) {
            days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
        }
        const remainingSlots = 42 - days.length;
        for (let i = 1; i <= remainingSlots; i++) {
            days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
        }
        return days;
    };

    const getWeekDays = () => {
        const current = new Date(currentDate);
        const first = current.getDate() - current.getDay();
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(current.setDate(first + i));
            days.push({ day: date.getDate(), date: new Date(date) });
        }
        return days;
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

    // --- Renders de Vistas ---

    const renderMonthView = () => (
        <div className="flex-1 flex flex-col min-h-0 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-[24px] sm:rounded-[40px] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                <div className="min-w-[800px] min-h-[600px] flex flex-col h-full">
                    <div className="grid grid-cols-7 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur-md shrink-0 sticky top-0 z-20 shadow-sm">
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                            <div key={day} className="py-3 sm:py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest sm:tracking-[0.2em] whitespace-nowrap border-r border-slate-200/50 last:border-0">
                                <span>{day}</span>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 grid-rows-6 flex-1">
                        {generateCalendarDays().map((dateInfo, idx) => {
                            const isToday = new Date().toDateString() === dateInfo.date.toDateString();
                            const daySprints = filteredSprints.filter(s => isDateInSprint(dateInfo.date, s));

                            return (
                                <div key={idx} className={`border-r border-b border-slate-100/80 p-1.5 sm:p-2 min-h-[100px] flex flex-col group transition-colors hover:bg-slate-50/80 relative ${!dateInfo.currentMonth ? 'bg-slate-50/40 opacity-60' : 'bg-white'}`}>
                                    <div className="flex items-center justify-end mb-1">
                                        <span className={`text-[10px] sm:text-xs font-black w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg sm:rounded-[12px] transition-all duration-300 ${isToday
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 ring-2 ring-indigo-50'
                                                : 'text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50'
                                            }`}>
                                            {dateInfo.day}
                                        </span>
                                    </div>

                                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-0.5">
                                        {daySprints.map(s => {
                                            const isStart = isSprintStart(dateInfo.date, s);
                                            return (
                                                <Link
                                                    key={s.id} 
                                                    to={`/project/${projectId}/sprints/${s.id}`}
                                                    className="group/sprint text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-1 sm:py-1.5 text-white rounded-md sm:rounded-lg truncate shadow-sm transition-transform hover:-translate-y-[1px] active:scale-95 block"
                                                    style={{ backgroundColor: s.color || '#6366f1' }}
                                                    title={s.nombre}
                                                >
                                                    <span className="tracking-tight leading-none drop-shadow-sm">{isStart ? `🚀 ${s.nombre}` : s.nombre}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
    
    const renderWeekView = () => {
        const weekDays = getWeekDays();
        const daysLabels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        
        return (
             <div className="flex-1 flex flex-col min-h-0 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-[24px] sm:rounded-[40px] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                
                {/* Desktop Grid Layout */}
                <div className="hidden md:flex flex-col flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                    <div className="min-w-[800px] min-h-[500px] flex flex-col h-full relative">
                        <div className="grid grid-cols-7 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur-md shrink-0 sticky top-0 z-20 shadow-sm">
                            {daysLabels.map((day, idx) => {
                                const date = weekDays[idx].date;
                                const isToday = new Date().toDateString() === date.toDateString();
                                return (
                                    <div key={day} className={`py-4 text-center border-r border-slate-200/80 flex flex-col items-center gap-1 ${isToday ? 'bg-indigo-50/50' : ''}`}>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</span>
                                        <span className={`text-lg font-black mt-1 w-8 h-8 flex items-center justify-center rounded-xl ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700'}`}>
                                            {date.getDate()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="grid grid-cols-7 flex-1">
                            {weekDays.map((dateInfo, idx) => {
                                const isToday = new Date().toDateString() === dateInfo.date.toDateString();
                                const daySprints = filteredSprints.filter(s => isDateInSprint(dateInfo.date, s));
                                
                                return (
                                   <div key={idx} className={`border-r border-slate-100/80 p-3 h-full overflow-y-auto custom-scrollbar flex flex-col gap-2 ${isToday ? 'bg-indigo-50/20' : 'bg-white'}`}>
                                        {daySprints.length === 0 && (
                                            <div className="pt-4 flex items-center justify-center opacity-50">
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic text-center px-2">Sin actividad</span>
                                            </div>
                                        )}
                                        {daySprints.map(s => {
                                            const isStart = isSprintStart(dateInfo.date, s);
                                            return (
                                                <Link 
                                                    key={s.id} 
                                                    to={`/project/${projectId}/sprints/${s.id}`}
                                                    className="p-3 sm:p-4 rounded-[16px] text-white shadow-sm hover:shadow-md transition-all relative overflow-hidden block hover:-translate-y-0.5 active:scale-95"
                                                    style={{ backgroundColor: s.color || '#6366f1' }}
                                                >
                                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-black/10"></div>
                                                    <span className="text-[10px] sm:text-xs font-black tracking-tight leading-tight drop-shadow-sm flex items-start">
                                                        {isStart && <span className="mr-1">🚀</span>}
                                                        {s.nombre}
                                                    </span>
                                                </Link>
                                            );
                                        })}
                                   </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Mobile Responsive Layout (Timeline List) */}
                <div className="md:hidden flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-5 flex flex-col gap-4 bg-slate-50/30">
                    {weekDays.map((dateInfo, idx) => {
                        const isToday = new Date().toDateString() === dateInfo.date.toDateString();
                        const daySprints = filteredSprints.filter(s => isDateInSprint(dateInfo.date, s));
                        
                        return (
                            <div key={idx} className={`border rounded-[20px] overflow-hidden shadow-sm ${isToday ? 'border-indigo-200 bg-indigo-50/10' : 'border-slate-200/70 bg-white'}`}>
                                <div className={`px-4 py-3 border-b flex items-center justify-between ${isToday ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}>
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>
                                        {daysLabels[idx]}
                                    </span>
                                    <span className={`w-8 h-8 flex items-center justify-center rounded-[10px] text-xs font-black ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700 bg-white shadow-sm'}`}>
                                        {dateInfo.date.getDate()}
                                    </span>
                                </div>
                                <div className="p-4 flex flex-col gap-3">
                                    {daySprints.length === 0 ? (
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic flex items-center justify-center py-2">Sin actividad planificada</span>
                                    ) : (
                                        daySprints.map(s => {
                                            const isStart = isSprintStart(dateInfo.date, s);
                                            return (
                                                <Link 
                                                    key={s.id} 
                                                    to={`/project/${projectId}/sprints/${s.id}`}
                                                    className="p-3.5 rounded-xl text-white shadow-sm active:scale-[0.98] transition-transform relative overflow-hidden flex items-center"
                                                    style={{ backgroundColor: s.color || '#6366f1' }}
                                                >
                                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-black/10"></div>
                                                    <Target className="w-4 h-4 opacity-50 mr-2 shrink-0" />
                                                    <span className="text-[11px] font-black tracking-tight drop-shadow-sm flex-1 truncate">
                                                        {isStart && <span className="mr-1">🚀</span>}
                                                        {s.nombre}
                                                    </span>
                                                </Link>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        );
    };

    const renderRoadmapView = () => {
        if (filteredSprints.length === 0) {
            return (
                <div className="h-64 flex flex-col items-center justify-center text-slate-300 w-full">
                    <Layers className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-[0.3em] italic text-center px-4">No hay sprints planificados</p>
                </div>
            );
        }

        const sortedSprints = [...filteredSprints].sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime());
        
        let minDate = new Date(sortedSprints[0].fecha_inicio);
        let maxDate = new Date(sortedSprints[0].fecha_fin);
        
        sortedSprints.forEach(s => {
            const start = new Date(s.fecha_inicio);
            const end = new Date(s.fecha_fin);
            if (start < minDate) minDate = start;
            if (end > maxDate) maxDate = end;
        });

        // Asegurar margen temporal visual
        if ((maxDate.getTime() - minDate.getTime()) < 30 * 24 * 60 * 60 * 1000) {
            maxDate = new Date(minDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        }

        const viewStart = new Date(minDate);
        viewStart.setDate(viewStart.getDate() - 5);
        const viewEnd = new Date(maxDate);
        viewEnd.setDate(viewEnd.getDate() + 5);
        
        const totalDuration = viewEnd.getTime() - viewStart.getTime();

        const getPositionStyle = (start: string, end: string) => {
            const sTime = new Date(start).getTime();
            const eTime = new Date(end).getTime();
            let leftPercent = ((sTime - viewStart.getTime()) / totalDuration) * 100;
            let widthPercent = ((eTime - sTime) / totalDuration) * 100;
            
            leftPercent = Math.max(0, leftPercent);
            if (leftPercent + widthPercent > 100) widthPercent = 100 - leftPercent;

            return {
                left: `${leftPercent}%`,
                width: `${Math.max(2, widthPercent)}%`
            };
        };

        const markers = [];
        const curr = new Date(viewStart);
        curr.setDate(1);
        while (curr <= viewEnd) {
            if (curr >= viewStart) markers.push(new Date(curr));
            curr.setMonth(curr.getMonth() + 1);
        }

        return (
            <div className="flex-1 bg-white/70 backdrop-blur-md border border-[#E9ECEF] rounded-[24px] sm:rounded-[40px] overflow-hidden shadow-sm flex flex-col transition-shadow">
                <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar w-full p-4 sm:p-8">
                    <div className="min-w-[800px] lg:min-w-[1000px] relative h-full min-h-[400px]">
                        {/* Timeline Grid */}
                        <div className="absolute inset-0 flex border-l border-r border-[#E9ECEF]/80">
                            {markers.map((m, i) => {
                                const leftP = ((m.getTime() - viewStart.getTime()) / totalDuration) * 100;
                                return (
                                    <div key={i} className="absolute inset-y-0 border-l border-dashed border-slate-200/60" style={{ left: `${leftP}%` }}>
                                        <div className="absolute top-0 -translate-x-1/2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-b-lg border border-t-0 border-slate-100 shadow-sm z-10">
                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest whitespace-nowrap">
                                                {m.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Render Rows of Sprints */}
                        <div className="relative pt-14 flex flex-col gap-4 pb-8 z-20">
                            {sortedSprints.map((s) => (
                                <div key={s.id} className="relative h-12 w-full group/sprint">
                                    <div className="absolute inset-y-0 flex items-center px-1" style={getPositionStyle(s.fecha_inicio, s.fecha_fin)}>
                                        <Link 
                                            to={`/project/${projectId}/sprints/${s.id}`}
                                            className="w-full h-10 rounded-xl text-white shadow-md flex items-center px-3 sm:px-4 hover:scale-[1.01] hover:-translate-y-[2px] transition-all overflow-hidden relative cursor-pointer"
                                            style={{ backgroundColor: s.color || '#10b981' }}
                                            title={`${s.nombre}\nInicio: ${s.fecha_inicio}\nFin: ${s.fecha_fin}`}
                                        >
                                            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/10"></div>
                                            <Activity className="w-3.5 h-3.5 mr-2 opacity-60 shrink-0" />
                                            <span className="text-[10px] sm:text-xs font-bold truncate drop-shadow-sm">{s.nombre}</span>
                                            <div className="ml-auto opacity-0 group-hover/sprint:opacity-100 transition-opacity hidden sm:flex items-center gap-2 pl-4">
                                                <span className="text-[8px] bg-black/20 px-2 py-0.5 rounded-full font-black uppercase">{s.estado}</span>
                                            </div>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <ProjectLayout>
            <div className="h-full flex flex-col gap-4 lg:gap-6 overflow-hidden px-2 sm:px-4 lg:px-0 bg-[#F9FAFB]/30">
                
                {/* Header Section */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0 pt-4 lg:pt-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 sm:gap-5 mb-2 lg:mb-3">
                             <div className="p-3 sm:p-4 bg-white text-[#1E293B] rounded-[18px] sm:rounded-[24px] shadow-sm border border-slate-100 flex items-center justify-center">
                                <CalendarIcon className="w-5 h-5 sm:w-7 sm:h-7" />
                             </div>
                             <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl sm:text-2xl lg:text-4xl font-black text-[#0F172A] tracking-tighter leading-none">
                                        Calendario del Proyecto
                                    </h1>
                                </div>
                                <p className="text-[8px] sm:text-[10px] lg:text-xs text-[#64748B] font-black italic uppercase tracking-[0.2em] sm:tracking-[0.25em] opacity-80 mt-1.5 sm:mt-2.5 flex items-center gap-2">
                                    <span className="inline-block w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20"></span>
                                    {filteredSprints.length} Ciclos Mostrados
                                </p>
                             </div>
                        </div>
                    </div>

                    {/* View Switcher & Controls */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-5 lg:translate-y-2">
                        <div className="flex bg-white p-1.5 rounded-[20px] sm:rounded-[28px] border border-[#E9ECEF] shadow-sm backdrop-blur-sm overflow-x-auto no-scrollbar max-w-full">
                            {(Object.keys(VIEW_CONFIG) as ViewType[]).map((v) => {
                                const Icon = VIEW_CONFIG[v].icon;
                                return (
                                    <button
                                        key={v}
                                        onClick={() => setView(v)}
                                        className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-[16px] sm:rounded-[24px] text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                                            view === v 
                                                ? 'bg-[#0F172A] text-white shadow-xl shadow-slate-900/30' 
                                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        <span>{VIEW_CONFIG[v].label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-3 sm:p-4 rounded-[18px] sm:rounded-[24px] border transition-all duration-300 shadow-sm ${
                                showFilters ? 'bg-indigo-600 border-indigo-700 text-white shadow-indigo-600/20' : 'bg-white border-[#E9ECEF] text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            <Filter className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        </button>
                    </div>
                </div>

                {/* Filters Drawer */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 bg-white p-4 sm:p-8 rounded-[28px] sm:rounded-[40px] border border-[#E9ECEF] shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-top-4 duration-500 shrink-0">
                        <div className="hidden md:col-span-1 md:flex items-center justify-center">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <LayoutDashboard className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="md:col-span-10 lg:col-span-8 space-y-2">
                            <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado del Sprint</label>
                            <div className="relative group">
                                <select 
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 group-hover:border-indigo-300 group-hover:bg-white rounded-xl sm:rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3.5 text-[10px] sm:text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 appearance-none cursor-pointer transition-all"
                                >
                                    <option value="all">⚡ Todos los Sprints</option>
                                    <option value="planeado">📂 Planificado</option>
                                    <option value="activo">🟢 Activo</option>
                                    <option value="terminado">🔵 Terminado</option>
                                </select>
                                <ChevronDown className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
                            </div>
                        </div>

                        <div className="md:col-span-1 lg:col-span-3 flex items-end justify-end pb-1 gap-4">
                            <button 
                                onClick={() => setFilterStatus('all')}
                                className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-indigo-600"
                                title="Limpiar Filtros"
                            >
                                <X className="w-5 h-5 sm:w-4 sm:h-4" />
                                <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest">Reset</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 min-h-0 flex flex-col min-w-0">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-6">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin"></div>
                            <span className="italic font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] animate-pulse text-[8px] sm:text-xs text-center">Sincronizando Nodo Cronos...</span>
                        </div>
                    ) : (
                        <>
                            {(view === 'month' || view === 'week') && (
                                <div className="flex-1 flex flex-col gap-4 sm:gap-6 min-h-0 min-w-0">
                                    {/* Navigation Header */}
                                    <div className="flex items-center justify-between w-full sm:w-[500px] mx-auto bg-white/80 px-2 sm:px-5 py-2 sm:py-3.5 rounded-[20px] sm:rounded-[28px] border border-slate-200/80 shadow-md backdrop-blur-md z-10 shrink-0">
                                        <button 
                                            onClick={() => {
                                                if (view === 'month') {
                                                    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
                                                } else {
                                                    setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)));
                                                }
                                            }}
                                            className="p-2 sm:p-3 bg-slate-50/50 hover:bg-slate-100 rounded-xl sm:rounded-[16px] transition-all text-slate-400 hover:text-indigo-600 active:scale-95"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        
                                        <div className="flex flex-col items-center flex-1 cursor-pointer group" onClick={() => setCurrentDate(new Date())} title="Ir a Hoy">
                                            <h3 className="text-[11px] sm:text-sm font-black text-slate-800 uppercase tracking-[0.1em] sm:tracking-[0.2em] flex items-center justify-center gap-1 sm:gap-2 group-hover:text-indigo-600 transition-colors">
                                                {view === 'month' 
                                                    ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                                                    : `Semana ${currentDate.getDate()} ${monthNames[currentDate.getMonth()].substring(0,3)}`
                                                }
                                            </h3>
                                            <span className="text-[8px] text-slate-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-4 hidden sm:block">Ir a Hoy</span>
                                        </div>
                                        
                                        <button 
                                            onClick={() => {
                                                if(view === 'month') {
                                                    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
                                                } else {
                                                    setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)));
                                                }
                                            }}
                                            className="p-2 sm:p-3 bg-slate-50/50 hover:bg-slate-100 rounded-xl sm:rounded-[16px] transition-all text-slate-400 hover:text-indigo-600 active:scale-95"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="flex-1 min-h-0 overflow-hidden rounded-[24px] sm:rounded-[40px] flex flex-col">
                                        {view === 'month' ? renderMonthView() : renderWeekView()}
                                    </div>
                                </div>
                            )}
                            {view === 'roadmap' && (
                                <div className="flex-1 min-h-0 min-w-0 flex flex-col">
                                    {renderRoadmapView()}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Legend & Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-4 lg:py-6 border-t border-slate-100 shrink-0">
                    <div className="flex items-center gap-4 sm:gap-8 ml-auto">
                        <div className="flex items-center gap-2.5 px-4 sm:px-6 py-2 sm:py-3 bg-slate-50 rounded-xl sm:rounded-2xl text-slate-400 border border-transparent transition-all group">
                             <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-12 transition-transform" />
                             <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest leading-none">Colores representan la configuración exclusiva de cada Sprint</span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </ProjectLayout>
    );
};

export default CalendarPage;
