import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProjectLayout from '../components/ProjectLayout';
import { analyticsService } from '../services/api';
import {
    TrendingUp,
    CheckCircle2,
    Clock,
    PieChart,
    BarChart,
    Target
} from 'lucide-react';
import toast from 'react-hot-toast';

const AnalyticsPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!projectId) return;
            try {
                setLoading(true);
                const res = await analyticsService.getProjectDashboard(projectId);
                setData(res.data);
            } catch (err) {
                toast.error('Error al cargar métricas');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [projectId]);

    if (loading) {
        return (
            <ProjectLayout>
                <div className="py-20 text-center font-black text-[#ADB5BD] animate-pulse uppercase tracking-[0.3em]">
                    Calculando Algoritmos de Rendimiento...
                </div>
            </ProjectLayout>
        );
    }

    const sprintActual = data?.sprint_actual;

    return (
        <ProjectLayout>
            <div className="max-w-6xl mx-auto space-y-10">
                <header>
                    <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tighter">Analytics Avanzado</h1>
                    <p className="text-xs text-[#64748B] font-bold uppercase tracking-widest">Métricas de rendimiento y salud del proyecto</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard 
                        title="Velocidad (HU)" 
                        value={data?.velocidad_promedio_hu || 0} 
                        label="Promedio por Sprint"
                        color="text-[#10B981]" 
                        icon={TrendingUp} 
                    />
                    <MetricCard 
                        title="Velocidad (Puntos)" 
                        value={data?.velocidad_promedio_puntos || 0} 
                        label="Promedio por Sprint"
                        color="text-[#0F172A]" 
                        icon={BarChart} 
                    />
                    <MetricCard 
                        title="Total Historias" 
                        value={data?.total_historias_proyecto || 0} 
                        label="En todo el proyecto"
                        color="text-blue-600" 
                        icon={CheckCircle2} 
                    />
                    <MetricCard 
                        title="Total Puntos" 
                        value={data?.total_puntos_proyecto || 0} 
                        label="Backlog total"
                        color="text-emerald-600" 
                        icon={Target} 
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Sprint Actual */}
                    <div className="bg-white p-8 rounded-[40px] border border-[#E9ECEF] shadow-sm">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-xl font-black text-[#1A1A1A] tracking-tighter">Sprint Actual</h2>
                                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">{sprintActual?.nombre || 'Ningún sprint activo'}</p>
                            </div>
                            <div className="w-12 h-12 bg-[#0F172A] rounded-2xl flex items-center justify-center text-[#10B981]">
                                <Clock className="w-6 h-6" />
                            </div>
                        </div>

                        {sprintActual ? (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                        <span className="text-[#64748B]">Progreso del Sprint</span>
                                        <span className="text-[#10B981]">{Math.round(sprintActual.porcentaje_cumplimiento)}%</span>
                                    </div>
                                    <div className="w-full bg-[#F8F9FA] h-3 rounded-full overflow-hidden border border-[#DEE2E6]">
                                        <div 
                                            className="bg-[#10B981] h-full rounded-full transition-all duration-1000" 
                                            style={{ width: `${sprintActual.porcentaje_cumplimiento}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-[#DEE2E6]">
                                        <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1">HU Completadas</p>
                                        <p className="text-lg font-black text-[#1A1A1A]">{sprintActual.terminadas_hu} / {sprintActual.total_hu}</p>
                                    </div>
                                    <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-[#DEE2E6]">
                                        <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1">Puntos Terminados</p>
                                        <p className="text-lg font-black text-[#1A1A1A]">{sprintActual.puntos_terminados} / {sprintActual.puntos_totales}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-10 text-center italic text-[#ADB5BD] text-sm">
                                No hay un sprint activo para mostrar métricas de progreso.
                            </div>
                        )}
                    </div>

                    {/* Tendencia de Velocidad */}
                    <div className="bg-white p-8 rounded-[40px] border border-[#E9ECEF] shadow-sm">
                        <div className="flex justify-between items-start mb-8">
                            <h2 className="text-xl font-black text-[#1A1A1A] tracking-tighter">Tendencia de Velocidad</h2>
                            <PieChart className="w-6 h-6 text-[#DEE2E6]" />
                        </div>
                        <div className="h-48 flex items-end gap-3 px-4">
                            {data?.tendencia_velocidad?.length > 0 ? (
                                data.tendencia_velocidad.map((v: any, i: number) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                        <div className="w-full bg-[#10B981]/10 rounded-t-xl relative group cursor-help" style={{ height: `${(v.puntos / (data.velocidad_promedio_puntos * 2 || 1)) * 100}%`, minHeight: '10%' }}>
                                            <div className="absolute inset-0 bg-[#10B981] rounded-t-xl opacity-0 group-hover:opacity-100 transition-all"></div>
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white text-[8px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap">
                                                {v.puntos} pts
                                            </div>
                                        </div>
                                        <span className="text-[8px] font-bold text-[#64748B] uppercase truncate w-full text-center">{v.sprint}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="w-full h-full flex items-center justify-center italic text-[#ADB5BD] text-sm">
                                    Insuficientes datos para mostrar tendencia.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ProjectLayout>
    );
};

interface MetricCardProps {
    title: string;
    value: string | number;
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, label, color, icon: Icon }) => (
    <div className="bg-white p-6 rounded-[32px] border border-[#E9ECEF] shadow-sm hover:ring-2 hover:ring-[#10B981]/10 transition-all group">
        <div className="flex justify-between items-center mb-4">
            <div className={`w-10 h-10 bg-[#F8F9FA] rounded-xl flex items-center justify-center group-hover:bg-[#10B981] group-hover:text-white transition-all border border-[#DEE2E6]`}>
                <Icon className={`w-5 h-5 ${color} group-hover:text-white transition-all`} />
            </div>
        </div>
        <h3 className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-1">{title}</h3>
        <p className="text-3xl font-black text-[#1A1A1A]">{value}</p>
        <p className="text-[9px] font-bold text-[#ADB5BD] uppercase tracking-widest mt-1 italic">{label}</p>
    </div>
);

export default AnalyticsPage;
