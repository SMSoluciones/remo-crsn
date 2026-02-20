import React, { useState } from 'react';
import { showSuccess } from '../../utils/toast';
import { API_BASE_URL } from '../../utils/apiConfig';

export default function ChangePasswordModal({ open, onClose, user }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(''); // Token for email confirmation
  const [step, setStep] = useState('send'); // 'send' or 'confirm' step
  const [info, setInfo] = useState(''); // Info message for user feedback

  if (!open) return null;

  const identifierForUser = () => user?.documento || user?.dni || user?.email || user?._id;

  const handleSendEmail = async () => {
    setError('');
    setInfo('');
    const identifier = identifierForUser();
    if (!identifier) return setError('No se pudo identificar al usuario');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/request-password-change`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error solicitando email');
      // If backend returned token (dev fallback) or we're running locally, show it
      const isLocal = window.location.hostname.includes('localhost') || window.location.hostname === '127.0.0.1';
      const targetEmail = user?.email || identifier;
      const maskEmail = (e) => {
        if (!e || typeof e !== 'string') return e;
        const parts = e.split('@');
        if (parts.length !== 2) return e;
        const name = parts[0];
        const domain = parts[1];
        const visible = name.length <= 2 ? name : name.slice(0, 2);
        return `${visible}****@${domain}`;
      };

      if (data.token && (data.dev || isLocal)) {
        setToken(data.token);
        setInfo(`Token (dev): ${data.token}`);
      } else {
        setInfo(`Email enviado a ${maskEmail(targetEmail)}. Revisa tu casilla para continuar.`);
      }
      setStep('confirm');
    } catch (err) {
      setError(err.message || 'Error solicitando email');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Las contraseñas no coinciden');
    if (!token) return setError('Ingresa el token recibido por email');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/confirm-password-change`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error confirmando token');
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
        {step === 'send' ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600">Se enviará un email con un token de verificación para cambiar tu contraseña.</p>
            {info && <p className="text-sm text-green-600">{info}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={onClose} className="px-3 py-2 rounded bg-gray-200">Cancelar</button>
              <button onClick={handleSendEmail} disabled={loading} className="px-3 py-2 rounded bg-green-700 text-white">{loading ? 'Enviando...' : 'Enviar email'}</button>
            </div>
            <div className="mt-4 text-sm text-gray-500">Si ya recibiste el token, pégalo en la siguiente pantalla.</div>
            <div className="mt-2 text-sm"><button onClick={() => setStep('confirm')} className="text-blue-600 underline">Ir a confirmar con token</button></div>
          </div>
        ) : (
          <form onSubmit={handleConfirm} className="flex flex-col gap-3">
            <input type="text" placeholder="Token" value={token} onChange={e => setToken(e.target.value)} className="px-3 py-2 border rounded w-full" required />
            <input type="password" placeholder="Contraseña nueva" value={password} onChange={e => setPassword(e.target.value)} className="px-3 py-2 border rounded w-full" required />
            <input type="password" placeholder="Confirmar contraseña" value={confirm} onChange={e => setConfirm(e.target.value)} className="px-3 py-2 border rounded w-full" required />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setStep('send')} className="px-3 py-2 rounded bg-gray-200">Volver</button>
              <button type="submit" disabled={loading} className="px-3 py-2 rounded bg-green-700 text-white">{loading ? 'Confirmando...' : 'Confirmar'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
