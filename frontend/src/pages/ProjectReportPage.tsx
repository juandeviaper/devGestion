import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProjectLayout from '../components/ProjectLayout';
import { projectService } from '../services/api';
import { 
    Download, 
    BarChart3, 
    PieChart, 
    TrendingUp, 
    TrendingDown, 
    CheckCircle2, 
    Clock, 
    DollarSign,
    Target
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ProjectReportPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            if (!projectId) return;
            try {
                setLoading(true);
                const res = await projectService.getMetrics(projectId);
                setStats(res.data);
            } catch (err) {
                toast.error('Error al cargar métricas del proyecto');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [projectId]);

    const handleDownloadPDF = async () => {
        if (!projectId) return;
        try {
            setDownloading(true);
            const res = await projectService.downloadReport(projectId);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Reporte_${stats?.nombre || 'Proyecto'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Reporte PDF generado con éxito');
        } catch (err) {
            toast.error('Error al generar el PDF');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return (
        <ProjectLayout>
            <div className="flex flex-col items-center justify-center h-[60vh] text-[#ADB5BD] gap-4 animate-pulse">
                <BarChart3 className="w-12 h-12" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] italic text-center">Calculando métricas de rendimiento...</p>
            </div>
        </ProjectLayout>
    );

    const isOverBudget = stats?.total_real > stats?.total_estimado;

    return (
        <ProjectLayout>
            <div className="max-w-6xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[#F1F3F5] pb-12">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-black text-[#1A1A1A] mb-4 tracking-tighter">
                            Analítica de Proyecto <Target className="inline-block w-8 lg:w-10 h-8 lg:h-10 text-[#10B981] ml-2" />
                        </h1>
                        <p className="text-[10px] lg:text-xs text-[#64748B] font-black italic uppercase tracking-[0.2em] opacity-70">
                            Rendimiento SCRUM: {stats?.nombre}
                        </p>
                    </div>
                    <button 
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                        className="w-full md:w-auto px-10 py-4 bg-[#1A1A1A] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-2xl"
                    >
                        {downloading ? 'Generando...' : <><Download className="w-4 h-4" /> Exportar Reporte PDF</>}
                    </button>
                </div>

                {/* Primary Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <StatCard 
                        icon={<CheckCircle2 className="w-5 h-5" />}
                        label="Progreso General"
                        value={`${stats?.progreso.toFixed(1)}%`}
                        color="#10B981"
                        sub={`HU Finalizadas: ${stats?.stories_done}/${stats?.stories_total}`}
                    />
                    <StatCard 
                        icon={<Clock className="w-5 h-5" />}
                        label="Horas Invertidas"
                        value={`${stats?.total_real} hrs`}
                        color={isOverBudget ? '#EF4444' : '#3B82F6'}
                        sub={`Estimado: ${stats?.total_estimado} hrs`}
                        trend={isOverBudget ? 'down' : 'up'}
                    />
                    <StatCard 
                        icon={<DollarSign className="w-5 h-5" />}
                        label="Costo Real"
                        value={`$${stats?.costo_real.toLocaleString()}`}
                        color="#000000"
                        sub={`Tarifa Promedio: $50/hr`}
                    />
                </div>

                {/* Visualizations Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Execution Bar Chart (CSS Based) */}
                    <div className="bg-white border border-[#E9ECEF] p-10 rounded-[3rem] shadow-sm">
                        <div className="flex items-center gap-4 mb-10">
                            <BarChart3 className="w-6 h-6 text-[#64748B]" />
                            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#ADB5BD] italic">Ejecución de Tiempo</h3>
                        </div>
                        
                        <div className="space-y-10">
                            <div>
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Estimado Inicial</span>
                                    <span className="text-xl font-black text-[#1A1A1A]">{stats?.total_estimado}h</span>
                                </div>
                                <div className="h-6 w-full bg-[#F8F9FA] rounded-full overflow-hidden border border-[#E9ECEF]">
                                    <div className="h-full bg-[#E9ECEF] transition-all" style={{ width: '100%' }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Real Consumido</span>
                                    <span className="text-xl font-black" style={{ color: isOverBudget ? '#EF4444' : '#10B981' }}>{stats?.total_real}h</span>
                                </div>
                                <div className="h-6 w-full bg-[#F8F9FA] rounded-full overflow-hidden border border-[#E9ECEF]">
                                    <div 
                                        className="h-full transition-all" 
                                        style={{ 
                                            width: `${Math.min(100, (stats?.total_real / stats?.total_estimado) * 100)}%`,
                                            backgroundColor: isOverBudget ? '#EF4444' : '#10B981'
                                        }}
                                    ></div>
                                </div>
                                {isOverBudget && <p className="text-[9px] font-black text-red-500 uppercase italic mt-4">⚠️ Desviación del {(stats?.total_real / stats.total_estimado * 100 - 100).toFixed(0)}% sobre el presupuesto.</p>}
                            </div>
                        </div>
                    </div>

                    {/* Completion Ring (SVG Based) */}
                    <div className="bg-[#1A1A1A] p-10 rounded-[3rem] text-white overflow-hidden relative group">
                        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
                        <div className="flex items-center gap-4 mb-10">
                            <PieChart className="w-6 h-6 text-[#10B981]" />
                            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40 italic">Velocidad de Entrega</h3>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="relative w-48 h-48">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="80"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        fill="transparent"
                                        className="text-white/5"
                                    />
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="80"
                                        stroke="#10B981"
                                        strokeWidth="12"
                                        fill="transparent"
                                        strokeDasharray={2 * Math.PI * 80}
                                        strokeDashoffset={2 * Math.PI * 80 * (1 - stats?.progreso / 100)}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black tracking-tighter">{Math.round(stats?.progreso)}%</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-white/30 italic">Completado</span>
                                </div>
                            </div>
                            <div className="mt-10 text-center">
                                {/* Frase eliminada */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProjectLayout>
    );
};

const StatCard = ({ icon, label, value, sub, color, trend }: any) => (
    <div className="bg-white border border-[#E9ECEF] p-8 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center justify-between mb-8">
            <div className={`p-3 rounded-xl`} style={{ backgroundColor: `${color}11`, color }}>
                {icon}
            </div>
            {trend && (
                <div className={`p-1.5 rounded-lg ${trend === 'up' ? 'text-[#10B981] bg-[#F0FDF4]' : 'text-red-500 bg-red-50'}`}>
                    {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>
            )}
        </div>
        <p className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-widest mb-1 italic">{label}</p>
        <h3 className="text-3xl font-black text-[#1A1A1A] mb-2 tracking-tighter">{value}</h3>
        <p className="text-[9px] font-black text-[#64748B] uppercase tracking-widest italic">{sub}</p>
    </div>
);

export default ProjectReportPage;
