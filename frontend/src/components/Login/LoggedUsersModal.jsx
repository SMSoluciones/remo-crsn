import React, { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { fetchLoggedUsers } from '../../models/User';
import { useAuth } from '../../context/useAuth';

function formatLastSeen(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-AR');
}

export default function LoggedUsersModal({ isOpen, onRequestClose }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    AOS.init({ duration: 300, easing: 'ease-out', once: true });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const load = async () => {
      if (!mounted) return;
      setLoading(true);
      setError('');
      try {
        const list = await fetchLoggedUsers(user);
        if (!mounted) return;
        setUsers(Array.isArray(list) ? list : []);
      } catch {
        if (!mounted) return;
        setError('No se pudo cargar el historial de logins.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onRequestClose} />
      <div
        className="relative z-10 bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[85vh] overflow-y-auto p-4"
        data-aos="fade-up"
      >
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h3 className="text-lg font-semibold">Usuarios que iniciaron sesión</h3>
          <button onClick={onRequestClose} className="text-gray-500 hover:text-gray-700">Cerrar</button>
        </div>

        {loading && <p className="text-sm text-gray-500">Cargando historial...</p>}
        {!loading && error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Apellido</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Último login</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-sm text-gray-500 text-center">Todavía no hay usuarios con login registrado.</td>
                  </tr>
                ) : (
                  users.map((loggedUser) => (
                    <tr key={loggedUser._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">{loggedUser.nombre || '—'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{loggedUser.apellido || '—'}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{loggedUser.email || '—'}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{loggedUser.rol || '—'}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{formatLastSeen(loggedUser.lastLoginAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
