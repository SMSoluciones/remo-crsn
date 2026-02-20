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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-40 p-4">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md mx-2">
        <h3 className="text-lg font-semibold mb-4">Cambiar contraseña</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input type="password" placeholder="Nueva contraseña" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="px-3 py-2 border rounded w-full" required />
          <input type="password" placeholder="Confirmar nueva contraseña" value={confirm} onChange={e => setConfirm(e.target.value)} className="px-3 py-2 border rounded w-full" required />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded bg-gray-200">Cancelar</button>
            <button type="submit" disabled={loading} className="px-3 py-2 rounded bg-green-700 text-white">{loading ? 'Actualizando...' : 'Actualizar contraseña'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
