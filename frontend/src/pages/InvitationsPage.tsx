import React, { useEffect, useState } from 'react';
import { invitationService } from '../services/api';
import { Check, X, Mail, Calendar, User as UserIcon, Briefcase, Menu } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import NotificationGroup from '../components/NotificationGroup';
import type { Invitation } from '../types';

const InvitationsPage: React.FC = () => {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const fetchInvitations = React.useCallback(async () => {
        try {
            const response = await invitationService.getAll();
            // Filter only pending invitations for this view
            setInvitations(response.data.filter((inv: Invitation) => inv.estado === 'pendiente'));
        } catch (error) {
            console.error('Error fetching invitations:', error);
            toast.error('Error al cargar invitaciones');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInvitations();
    }, [fetchInvitations]);

    const handleAccept = async (id: number) => {
        try {
            await invitationService.aceptar(id);
            toast.success('Invitación aceptada');
            setInvitations(invitations.filter(inv => inv.id !== id));
        } catch (error) {
            console.error(error);
            toast.error('Error al aceptar invitación');
        }
    };

    const handleReject = async (id: number) => {
        try {
            await invitationService.rechazar(id);
            toast.success('Invitación rechazada');
            setInvitations(invitations.filter(inv => inv.id !== id));
        } catch (error) {
            console.error(error);
            toast.error('Error al rechazar invitación');
        }
    };

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
                <div className="max-w-4xl mx-auto">
                    <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-bold text-[#10B981] mb-2 uppercase tracking-widest italic">
                                <Mail className="w-3 h-3" /> Mis Notificaciones
                            </div>
                            <h1 className="text-4xl font-extrabold text-[#1A1A1A]">Invitaciones a Proyectos</h1>
                            <p className="text-[#64748B] mt-2">
                                Gestiona las invitaciones a proyectos donde te han invitado a colaborar.
                            </p>
                        </div>
                        <NotificationGroup />
                    </header>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                        </div>
                    ) : invitations.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-[#E9ECEF] rounded-[32px] p-12 py-20 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-[#F0FDF4] rounded-full flex items-center justify-center mb-8 shadow-inner">
                                <Mail className="w-12 h-12 text-[#10B981] opacity-50" />
                            </div>
                            <h3 className="text-3xl font-black text-[#1A1A1A] mb-4 uppercase italic tracking-tight">No tienes invitaciones pendientes</h3>
                            <p className="text-[#64748B] max-w-md mb-10 font-medium leading-relaxed">
                                Cuando alguien te invite a un proyecto, aparecerá aquí. Recibirás una notificación en tu dashboard.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {invitations.map((inv) => (
                                <div 
                                    key={inv.id}
                                    className="group bg-white border border-[#E9ECEF] rounded-2xl p-8 transition-all hover:border-[#10B981]/30 hover:shadow-xl hover:shadow-[#10B981]/5 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="px-3 py-1 bg-[#F0FDF4] text-[#10B981] text-[10px] font-black rounded-lg border border-[#10B981]/20 uppercase tracking-widest">
                                                {inv.rol_invitado}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[10px] text-[#ADB5BD] font-bold uppercase tracking-widest">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(inv.fecha_creacion).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-extrabold text-[#1A1A1A] group-hover:text-[#10B981] transition-colors mb-2">
                                            {inv.proyecto_detalle.nombre}
                                        </h3>
                                        <p className="text-sm text-[#64748B] mb-6 line-clamp-2 leading-relaxed">
                                            {inv.proyecto_detalle.descripcion}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-6 text-xs text-[#64748B] font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-[#F8F9FA] flex items-center justify-center text-[#10B981] border border-[#E9ECEF]">
                                                    <UserIcon className="w-4 h-4" />
                                                </div>
                                                <span>Invitado por <strong className="text-[#1A1A1A]">@{inv.usuario_remitente_detalle.username}</strong></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-[#F8F9FA] flex items-center justify-center text-[#10B981] border border-[#E9ECEF]">
                                                    <Briefcase className="w-4 h-4" />
                                                </div>
                                                <span>Rol: <strong className="text-[#1A1A1A] capitalize">{inv.rol_invitado}</strong></span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 shrink-0">
                                        <button
                                            onClick={() => handleReject(inv.id)}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-[#DEE2E6] text-[#64748B] font-bold uppercase tracking-widest text-xs hover:bg-[#F8F9FA] hover:text-[#1A1A1A] transition-all active:scale-95"
                                        >
                                            <X className="w-4 h-4" />
                                            Rechazar
                                        </button>
                                        <button
                                            onClick={() => handleAccept(inv.id)}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#10B981] text-white font-bold uppercase tracking-widest text-xs hover:bg-[#059669] shadow-lg shadow-[#10B981]/20 transition-all active:scale-95"
                                        >
                                            <Check className="w-4 h-4" />
                                            Aceptar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default InvitationsPage;
