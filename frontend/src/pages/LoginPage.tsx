import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import axios from 'axios';
import {
    Mail,
    Lock,
    ArrowRight,
    ChevronLeft,
    Eye,
    EyeOff
} from 'lucide-react';


const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await authService.login(email, password);
            navigate('/dashboard');
        } catch (err: unknown) {
            let errorMsg = 'Error al iniciar sesión. Verifica tus credenciales.';
            if (axios.isAxiosError(err)) {
                errorMsg = err.response?.data?.detail || errorMsg;
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6 font-sans">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#10B981]/5 rounded-full blur-[120px]"></div>
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[#10B981]/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Back Link */}
                <Link to="/" className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#10B981] transition-colors text-sm font-medium mb-8 group">
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al inicio
                </Link>

                {/* Brand */}
                <div className="flex items-center gap-3 mb-10 justify-center">
                    <img src="/logo.png" alt="DevGestión Logo" className="h-14 w-auto" />
                </div>

                <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-200">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-2">Bienvenido de nuevo</h1>
                        <p className="text-[#64748B] text-sm leading-relaxed">Inicia sesión para continuar gestionando tus proyectos.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-[#495057] mb-2 block">Usuario o Correo</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ADB5BD] group-focus-within:text-[#10B981] transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        placeholder="admin o ejemplo@empresa.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white border border-[#DEE2E6] rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] outline-none transition-all placeholder:text-[#ADB5BD]"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-[#495057] block">Contraseña</label>
                                    <a href="#" className="text-xs font-bold text-[#10B981] hover:underline">¿La olvidaste?</a>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ADB5BD] group-focus-within:text-[#10B981] transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white border border-[#DEE2E6] rounded-xl py-3.5 pl-12 pr-12 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] outline-none transition-all placeholder:text-[#ADB5BD]"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#ADB5BD] hover:text-[#495057]"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-300 text-[#10B981] focus:ring-[#10B981]" />
                            <label htmlFor="remember" className="text-sm text-[#64748B] font-medium cursor-pointer">Recordarme en este dispositivo</label>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold p-3 rounded-xl">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#10B981] text-white py-4 rounded-xl font-bold shadow-lg shadow-[#10B981]/20 hover:bg-[#059669] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Entrando...' : (
                                <>
                                    Entrar al dashboard <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-[#64748B] text-sm mt-8">
                    ¿No tienes una cuenta aún? <Link to="/register" className="text-[#10B981] font-bold hover:underline">Crea una gratis</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
