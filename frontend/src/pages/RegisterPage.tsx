import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import axios from 'axios';
import {
    Mail,
    Lock,
    CheckCircle2,
    Eye,
    EyeOff,
    AlertCircle,
    ArrowRight,
    User,
    Loader2
} from 'lucide-react';


const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: ''
    });

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Username & Email availability state
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const emailDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const checkUsernameAvailability = useCallback((username: string) => {
        // Clear any pending timer
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        // Reset if empty or too short
        if (!username || username.length < 3) {
            setUsernameStatus('idle');
            return;
        }

        setUsernameStatus('checking');

        debounceTimer.current = setTimeout(async () => {
            try {
                const available = await authService.checkUsername(username);
                setUsernameStatus(available ? 'available' : 'taken');
            } catch {
                setUsernameStatus('idle');
            }
        }, 500);
    }, []);

    const checkEmailAvailability = useCallback((email: string) => {
        if (emailDebounceTimer.current) clearTimeout(emailDebounceTimer.current);

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            setEmailStatus('idle');
            return;
        }

        setEmailStatus('checking');

        emailDebounceTimer.current = setTimeout(async () => {
            try {
                const available = await authService.checkEmail(email);
                setEmailStatus(available ? 'available' : 'taken');
            } catch {
                setEmailStatus('idle');
            }
        }, 500);
    }, []);

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            if (emailDebounceTimer.current) clearTimeout(emailDebounceTimer.current);
        };
    }, []);

    const validations = {
        length: formData.password.length >= 8,
        upper: /[A-Z]/.test(formData.password),
        lower: /[a-z]/.test(formData.password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
    };

    const allValid = Object.values(validations).every(v => v);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!allValid) return;

        setError(null);
        setLoading(true);

        try {
            // Split name into first and last
            const nameParts = formData.name.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ');

            await authService.register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                first_name: firstName,
                last_name: lastName
            });


            setIsSuccess(true);
            setTimeout(() => navigate('/login'), 2500);
        } catch (err: unknown) {
            let errorMsg = 'Error al registrar usuario. Posiblemente el email ya esté en uso.';
            if (axios.isAxiosError(err)) {
                errorMsg = err.response?.data?.error || err.response?.data?.detail || errorMsg;
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-2xl border border-[#10B981]/20 text-center space-y-6">
                    <div className="flex items-center gap-3 mb-10 justify-center">
                        <img src="/logo.png" alt="DevGestión Logo" className="h-14 w-auto" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-[#1A1A1A]">¡Registro Exitoso!</h1>
                    <p className="text-[#64748B]">
                        Tu cuenta ha sido creada correctamente. Estamos preparando tu entorno de desarrollo...
                    </p>
                    <div className="pt-4">
                        <div className="w-full bg-[#E9ECEF] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#10B981] h-full rounded-full animate-progress-fast"></div>
                        </div>
                        <p className="text-[10px] text-[#10B981] mt-2 font-bold uppercase tracking-widest">Redirigiendo al login</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row font-sans">
            {/* Visual / Branding Side */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#0F172A] p-12 flex-col justify-between relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-3">
                    <img src="/logo.png" alt="DevGestión Logo" className="h-10 w-auto" />
                </div>

                <div className="relative z-10 space-y-6">
                    <h2 className="text-5xl font-extrabold text-white leading-tight">
                        Construye el futuro del software <span className="text-[#10B981]">junto a nosotros.</span>
                    </h2>
                    <p className="text-slate-400 text-lg max-w-md">
                        Únete a la plataforma preferida por desarrolladores para gestionar sprints y flujos de trabajo ágiles.
                    </p>
                </div>

                <div className="relative z-10 text-slate-500 text-sm">
                    © 2026 DevGestión Inc. Todos los derechos reservados.
                </div>

                {/* Decorative Circles */}
                <div className="absolute top-1/4 -right-20 w-80 h-80 bg-[#10B981] rounded-full blur-[120px] opacity-10"></div>
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#10B981] rounded-full blur-[120px] opacity-5"></div>
            </div>

            {/* Form Side */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-extrabold text-[#1A1A1A] mb-2">Crear cuenta</h1>
                        <p className="text-[#64748B]">Empieza a gestionar tus proyectos hoy mismo.</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-[#495057] mb-2 block">Nombre completo</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        required
                                        placeholder="Juan Pérez"
                                        className="w-full bg-white border border-[#DEE2E6] rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] outline-none transition-all"
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-[#495057] mb-2 block">Nombre de usuario (ID único)</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ADB5BD] group-focus-within:text-[#10B981] transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        placeholder="usuario123"
                                        className={`w-full bg-white border rounded-xl py-3 pl-12 pr-12 outline-none transition-all ${
                                            usernameStatus === 'taken'
                                                ? 'border-red-400 focus:ring-2 focus:ring-red-200 focus:border-red-400'
                                                : usernameStatus === 'available'
                                                    ? 'border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]'
                                                    : 'border-[#DEE2E6] focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]'
                                        }`}
                                        value={formData.username}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData({ ...formData, username: val });
                                            checkUsernameAvailability(val);
                                        }}
                                    />
                                    {/* Status indicator icon */}
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        {usernameStatus === 'checking' && (
                                            <Loader2 className="w-5 h-5 text-[#ADB5BD] animate-spin" />
                                        )}
                                        {usernameStatus === 'available' && (
                                            <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                                        )}
                                        {usernameStatus === 'taken' && (
                                            <AlertCircle className="w-5 h-5 text-red-500" />
                                        )}
                                    </div>
                                </div>
                                {/* Inline feedback message */}
                                {usernameStatus === 'taken' && (
                                    <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        Este nombre de usuario ya está en uso. Prueba con otro.
                                    </p>
                                )}
                                {usernameStatus === 'available' && (
                                    <p className="mt-1.5 text-xs font-semibold text-[#10B981] flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        ¡Nombre de usuario disponible!
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-bold text-[#495057] mb-2 block">Email profesional</label>

                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ADB5BD] group-focus-within:text-[#10B981] transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="dev@empresa.com"
                                        className={`w-full bg-white border rounded-xl py-3 pl-12 pr-12 outline-none transition-all ${
                                            emailStatus === 'taken'
                                                ? 'border-red-400 focus:ring-2 focus:ring-red-200 focus:border-red-400'
                                                : emailStatus === 'available'
                                                    ? 'border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]'
                                                    : 'border-[#DEE2E6] focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]'
                                        }`}
                                        value={formData.email}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData({ ...formData, email: val });
                                            checkEmailAvailability(val);
                                        }}
                                    />
                                    {/* Status indicator icon */}
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        {emailStatus === 'checking' && (
                                            <Loader2 className="w-5 h-5 text-[#ADB5BD] animate-spin" />
                                        )}
                                        {emailStatus === 'available' && (
                                            <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                                        )}
                                        {emailStatus === 'taken' && (
                                            <AlertCircle className="w-5 h-5 text-red-500" />
                                        )}
                                    </div>
                                </div>
                                {/* Inline feedback message */}
                                {emailStatus === 'taken' && (
                                    <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        Este correo electrónico ya está registrado.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-bold text-[#495057] mb-2 block">Contraseña</label>
                                <div className="relative group mb-3">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ADB5BD] group-focus-within:text-[#10B981] transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        placeholder="••••••••"
                                        className="w-full bg-white border border-[#DEE2E6] rounded-xl py-3 pl-12 pr-12 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] outline-none transition-all"
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#ADB5BD] hover:text-[#495057]"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>

                                {/* Password Strength Checklist */}
                                <div className="bg-[#F8F9FA] rounded-xl p-4 border border-[#E9ECEF] space-y-2">
                                    <p className="text-[11px] font-bold text-[#ADB5BD] uppercase tracking-wider mb-2">Requerimientos de seguridad:</p>
                                    <ValidationRow active={validations.length} label="Mínimo 8 caracteres" />
                                    <ValidationRow active={validations.upper} label="Una letra mayúscula" />
                                    <ValidationRow active={validations.lower} label="Una letra minúscula" />
                                    <ValidationRow active={validations.special} label="Un carácter especial (!@#$)" />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!allValid || loading || usernameStatus === 'taken' || usernameStatus === 'checking' || emailStatus === 'taken' || emailStatus === 'checking'}
                            className="w-full bg-[#10B981] text-white py-4 rounded-xl font-bold shadow-lg shadow-[#10B981]/20 hover:bg-[#059669] transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 group"
                        >
                            {loading ? 'Creando cuenta...' : (
                                <>
                                    Crear cuenta <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-[#64748B] text-sm">
                        ¿Ya tienes una cuenta? <Link to="/login" className="text-[#10B981] font-bold hover:underline">Inicia sesión</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

const ValidationRow: React.FC<{ active: boolean; label: string }> = ({ active, label }) => (
    <div className="flex items-center gap-2">
        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${active ? 'bg-[#10B981]' : 'border-2 border-[#DEE2E6]'}`}>
            {active && <CheckCircle2 className="w-3 h-3 text-white" />}
        </div>
        <span className={`text-xs font-medium transition-colors ${active ? 'text-[#1A1A1A]' : 'text-[#ADB5BD]'}`}>{label}</span>
    </div>
);



export default RegisterPage;
