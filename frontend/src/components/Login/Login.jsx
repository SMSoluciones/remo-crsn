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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden w-full max-w-6xl grid grid-cols-1 md:grid-cols-2">
        {/* Left: form */}
        <div className="p-10 md:p-16">
          <div className="mb-8">
            <img src="/icon.svg" alt="Club logo" className="h-8 w-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">Hola, <br/>Bienvenido otra vez</h1>
            <p className="text-sm text-gray-500 mt-3">Por favor ingresa tus datos.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-md">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Documento"
              value={documento}
              onChange={e => setDocumento(e.target.value)}
              className="border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-300 w-full"
              disabled={loading}
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-300 w-full"
              disabled={loading}
              required
            />

            <div className="flex items-center text-sm text-gray-600">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                <span>Remember Me</span>
              </label>
            </div>

            <button type="submit" className="bg-blue-600 text-white rounded-lg px-4 py-3 hover:bg-blue-700 transition w-full" disabled={loading}>
              {loading ? 'Ingresando...' : 'Login'}
            </button>
          </form>

          {error && <p className="text-red-600 mt-4 text-sm">{error}</p>}
        </div>

        {/* Right: decorative panel */}
        <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-blue-500 to-orange-400 p-8">
          <div className="w-full h-full max-w-md text-white flex flex-col items-center justify-center">
            <div className="w-56 h-72 rounded-2xl bg-white/20 backdrop-blur-sm p-4 flex items-center justify-center">
              <svg width="160" height="220" viewBox="0 0 160 220" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="12" y="12" width="136" height="196" rx="18" fill="white" fillOpacity="0.06" />
                <rect x="28" y="28" width="104" height="164" rx="12" fill="white" fillOpacity="0.08" />
                <circle cx="80" cy="120" r="26" stroke="white" strokeOpacity="0.9" strokeWidth="6" />
              </svg>
            </div>
      
          </div>
        </div>
      </div>
    </div>
  );
}
