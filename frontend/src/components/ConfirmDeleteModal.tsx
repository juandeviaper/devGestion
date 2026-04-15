import React from 'react';
import {
    X,
    Trash2,
    AlertTriangle,
    Loader2
} from 'lucide-react';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    loading?: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "¿Eliminar Proyecto?", 
    message = "¿Estás seguro de que deseas eliminar este proyecto completamente? Esta acción es irreversible y se perderán todos los datos asociados.",
    loading = false 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0F172A]/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-[#E9ECEF] animate-in zoom-in-95 duration-300">
                {/* Header with Warning Color */}
                <div className="p-8 pb-4 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 animate-bounce-subtle">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <Trash2 className="w-8 h-8 text-red-500" />
                        </div>
                    </div>
                    
                    <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight mb-2 uppercase italic">
                        {title}
                    </h2>
                    <p className="text-[#64748B] text-sm font-medium leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Warning Alert */}
                <div className="px-8 mb-8">
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 items-start">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest leading-normal italic">
                            Esta operación destruirá todos los repositorios, historias y configuraciones vinculadas.
                        </p>
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="p-8 bg-[#F8F9FA] border-t border-[#E9ECEF] flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={onClose} 
                        disabled={loading}
                        className="flex-1 py-4 text-xs font-black text-[#64748B] uppercase tracking-[0.2em] hover:bg-[#E9ECEF] rounded-2xl transition-all italic"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-[1.5] bg-[#1A1A1A] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-black/10 hover:bg-red-600 hover:-translate-y-1 transition-all flex items-center justify-center disabled:opacity-50 italic group"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
                            </>
                        ) : (
                            "Confirmar Eliminación"
                        )}
                    </button>
                </div>
            </div>
            
            {/* Close button top right */}
            <button 
                onClick={onClose}
                className="absolute top-8 right-8 p-3 text-white/50 hover:text-white transition-colors"
            >
                <X className="w-8 h-8" />
            </button>
        </div>
    );
};

export default ConfirmDeleteModal;
