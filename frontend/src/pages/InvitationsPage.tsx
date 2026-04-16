import React, { useEffect, useState, useMemo } from 'react';
import { invitationService } from '../services/api';
import { authService } from '../services/authService';
import { Check, X, Mail, Calendar, User as UserIcon, Briefcase, Menu, Send, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import NotificationGroup from '../components/NotificationGroup';
import type { Invitation } from '../types';

const InvitationsPage: React.FC = () => {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const user = authService.getUser();

    const fetchInvitations = React.useCallback(async () => {
        try {
            const response = await invitationService.getAll();
            // Filter only pending invitations for the management views
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

    const receivedPending = useMemo(() => {
        return invitations.filter(inv => inv.usuario_invitado === user?.id);
    }, [invitations, user]);

    const sentPending = useMemo(() => {
        return invitations.filter(inv => inv.usuario_remitente === user?.id);
    }, [invitations, user]);

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

    const handleCancelSent = async (id: number) => {
        try {
            await invitationService.delete(id);
            toast.success('Invitación cancelada correctamente');
            setInvitations(invitations.filter(inv => inv.id !== id));
        } catch (error) {
            console.error(error);
            toast.error('Error al cancelar la invitación enviada');
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

            {/* Sidebar */}
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
                <div className="max-w-5xl mx-auto space-y-12">
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#E9ECEF] pb-6">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-bold text-[#10B981] mb-2 uppercase tracking-widest italic">
                                <Mail className="w-3 h-3" /> Mis Notificaciones
                            </div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] tracking-tight">Invitaciones a Proyectos</h1>
                            <p className="text-[#64748B] mt-2">
                                Gestiona tu participación y las confirmaciones enviadas a otros usuarios.
                            </p>
                        </div>
                        <NotificationGroup />
                    </header>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                        </div>
                    ) : (
                        <div className="space-y-16">
                            
                            {/* --- RECEIVED INVITATIONS SECTION --- */}
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                        <Mail className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight">Bandeja de Entrada Recibidas</h2>
                                    <span className="bg-[#1A1A1A] text-white text-[10px] font-black px-2.5 py-1 rounded-full">{receivedPending.length}</span>
                                </div>

                                {receivedPending.length === 0 ? (
                                    <div className="bg-white border border-[#E9ECEF] rounded-[32px] p-8 md:p-12 flex flex-col items-center text-center">
                                        <div className="w-20 h-20 bg-[#F8F9FA] rounded-[24px] flex items-center justify-center mb-6 shadow-inner">
                                            <Check className="w-8 h-8 text-[#ADB5BD]" />
                                        </div>
                                        <h3 className="text-xl font-black text-[#1A1A1A] mb-2 uppercase tracking-tight">Todo al día</h3>
                                        <p className="text-[#64748B] text-sm max-w-md">
                                            No tienes invitaciones pendientes por responder. Cuando alguien te invite a colaborar, aparecerán aquí.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid gap-6">
                                        {receivedPending.map((inv) => (
                                            <div 
                                                key={inv.id}
                                                className="group bg-white border border-emerald-100 rounded-[28px] p-6 lg:p-8 transition-all hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8"
                                            >
                                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center gap-3 mb-4">
                                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-200 uppercase tracking-widest">
                                                            NUEVO
                                                        </span>
                                                        <span className="flex items-center gap-1.5 text-[10px] text-[#ADB5BD] font-bold uppercase tracking-widest">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {new Date(inv.fecha_creacion).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-2xl font-extrabold text-[#1A1A1A] mb-2">
                                                        {inv.proyecto_detalle.nombre}
                                                    </h3>
                                                    <p className="text-sm text-[#64748B] mb-6 line-clamp-2 leading-relaxed">
                                                        {inv.proyecto_detalle.descripcion}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-4 lg:gap-8 text-xs text-[#64748B] font-medium bg-[#F8F9FA] p-4 rounded-[20px] inline-flex">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#10B981] shadow-sm">
                                                                <UserIcon className="w-4 h-4" />
                                                            </div>
                                                            <span>De: <strong className="text-[#1A1A1A]">@{inv.usuario_remitente_detalle.username}</strong></span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#10B981] shadow-sm">
                                                                <Briefcase className="w-4 h-4" />
                                                            </div>
                                                            <span>Rol Propuesto: <strong className="text-[#1A1A1A] capitalize">{inv.rol_invitado}</strong></span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0">
                                                    <button
                                                        onClick={() => handleReject(inv.id)}
                                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 lg:px-8 py-3.5 rounded-[16px] border border-[#DEE2E6] text-[#64748B] font-bold uppercase tracking-widest text-[10px] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all active:scale-95"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        Rechazar
                                                    </button>
                                                    <button
                                                        onClick={() => handleAccept(inv.id)}
                                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 lg:px-8 py-3.5 rounded-[16px] bg-[#10B981] text-white font-bold uppercase tracking-widest text-[10px] hover:bg-[#059669] shadow-lg shadow-[#10B981]/30 transition-all active:scale-95"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                        Unirme al Proyecto
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* --- SENT INVITATIONS SECTION --- */}
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                        <Send className="w-4 h-4 text-orange-600" />
                                    </div>
                                    <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight">Confirmación de Envío</h2>
                                    <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-2.5 py-1 rounded-full">{sentPending.length}</span>
                                </div>

                                {sentPending.length === 0 ? (
                                    <div className="bg-[#F8F9FA] border border-dashed border-[#DEE2E6] rounded-[32px] p-8 md:p-10 flex flex-col items-center text-center opacity-80">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                                            <Send className="w-6 h-6 text-[#ADB5BD]" />
                                        </div>
                                        <p className="text-[#64748B] text-sm font-medium">No tienes invitaciones enviadas en espera de confirmación.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {sentPending.map((inv) => (
                                            <div 
                                                key={inv.id}
                                                className="bg-white border border-[#E9ECEF] rounded-[24px] p-5 lg:p-6 transition-all hover:border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-orange-50 rounded-[16px] flex items-center justify-center shrink-0">
                                                        <UserIcon className="w-5 h-5 text-orange-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-[#64748B] leading-tight mb-1">
                                                            Invitación enviada a <strong className="text-[#1A1A1A]">@{inv.usuario_invitado_detalle.username}</strong>
                                                        </p>
                                                        <p className="text-[10px] text-[#ADB5BD] font-black uppercase tracking-widest flex items-center gap-2">
                                                            <Briefcase className="w-3 h-3" /> Proyecto: {inv.proyecto_detalle.nombre}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-4">
                                                    <div className="px-3 py-1.5 bg-orange-50/50 text-orange-500 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 border border-orange-100">
                                                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div> Pendiente
                                                    </div>
                                                    <button
                                                        onClick={() => handleCancelSent(inv.id)}
                                                        className="p-2.5 text-[#ADB5BD] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Cancelar invitación"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default InvitationsPage;
