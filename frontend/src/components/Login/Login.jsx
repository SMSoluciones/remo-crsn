import { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { UserRoles } from '../../models/User';
import { API_BASE_URL } from '../../utils/apiConfig';

export default function Login() {
  const { login } = useAuth();
  const [documento, setDocumento] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documento, password }),
      });
      const data = await res.json();
      if (res.ok) {
          login(data);
      } else {
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Club Regatas San Nicolás</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Documento"
            value={documento}
            onChange={e => setDocumento(e.target.value)}
            className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
            disabled={loading}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
            disabled={loading}
            required
          />
          <button type="submit" className="bg-green-700 text-white rounded px-4 py-2 hover:bg-green-800 transition" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        {error && <p className="text-red-600 mt-2 text-center">{error}</p>}
      </div>
    </div>
  );
}
