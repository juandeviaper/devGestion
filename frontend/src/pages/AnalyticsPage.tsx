import React from 'react';
import {
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle2,
    Clock,
    PieChart,
    ArrowRight,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';
import Sidebar from '../components/Sidebar';

const AnalyticsPage: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
                <header className="mb-10">
                    <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">Análisis y Métricas</h1>
                    <p className="text-[#64748B] text-sm font-medium mt-1">Monitorea el rendimiento del equipo y la salud del proyecto en tiempo real.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <MetricCard title="Velocidad Media" value="42" change="+5.2%" color="text-[#10B981]" icon={TrendingUp} />
                    <MetricCard title="Bugs Abiertos" value="12" change="-2" color="text-red-500" icon={TrendingDown} isNegative />
                    <MetricCard title="Eficiencia de Ciclo" value="4.5d" change="0.2d" color="text-blue-500" icon={Clock} />
                    <MetricCard title="Puntos Completados" value="156" change="+12" color="text-purple-500" icon={CheckCircle2} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-8">
                            <h2 className="text-xl font-bold text-slate-800">Burndown Chart</h2>
                            <button className="text-xs font-bold text-[#10B981] hover:underline">Configurar</button>
                        </div>
                        <div className="h-64 flex items-end gap-2 group-hover:scale-[1.02] transition-transform duration-500">
                            {[40, 70, 45, 90, 65, 80, 55, 100, 75, 40].map((h, i) => (
                                <div key={i} className="flex-1 bg-slate-100 rounded-t-lg relative group/bar transition-all hover:bg-[#10B981]/10 h-full flex flex-col justify-end">
                                    <div className="w-full bg-[#10B981] rounded-t-lg transition-all" style={{ height: `${h}%` }}></div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            <span>Día 1</span>
                            <span>Día 14</span>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-8">
                            <h2 className="text-xl font-bold text-slate-800">Distribución de Trabajo</h2>
                            <PieChart className="w-5 h-5 text-slate-300" />
                        </div>
                        <div className="space-y-6">
                            <DistributionRow label="Desarrollo Frontend" value={65} color="bg-[#10B981]" />
                            <DistributionRow label="Core Backend" value={25} color="bg-blue-500" />
                            <DistributionRow label="Pruebas QA" value={10} color="bg-orange-500" />
                        </div>
                        <div className="mt-12 p-6 bg-[#0F172A] rounded-2xl text-white flex items-center justify-between group cursor-pointer">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Alertas detectadas</p>
                                <p className="text-sm font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4 text-orange-500" /> Cuello de botella en Backend</p>
                            </div>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform text-[#10B981]" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

interface MetricCardProps {
    title: string;
    value: string;
    change: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
    isNegative?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, color, icon: Icon, isNegative }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:ring-2 hover:ring-[#10B981]/30 transition-all group">
        <div className="flex justify-between items-center mb-4">
            <div className="w-10 h-10 bg-[#F8F9FA] rounded-xl flex items-center justify-center group-hover:bg-[#10B981]/10 transition-colors">
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${isNegative ? 'bg-red-50 text-red-500' : 'bg-[#E6F9F1] text-[#10B981]'}`}>{change}</span>
        </div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</h3>
        <p className="text-2xl font-black text-slate-800">{value}</p>
    </div>
);

interface DistributionRowProps {
    label: string;
    value: number;
    color: string;
}

const DistributionRow: React.FC<DistributionRowProps> = ({ label, value, color }) => (
    <div className="space-y-2">
        <div className="flex justify-between text-xs font-black uppercase tracking-widest">
            <span className="text-slate-500">{label}</span>
            <span className="text-slate-800">{value}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className={`${color} h-full rounded-full transition-all duration-1000`} style={{ width: `${value}%` }}></div>
        </div>
    </div>
);

export default AnalyticsPage;
