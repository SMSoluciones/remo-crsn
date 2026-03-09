import { LifebuoyIcon, WrenchScrewdriverIcon, UserGroupIcon, ChartBarIcon, Cog6ToothIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/useAuth';


const navItems = [
  
  { label: 'Dashboard', icon: <ChartBarIcon className="h-6 w-6" />, section: 'dashboard' },
  { label: 'Botes', icon: <LifebuoyIcon className="h-6 w-6" />, section: 'boats' },
  { label: 'Alumnos', icon: <UserGroupIcon className="h-6 w-6" />, section: 'students' },
  { label: 'Fichas Técnicas', icon: <WrenchScrewdriverIcon className="h-6 w-6" />, section: 'sheets' },
  { label: 'Información', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  ), section: 'informacion' },
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
    <>
    
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
        const currentRole = String(user?.rol || '').trim().toLowerCase();
        const isEnabled = currentRole === 'alumnos' || currentRole === 'alumno';
        return (
          <button
            className={`mt-auto flex flex-col items-center gap-1 ${isEnabled ? 'text-gray-500 hover:text-green-700 focus:text-green-700' : 'text-gray-300 cursor-not-allowed'} transition`}
            onClick={() => {
              if (!isEnabled) return;
              try {
                if (window.appOpenMyProfileModal) {
                  window.appOpenMyProfileModal();
                } else {
                  localStorage.setItem('open_my_profile', '1');
                }
              } catch { /* ignore */ }
              setSection('students');
            }}
            title="Mi Perfil"
            aria-label="Mi Perfil"
            disabled={!isEnabled}
            aria-disabled={!isEnabled}
          >
            <UserIcon className="h-6 w-6" />
          </button>
        );
      })()}
      </aside>
      </>
  );
}
