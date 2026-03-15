import React, { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { fetchLoggedUsers } from '../../models/User';
import { useAuth } from '../../context/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';

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
    <div className="fixed inset-0 z-50 modal-overlay p-2 sm:p-4 flex items-start sm:items-center justify-center overflow-y-auto" onClick={onRequestClose}>
      <div
        className="modal-panel relative z-10 w-full max-w-4xl bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 max-h-[94vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 tracking-wide">Usuarios que iniciaron sesion</h3>
          <button onClick={onRequestClose} className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100">Cerrar</button>
        </div>

        <div className="p-3 sm:p-4">

        {loading && <LoadingSpinner message="Cargando historial..." className="py-4" textClassName="text-sm text-gray-500" />}
        {!loading && error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
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
    </div>
  );
}
