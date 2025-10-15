import Avatar from 'react-avatar';
import { BellIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/useAuth';

export default function Topbar({ onLogout }) {
  const { user } = useAuth();
  return (
    <header className="w-full h-20 bg-white shadow flex items-center justify-between px-8 fixed top-0 left-20 z-10">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-green-700">Club Regatas San Nicolás</h1>
      </div>
      <div className="flex items-center gap-6">
        <button className="relative">
          <BellIcon className="h-6 w-6 text-gray-500" />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
        </button>
        <div className="flex items-center gap-2">
          <Avatar name={user?.nombre + ' ' + user?.apellido} size="36" round={true} />
          <span className="font-medium text-gray-700">{user?.nombre}</span>
        </div>
        <button onClick={onLogout} className="ml-4 px-3 py-1 bg-green-700 text-white rounded hover:bg-green-800 transition">Salir</button>
      </div>
    </header>
  );
}
