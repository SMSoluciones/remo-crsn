import { useAuth } from '../context/useAuth';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) {
    return <div>Acceso denegado. Inicie sesión.</div>;
  }
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <div>No tiene permisos para ver esta sección.</div>;
  }
  return children;
}
