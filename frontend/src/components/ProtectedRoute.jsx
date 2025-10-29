import { useAuth } from '../context/useAuth';
import { useEffect } from 'react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  // Si el usuario está autenticado pero no pertenece a los roles permitidos,
  // redirigimos al dashboard usando la función global expuesta en App.jsx.
  useEffect(() => {
    if (user && allowedRoles && !allowedRoles.includes(user.rol)) {
      if (typeof window.appSetSection === 'function') {
        window.appSetSection('dashboard');
      }
    }
  }, [user, allowedRoles]);

  if (!user) {
    return <div>Acceso denegado. Inicie sesión.</div>;
  }
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    // No renderizamos el contenido protegido cuando no tiene permisos.
    return null;
  }
  return children;
}
