import { LifebuoyIcon, WrenchScrewdriverIcon, UserGroupIcon, ChartBarIcon, Cog6ToothIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/useAuth';

const navItems = [
  { label: 'Dashboard', icon: <ChartBarIcon className="h-6 w-6" />, section: 'dashboard' },
  { label: 'Botes', icon: <LifebuoyIcon className="h-6 w-6" />, section: 'boats' },
  { label: 'Alumnos', icon: <UserGroupIcon className="h-6 w-6" />, section: 'students' },
  { label: 'Fichas Técnicas', icon: <WrenchScrewdriverIcon className="h-6 w-6" />, section: 'sheets' },
  { label: 'Configuración', icon: <Cog6ToothIcon className="h-6 w-6" />, section: 'settings' },
];

export default function Sidebar({ section, setSection }) {
  const { user } = useAuth();

  // Ocultar la entrada 'Fichas Técnicas' si el usuario es del rol 'alumnos'
  const visibleItems = navItems.filter(item => {
    if (item.section === 'sheets' && user?.rol === 'alumnos') return false;
    return true;
  });

  return (
    <aside className="bg-white shadow-lg h-screen w-20 flex flex-col items-center py-6 gap-6 fixed left-0 top-0 z-20">
      {visibleItems.map(item => (
        <button
          key={item.section}
          className={`flex flex-col items-center gap-1 text-gray-500 hover:text-green-700 focus:text-green-700 transition ${section === item.section ? 'text-green-700' : ''}`}
          onClick={() => setSection(item.section)}
          title={item.label}
        >
          {item.icon}
          <span className="text-xs font-medium">{item.label}</span>
        </button>
      ))}
      {/* Botón Mi Perfil - colocado abajo para garantizar visibilidad */}
      {user && (() => {
        const isEnabled = user?.rol === 'alumnos';
        return (
          <button
            className={`mt-auto flex flex-col items-center gap-1 ${isEnabled ? 'text-gray-500 hover:text-green-700 focus:text-green-700' : 'text-gray-300 cursor-not-allowed'} transition`}
            onClick={() => {
              if (!isEnabled) return;
              try {
                const email = user.email ? String(user.email).trim().toLowerCase() : '';
                if (email) localStorage.setItem('open_student_email', email);
              } catch { /* ignore */ }
              setSection('students');
            }}
            title="Mi Perfil"
            aria-label="Mi Perfil"
            disabled={!isEnabled}
            aria-disabled={!isEnabled}
          >
            <UserIcon className="h-6 w-6" />
            <span className="text-xs font-medium">Mi Perfil</span>
          </button>
        );
      })()}
    </aside>
  );
}
