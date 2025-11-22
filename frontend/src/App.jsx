import { useState } from 'react';
import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { LifebuoyIcon, WrenchScrewdriverIcon, UserGroupIcon, ChartBarIcon, Cog6ToothIcon, UserIcon } from '@heroicons/react/24/outline';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Exponer setSection globalmente para permitir redirecciones desde componentes
  useEffect(() => {
    // exponer solo una referencia ligera
    window.appSetSection = setSection;
    return () => { delete window.appSetSection; };
  }, [setSection]);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  // Refresh AOS when mobile menu opens so the animation runs on the freshly rendered aside
  useEffect(() => {
    try {
      AOS.refresh();
    } catch (err) {
      // if AOS isn't available for some reason, ignore
      console.warn('AOS refresh failed', err);
    }
  }, [mobileMenuOpen]);

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
      <aside className="hidden md:flex md:flex-col bg-white shadow-lg h-screen w-24 items-center py-8 gap-8 fixed left-0 top-0 z-20">
        <img src="icon.svg" alt="" className="h-10 w-10" />
        {/* Botón Mi Perfil arriba del Dashboard */}
        {user && (() => {
          const isEnabled = user?.rol === 'alumnos';
          return (
            <button
              className={`flex flex-col items-center gap-1 ${isEnabled ? 'text-gray-500 hover:text-green-700 focus:text-green-700' : 'text-gray-300 cursor-not-allowed'} transition`}
              onClick={() => {
                if (!isEnabled) return;
                // Intentar usar la función global expuesta por Students para abrir directamente el perfil
                try {
                  const email = user.email ? String(user.email).trim().toLowerCase() : '';
                  setSection('students');
                  if (window.appOpenStudentProfile) {
                    // slight delay to ensure Students is mounted
                    setTimeout(() => window.appOpenStudentProfile(email), 50);
                  } else {
                    // fallback: store in localStorage para que Students lo detecte
                    if (email) localStorage.setItem('open_student_email', email);
                  }
                } catch { /* ignore */ }
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
      {/* Mobile off-canvas menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-white/30 backdrop-blur-sm z-40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside data-aos="fade-right" data-aos-duration="500" className="fixed left-0 top-0 h-full w-64 bg-white shadow p-6 z-50">
            <img src="icon.svg" alt="" className="h-10 w-10 mb-6" />
            {visibleNavItems.map(item => (
              <button
                key={item.section}
                className={`flex items-center gap-3 w-full text-left text-gray-700 hover:text-green-700 py-3 ${section === item.section ? 'text-green-700' : ''}`}
                onClick={() => { setSection(item.section); setMobileMenuOpen(false); }}
                title={item.label}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </aside>
        </div>
      )}
      <div className="flex-1 flex flex-col md:ml-24">
  <Topbar onLogout={logout} onMobileMenuToggle={setMobileMenuOpen} />
  <ToastContainer position="bottom-right" transition={Slide} />
        <main className="flex flex-row gap-8 pt-24 md:pt-28 px-4 md:px-10 pb-8">
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
