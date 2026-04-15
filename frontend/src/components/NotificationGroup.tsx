import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Mail, ChevronRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationService, invitationService } from '../services/api';
import { toast } from 'react-hot-toast';
import type { Notification, Invitation } from '../types';
import axios from 'axios';

const NotificationGroup: React.FC = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [invitationCount, setInvitationCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const unreadNotificationsCount = notifications.filter(n => !n.is_read).length;

    const fetchData = React.useCallback(async () => {
        try {
            const [notifRes, invRes] = await Promise.all([
                notificationService.getAll(),
                invitationService.getAll()
            ]);
            setNotifications(notifRes.data);
            setInvitationCount(invRes.data.filter((inv: Invitation) => inv.estado === 'pendiente').length);
        } catch (err: unknown) {
            console.error('Error fetching notifications/invitations:', err);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const markAllRead = async () => {
        try {
            setLoading(true);
            await notificationService.markAllAsRead();
            await fetchData();
            toast.success('Notificaciones marcadas como leídas');
        } catch (err: unknown) {
            let errorMsg = 'Error al marcar notificaciones';
            if (axios.isAxiosError(err)) {
                errorMsg = err.response?.data?.error || err.response?.data?.[0] || errorMsg;
            }
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2 sm:gap-3">
            {/* Invitations Button */}
            <button 
                onClick={() => navigate('/invitations')}
                className="p-2 sm:p-2.5 bg-white border border-[#E9ECEF] text-[#64748B] rounded-xl hover:text-[#10B981] transition-all relative shadow-sm group"
                title="Invitaciones a Proyectos"
            >
                <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {invitationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in duration-300">
                        {invitationCount}
                    </span>
                )}
            </button>

            {/* Notifications Bell */}
            <div className="relative">
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-2 sm:p-2.5 rounded-xl border transition-all relative group ${
                        unreadNotificationsCount > 0 
                            ? 'bg-[#10B981]/5 border-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/10' 
                            : 'bg-white border-[#E9ECEF] text-[#64748B] hover:text-[#1A1A1A]'
                    }`}
                    title="Notificaciones del Sistema"
                >
                    {unreadNotificationsCount > 0 
                        ? <Bell className="w-5 h-5 animate-bounce-slow" /> 
                        : <BellOff className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    }
                    {unreadNotificationsCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                            {unreadNotificationsCount}
                        </span>
                    )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                        <div className="absolute top-14 right-0 w-80 bg-white border border-[#E9ECEF] rounded-[24px] shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-4 border-b border-[#F8F9FA] pb-3">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">Notificaciones</h4>
                                {unreadNotificationsCount > 0 && (
                                    <button 
                                        onClick={markAllRead}
                                        disabled={loading}
                                        className="text-[9px] font-black uppercase tracking-widest text-[#10B981] hover:underline flex items-center gap-1 disabled:opacity-50"
                                    >
                                        {loading && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                                        Marcar todo como leído
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="py-8 text-center text-[#ADB5BD] text-[10px] font-bold uppercase tracking-widest italic">
                                        No hay notificaciones
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div 
                                            key={n.id} 
                                            className={`p-3 rounded-2xl border transition-all text-left ${
                                                !n.is_read ? 'bg-[#F0FDF4] border-[#10B981]/20 shadow-sm' : 'bg-white border-transparent'
                                            }`}
                                        >
                                            <p className="text-[11px] font-black text-[#1A1A1A] mb-1">{n.title}</p>
                                            <p className="text-[10px] text-[#64748B] leading-relaxed mb-2 font-medium">{n.message}</p>
                                            {n.link && (
                                                <Link 
                                                    to={n.link} 
                                                    onClick={() => setShowNotifications(false)}
                                                    className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#10B981] hover:underline"
                                                >
                                                    Ver ahora <ChevronRight className="w-2.5 h-2.5" />
                                                </Link>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
            
            <style>{`
                .animate-bounce-slow {
                    animation: bounce-slow 2s infinite;
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E9ECEF; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default NotificationGroup;
