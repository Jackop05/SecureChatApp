import React, { useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

export const DashboardLayout = () => {
  const { user, logout, isAuthenticated, privateKey } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !privateKey) {
      toast.error("Session expired or private key missing. Please login again.");
      navigate('/login');
    }
  }, [isAuthenticated, privateKey, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-[#06807b] flex flex-col shadow-xl z-10">
        <div className="p-8 border-b border-slate-300">
          <h1 className="text-2xl font-bold text-white tracking-tight">SecureChat</h1>
          <p className="text-xs text-teal-100 mt-2 opacity-80">Logged in as: <span className="font-semibold text-white">{user?.username}</span></p>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3.5 rounded-lg text-teal-50 hover:bg-white/10 hover:text-white transition-all duration-200 group">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 group-hover:opacity-100"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            <span className="font-medium">Inbox</span>
          </Link>
          <Link to="/dashboard/compose" className="flex items-center gap-3 px-4 py-3.5 rounded-lg text-teal-50 hover:bg-white/10 hover:text-white transition-all duration-200 group">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 group-hover:opacity-100"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            <span className="font-medium">Compose Message</span>
          </Link>
          <Link to="/dashboard/settings" className="flex items-center gap-3 px-4 py-3.5 rounded-lg text-teal-50 hover:bg-white/10 hover:text-white transition-all duration-200 group">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 group-hover:opacity-100"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            <span className="font-medium">Settings</span>
          </Link>
        </nav>

        <div className="p-6 border-t border-teal-600/30">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-teal-100 hover:bg-red-500/10 hover:text-red-200 rounded-lg transition-all duration-200 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 group-hover:opacity-100"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-10">
        <Outlet /> {/* Tutaj będą renderowane podstrony */}
      </main>
    </div>
  );
};