import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { UserRoles } from '../models/User';

const mockUsers = [
  { id: '1', nombre: 'Admin', apellido: 'Club', email: 'admin@club.com', rol: UserRoles.ADMIN },
  { id: '2', nombre: 'Entrenador', apellido: 'Perez', email: 'entrenador@club.com', rol: UserRoles.ENTRENADOR },
  { id: '3', nombre: 'Mantenimiento', apellido: 'Gomez', email: 'mantenimiento@club.com', rol: UserRoles.MANTENIMIENTO },
];


export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const user = mockUsers.find(u => u.email === email);
    if (user) {
      login(user);
    } else {
      setError('Usuario no encontrado');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Club Regatas San Nicolás</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
          />
          <button type="submit" className="bg-green-700 text-white rounded px-4 py-2 hover:bg-green-800 transition">Ingresar</button>
        </form>
        {error && <p className="text-red-600 mt-2 text-center">{error}</p>}
        <div className="mt-6">
          <strong className="block mb-2 text-gray-700">Usuarios de prueba:</strong>
          <ul className="space-y-1">
            {mockUsers.map(u => (
              <li key={u.id} className="text-gray-600 text-sm">{u.email} <span className="text-xs text-gray-400">({u.rol})</span></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
