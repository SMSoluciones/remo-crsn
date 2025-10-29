import { useState } from 'react';
import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { LifebuoyIcon, WrenchScrewdriverIcon, UserGroupIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import Avatar from 'react-avatar';
import { useAuth } from './context/useAuth.js';
import { AuthProvider } from './context/AuthContext.jsx';
import Login from './components/Login/Login.jsx';
import Dashboard from "./components/Dashboard.jsx";
import Boats from './components/Boats/Boats.jsx';
import Students from './components/Students/Students.jsx';
import TechnicalSheets from './components/Students/TechnicalSheets.jsx';
import Topbar from './components/Topbar.jsx';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';




function MainApp() {
  const { user, logout } = useAuth();
  const [section, setSection] = useState('dashboard');

  // Exponer setSection globalmente para permitir redirecciones desde componentes
  useEffect(() => {
    // exponer solo una referencia ligera
    window.appSetSection = setSection;
    return () => { delete window.appSetSection; };
  }, [setSection]);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  if (!user) return <Login />;

  const navItems = [
    { label: 'Dashboard', icon: <ChartBarIcon className="h-6 w-6" />, section: 'dashboard' },
    { label: 'Botes', icon: <LifebuoyIcon className="h-6 w-6" />, section: 'boats' },
    { label: 'Alumnos', icon: <UserGroupIcon className="h-6 w-6" />, section: 'students' },
    { label: 'Fichas Técnicas', icon: <WrenchScrewdriverIcon className="h-6 w-6" />, section: 'sheets' },
    { label: 'Configuración', icon: <Cog6ToothIcon className="h-6 w-6" />, section: 'settings' },
  ];

  // Filtrar elementos que no deberían verse por rol
  const visibleNavItems = navItems.filter(item => {
    if (item.section === 'sheets' && user?.rol === 'alumnos') return false;
    return true;
  });

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="bg-white shadow-lg h-screen w-24 flex flex-col items-center py-8 gap-8 fixed left-0 top-0 z-20">
        {visibleNavItems.map(item => (
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
      </aside>
      <div className="flex-1 flex flex-col" style={{ marginLeft: 96 }}>
  <Topbar onLogout={logout} />
  <ToastContainer position="bottom-right" transition={Slide} />
        <main className="flex flex-row gap-8 pt-28 px-10 pb-8">
          <div className="flex-1">
            {section === 'dashboard' && <Dashboard />}
            {section === 'boats' && <Boats />}
            {section === 'students' && <Students />}
            {section === 'sheets' && <TechnicalSheets />}
            {section === 'settings' && (
              <div className="bg-white rounded-xl shadow p-8 text-gray-700">Configuración (próximamente)</div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}



export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
