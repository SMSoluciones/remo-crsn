import { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('auth_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
    }
  }, [user]);

  const login = (userData) => {
    setUser(userData);
    try {
      const email = userData.email ? String(userData.email).trim().toLowerCase() : '';
      if (email) {
        localStorage.setItem('open_student_email', email);
      }
      const documento = userData.documento ? String(userData.documento).trim() : '';
      if (documento) {
        localStorage.setItem('open_student_documento', documento);
      }
    } catch (error) {
      console.error('Error al guardar el correo electrónico en localStorage:', error);
    }
  };
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
