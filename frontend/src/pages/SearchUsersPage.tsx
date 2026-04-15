import React, { useState, useEffect } from 'react';
import { Search, User as UserIcon, Briefcase, ChevronRight, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { userService } from '../services/api';
import type { User } from '../types';
import Sidebar from '../components/Sidebar';

const SearchUsersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSearch = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await userService.search(searchQuery);
      setUsers(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setUsers([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, handleSearch]);

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
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-extrabold text-[#1A1A1A] mb-2">Descubrir Usuarios</h1>
            <p className="text-slate-500">Busca talentos y explora proyectos públicos en DevGestión</p>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-4 border border-[#DEE2E6] rounded-2xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/10 focus:border-[#10B981] transition-all shadow-sm text-lg"
              placeholder="Escribe el nombre o usuario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#10B981]"></div>
              </div>
            ) : users.length > 0 ? (
              users.map((user) => (
                <Link
                  key={user.id}
                  to={`/profile/${user.username}`}
                  className="flex items-center p-5 bg-white border border-[#E9ECEF] rounded-2xl hover:shadow-xl hover:border-[#10B981]/30 transition-all group"
                >

                  <div className="h-14 w-14 rounded-full bg-[#F0FDF4] flex items-center justify-center mr-5 group-hover:bg-[#10B981]/10 transition-colors">
                    <UserIcon className="h-7 w-7 text-[#10B981]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-extrabold text-[#1A1A1A] text-xl">
                      {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                    </h3>
                    <div className="flex items-center text-sm text-[#64748B] mt-1">
                      <span className="bg-[#F8F9FA] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-[#E9ECEF] mr-3">@{user.username}</span>
                      {user.perfil?.especialidades && (
                        <div className="flex items-center">
                          <Briefcase className="h-3.5 w-3.5 mr-1.5 text-[#10B981]" />
                          <span className="truncate max-w-[300px] font-medium">{user.perfil.especialidades}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-[#F8F9FA] flex items-center justify-center text-[#ADB5BD] group-hover:bg-[#10B981] group-hover:text-white transition-all shadow-sm">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </Link>
              ))
            ) : searchQuery.trim() && !loading ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-[#DEE2E6] text-[#64748B]">
                <p className="text-lg font-bold">No se encontraron usuarios</p>
                <p className="text-sm">Intenta con otro término de búsqueda</p>
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-[#DEE2E6] text-[#ADB5BD]">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-extrabold uppercase tracking-widest">Empieza a escribir para buscar talentos</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SearchUsersPage;
