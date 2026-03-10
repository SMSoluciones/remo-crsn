import Avatar from 'react-avatar';
import { BellIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/useAuth';
import { useState, useRef, useEffect } from 'react';
import ChangePasswordModal from './Login/ChangePasswordModal';

export default function Topbar({ onLogout, onMobileMenuToggle }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showChange, setShowChange] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    function handleKey(e) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  return (
  <header className="h-20 bg-white shadow flex items-center justify-between px-4 md:px-8 fixed top-0 left-0 md:left-24 right-0 z-10">
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 rounded hover:bg-gray-100" onClick={() => onMobileMenuToggle && onMobileMenuToggle(true)} aria-label="Abrir menú">
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
      </div>
      <div ref={containerRef} className="flex items-center gap-6 relative">
        <button className="relative">
          <BellIcon className="h-6 w-6 text-gray-500" />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
        </button>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setMenuOpen(!menuOpen)}>
          <Avatar name={user?.nombre + ' ' + user?.apellido} size="36" round={true} />
          <span className="font-medium text-gray-700">{user?.nombre}</span>
          <svg className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
          </svg>
        </div>

        {menuOpen && (
          <div className="dropdown-slide-down absolute right-0 top-14 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-xl z-30 w-56 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.nombre} {user?.apellido}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <button className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100" onClick={() => { setShowChange(true); setMenuOpen(false); }}>Cambiar contrasena</button>
            <button className="block w-full text-left px-4 py-2.5 text-sm text-rose-700 hover:bg-rose-50" onClick={() => { logout(); onLogout && onLogout(); }}>Logout</button>
          </div>
        )}

        <ChangePasswordModal open={showChange} onClose={() => setShowChange(false)} user={user} />
      </div>
    </header>
  );
}
