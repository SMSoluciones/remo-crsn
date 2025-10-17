import Avatar from 'react-avatar';
import { BellIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/useAuth';
import { useState } from 'react';
import ChangePasswordModal from './Login/ChangePasswordModal';

export default function Topbar({ onLogout }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showChange, setShowChange] = useState(false);

  return (
    <header className="w-full h-20 bg-white shadow flex items-center justify-between px-8 fixed top-0 left-20 z-10">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-green-700">Club Regatas San Nicolás</h1>
      </div>
      <div className="flex items-center gap-6 relative">
        <button className="relative">
          <BellIcon className="h-6 w-6 text-gray-500" />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
        </button>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setMenuOpen(!menuOpen)}>
          <Avatar name={user?.nombre + ' ' + user?.apellido} size="36" round={true} />
          <span className="font-medium text-gray-700">{user?.nombre}</span>
        </div>

        {menuOpen && (
          <div className="absolute right-8 top-16 bg-white border rounded shadow-md z-30 w-44">
            <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => { setShowChange(true); setMenuOpen(false); }}>Cambiar contraseña</button>
            <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => { logout(); onLogout && onLogout(); }}>Logout</button>
          </div>
        )}

        <ChangePasswordModal open={showChange} onClose={() => setShowChange(false)} user={user} />
      </div>
    </header>
  );
}
