import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Briefcase, Mail, Globe, Layout, Calendar, ChevronRight, Menu, X } from 'lucide-react';

import { userService } from '../services/api';
import Sidebar from '../components/Sidebar';
import Avatar from '../components/Avatar';
import type { PublicProfileData, Project } from '../types';
import axios from 'axios';
import { toast } from 'react-hot-toast';


const PublicProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [data, setData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchProfile = React.useCallback(async (isSilent = false) => {
    try {
      if (!username) return;
      if (!isSilent) setLoading(true);
      const response = await userService.getPublicProfile(username);
      setData(response.data);
      setError(null);
    } catch (err: unknown) {
      console.error('Error fetching public profile:', err);
      let errorMsg = 'No se pudo cargar el perfil público.';
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          errorMsg = 'El usuario que buscas no existe o ha sido desactivado.';
        } else {
          errorMsg = err.response?.data?.error || err.response?.data?.detail || errorMsg;
        }
      }
      setError(errorMsg);
      if (!isSilent) toast.error(errorMsg);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [username]);

  // Polling cada 5 segundos
  useEffect(() => {
    if (username) {
      fetchProfile();
      
      const interval = setInterval(() => {
        fetchProfile(true); // Silent update for polling
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [username, fetchProfile]);

  if (loading) {
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

        <main className="flex-1 flex items-center justify-center">
          {/* Mobile Header Toggle (Loading phase) */}
          <div className="md:hidden absolute top-4 left-4 z-50">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-3 bg-white border border-[#E9ECEF] rounded-2xl text-[#64748B] shadow-sm active:scale-95 transition-all"
                >
                    <Menu className="w-6 h-6" />
                </button>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#10B981]"></div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex text-[#1A1A1A] font-sans">
        <Sidebar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-12 rounded-[40px] shadow-xl border border-[#E9ECEF] max-w-lg">
            <div className="h-20 w-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-6 mx-auto">
              <X className="h-10 w-10 text-rose-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-[#1A1A1A] mb-4">¡Ups! Algo salió mal</h2>
            <p className="text-slate-500 font-medium mb-8">{error}</p>
            <Link to="/search/users" className="inline-block bg-[#10B981] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#059669] transition-all shadow-lg shadow-[#10B981]/20 active:scale-95">
              Volver a búsqueda
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex text-[#1A1A1A] font-sans">
        <Sidebar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-3xl font-extrabold text-[#1A1A1A] mb-4">Usuario no encontrado</h2>
          <Link to="/search/users" className="bg-[#10B981] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#059669] transition-all shadow-lg shadow-[#10B981]/20">
            Volver a búsqueda
          </Link>
        </main>
      </div>
    );
  }

  const { user, projects } = data;

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
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#E9ECEF] mb-12 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#10B981]/5 rounded-full -mr-40 -mt-40 blur-3xl group-hover:bg-[#10B981]/10 transition-colors"></div>
            
            <div className="flex flex-col md:flex-row items-center md:items-start relative z-10">
              <div className="mb-6 md:mb-0 md:mr-10">
                <Avatar 
                    username={user.username} 
                    photo={typeof user.perfil?.foto_perfil === 'string' ? user.perfil.foto_perfil : null} 
                    size="xl" 
                    className="ring-8 ring-white shadow-2xl" 
                />
              </div>

              
              <div className="text-center md:text-left flex-1">
                <div className="mb-6">
                  <h1 className="text-4xl font-extrabold text-[#1A1A1A] mb-2 leading-tight">
                    {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                  </h1>
                  <span className="px-3 py-1 bg-[#F8F9FA] border border-[#E9ECEF] rounded-lg text-sm font-bold text-[#64748B] uppercase tracking-widest leading-none">
                    @{user.username}
                  </span>
                </div>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-8">
                  {user.email && (
                    <div className="flex items-center text-[#64748B] bg-[#F8F9FA] px-4 py-2 rounded-xl text-sm font-bold border border-[#E9ECEF]">
                      <Mail className="h-4 w-4 mr-2.5 text-[#ADB5BD]" />
                      {user.email}
                    </div>
                  )}
                  {user.perfil?.especialidades && (
                    <div className="flex items-center text-[#10B981] bg-[#F0FDF4] px-4 py-2 rounded-xl text-sm font-bold border border-[#10B981]/10">
                      <Briefcase className="h-4 w-4 mr-2.5" />
                      {user.perfil.especialidades}
                    </div>
                  )}
                </div>

                {user.perfil?.bio && (
                  <div className="bg-[#F8F9FA] p-6 rounded-2xl text-[#64748B] text-base max-w-2xl border-l-[6px] border-[#10B981] font-medium leading-relaxed italic">
                    "{user.perfil.bio}"
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Projects Section */}
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-[#1A1A1A] flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F0FDF4] rounded-xl flex items-center justify-center">
                <Layout className="h-6 w-6 text-[#10B981]" />
              </div>
              Proyectos Públicos
              <span className="px-3 py-1 bg-[#10B981]/10 text-[#10B981] rounded-full text-sm font-black">
                {projects.length}
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.length > 0 ? (
              projects.map((project: Project) => (
                <Link
                  key={project.id}
                  to={`/project/${project.id}`}

                  className="bg-white group rounded-3xl border border-[#E9ECEF] p-8 hover:shadow-2xl hover:border-[#10B981]/30 transition-all duration-300 flex flex-col h-full relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="h-14 w-14 rounded-2xl bg-[#F8F9FA] flex items-center justify-center text-[#ADB5BD] group-hover:bg-[#F0FDF4] group-hover:text-[#10B981] transition-colors shadow-sm">
                      <Globe className="h-7 w-7" />
                    </div>
                    <div className="px-3 py-1 bg-[#F0FDF4] text-[#10B981] rounded-lg text-[10px] font-black uppercase tracking-[0.15em] border border-[#10B981]/10">
                      Público
                    </div>
                  </div>
                  
                  <h3 className="font-extrabold text-[#1A1A1A] group-hover:text-[#10B981] transition-colors mb-3 text-2xl leading-tight">
                    {project.nombre}
                  </h3>
                  
                  <p className="text-[#64748B] text-sm mb-8 line-clamp-3 leading-relaxed font-bold opacity-80 flex-1">
                    {project.descripcion || 'Sin descripción disponible.'}
                  </p>
                  
                  <div className="pt-6 border-t border-[#F8F9FA] flex items-center justify-between mt-auto">
                    <div className="flex items-center text-[#ADB5BD] text-[11px] font-black uppercase tracking-widest">
                      <Calendar className="h-3.5 w-3.5 mr-2" />
                      {new Date(project.fecha_creacion).toLocaleDateString()}
                    </div>
                    <div className="h-10 w-10 rounded-full bg-[#F8F9FA] flex items-center justify-center text-[#10B981] translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all shadow-sm">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-24 bg-white rounded-[40px] border-2 border-dashed border-[#DEE2E6] flex flex-col items-center justify-center text-[#ADB5BD]">
                <div className="h-20 w-20 bg-[#F8F9FA] rounded-[30px] flex items-center justify-center mb-6 shadow-inner">
                  <Layout className="h-10 w-10 opacity-20" />
                </div>
                <p className="text-xl font-extrabold uppercase tracking-widest">Este usuario aún no tiene proyectos públicos.</p>
                <p className="text-sm font-medium mt-2 opacity-60 italic">Vuelve más tarde para ver sus novedades.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicProfilePage;
