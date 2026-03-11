import React, { useState } from 'react';
import { showSuccess } from '../../utils/toast';
import { API_BASE_URL } from '../../utils/apiConfig';

export default function ChangePasswordModal({ open, onClose, user }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) return setError('Las contraseñas no coinciden');
    setLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (user?._id) headers['x-user-id'] = user._id;
      else if (user?.email) headers['x-user-email'] = user.email;

      const body = { newPassword };

      const res = await fetch(`${API_BASE_URL}/api/users/me/change-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error actualizando contraseña');
      showSuccess('Contraseña cambiada correctamente');
      onClose();
    } catch (err) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 modal-overlay p-2 sm:p-4 flex items-start sm:items-center justify-center overflow-y-auto" onClick={onClose}>
      <div className="modal-panel w-full max-w-md mx-auto bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 tracking-wide">Cambiar contraseña</h3>
          <button type="button" onClick={onClose} className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100">Cerrar</button>
        </div>
        <div className="p-3 sm:p-4 overflow-y-auto">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-3 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <input type="password" placeholder="Nueva contraseña" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" required />
          <input type="password" placeholder="Confirmar nueva contraseña" value={confirm} onChange={e => setConfirm(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" required />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100">Cancelar</button>
            <button type="submit" disabled={loading} className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">{loading ? 'Actualizando...' : 'Actualizar contraseña'}</button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
