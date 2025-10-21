import React, { useState } from 'react';
import { showSuccess, showError } from '../../utils/toast';
import { API_BASE_URL } from '../../utils/apiConfig';

export default function ChangePasswordModal({ open, onClose, user }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      // Llamada al backend para cambiar contraseña
      const res = await fetch(`${API_BASE_URL}/api/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error('Error al cambiar contraseña');
      showSuccess('Contraseña cambiada correctamente');
      onClose();
    } catch (err) {
      const msg = err.message || 'Error';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-40 z-40">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Cambiar contraseña</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input type="password" placeholder="Contraseña nueva" value={password} onChange={e => setPassword(e.target.value)} className="px-3 py-2 border rounded" required />
          <input type="password" placeholder="Confirmar contraseña" value={confirm} onChange={e => setConfirm(e.target.value)} className="px-3 py-2 border rounded" required />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded bg-gray-200">Cancelar</button>
            <button type="submit" disabled={loading} className="px-3 py-2 rounded bg-green-700 text-white">{loading ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
