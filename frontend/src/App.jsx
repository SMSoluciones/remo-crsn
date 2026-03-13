import { useState, useEffect, useLayoutEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { LifebuoyIcon, WrenchScrewdriverIcon, UserGroupIcon, ChartBarIcon, Cog6ToothIcon, UserIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import Avatar from 'react-avatar';
import { useAuth } from './context/useAuth.js';
import { AuthProvider } from './context/AuthContext.jsx';
import Login from './components/Login/Login.jsx';
import Dashboard from "./components/Dashboard.jsx";
import Boats from './components/Boats/Boats.jsx';
import Students from './components/Students/Students.jsx';
import TechnicalSheets from './components/Students/TechnicalSheets.jsx';
import Settings from './components/Settings/Settings.jsx';
import Subcomision from './components/Subcomision/Subcomision.jsx';
import Topbar from './components/Topbar.jsx';
import Informacion from './components/Informacion/Informacion.jsx';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';




function MainApp() {
  const { user, logout } = useAuth();
  const [section, setSection] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useLayoutEffect(() => {
    const isDark = theme === 'dark';
    const root = document.documentElement;
    const body = document.body;

    // Keep DOM classes and data attribute strictly in sync with app state.
    root.classList.remove('dark');
    body.classList.remove('dark');
    if (isDark) {
      root.classList.add('dark');
      body.classList.add('dark');
    }
    root.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

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

  const role = String(user?.rol || '').trim().toLowerCase();
  const canViewSubcomision = ['admin', 'subcomision'].includes(role);

  useEffect(() => {
    if (!user) return;
    if (section === 'subcomision' && !canViewSubcomision) {
      setSection('dashboard');
    }
  }, [section, canViewSubcomision, user]);

  if (!user) return <Login />;

  const navItems = [
    { label: 'Dashboard', icon: <ChartBarIcon className="h-6 w-6" />, section: 'dashboard' },
    { label: 'Botes', icon: <LifebuoyIcon className="h-6 w-6" />, section: 'boats' },
    { label: 'Alumnos', icon: <UserGroupIcon className="h-6 w-6" />, section: 'students' },
    { label: 'Fichas Técnicas', icon: <WrenchScrewdriverIcon className="h-6 w-6" />, section: 'sheets' },
    { label: 'Subcomision', icon: <BriefcaseIcon className="h-6 w-6" />, section: 'subcomision' },
    { label: 'Información', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
      </svg>
    ), section: 'informacion' },
    { label: 'Configuración', icon: <Cog6ToothIcon className="h-6 w-6" />, section: 'settings' },
  ];

  // Filtrar elementos que no deberían verse por rol
  const visibleNavItems = navItems.filter(item => {
    if (item.section === 'sheets' && user?.rol === 'alumnos') return false;
    if (item.section === 'subcomision' && !canViewSubcomision) return false;
    return true;
  });
  const dashboardNavItem = visibleNavItems.find((item) => item.section === 'dashboard');
  const subcomisionNavItem = visibleNavItems.find((item) => item.section === 'subcomision');
  const settingsNavItem = visibleNavItems.find((item) => item.section === 'settings');
  const secondaryNavItems = visibleNavItems.filter(
    (item) => item.section !== 'dashboard' && item.section !== 'subcomision' && item.section !== 'settings'
  );

  return (
    <div className={`flex min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-gray-100 text-slate-900'}`}>
      <aside className={`hidden md:flex md:flex-col h-screen w-24 items-center py-8 gap-8 fixed left-0 top-0 z-20 shadow-lg ${theme === 'dark' ? 'bg-slate-900 border-r border-slate-700' : 'bg-white border-r border-slate-200'}`}>
        <button
          onClick={() => setSection('dashboard')}
          className="focus:outline-none"
          aria-label="Ir al Dashboard"
          title="Dashboard"
        >
          <img src="icon.svg" alt="Club" className="h-10 w-10" />
        </button>
        {dashboardNavItem && (
          <button
            className={`flex flex-col items-center gap-1 transition ${theme === 'dark' ? 'text-slate-400 hover:text-emerald-400 focus:text-emerald-400' : 'text-gray-500 hover:text-green-700 focus:text-green-700'} ${section === dashboardNavItem.section ? (theme === 'dark' ? 'text-emerald-400' : 'text-green-700') : ''}`}
            onClick={() => setSection(dashboardNavItem.section)}
            title={dashboardNavItem.label}
          >
            {dashboardNavItem.icon}
            <span className="text-xs font-medium">{dashboardNavItem.label}</span>
          </button>
        )}
        {/* Botón Mi Perfil debajo de Dashboard */}
        {user && (() => {
          const currentRole = String(user?.rol || '').trim().toLowerCase();
          const isEnabled = currentRole === 'alumnos' || currentRole === 'alumno';
          return (
            <button
              className={`flex flex-col items-center gap-1 ${isEnabled ? (theme === 'dark' ? 'text-slate-400 hover:text-emerald-400 focus:text-emerald-400' : 'text-gray-500 hover:text-green-700 focus:text-green-700') : 'text-gray-300 cursor-not-allowed'} transition`}
              onClick={() => {
                if (!isEnabled) return;
                try {
                  setSection('students');
                  if (window.appOpenMyProfileModal) {
                    setTimeout(() => window.appOpenMyProfileModal(), 50);
                  } else {
                    localStorage.setItem('open_my_profile', '1');
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
        {secondaryNavItems.map(item => (
          <button
            key={item.section}
            className={`flex flex-col items-center gap-1 transition ${theme === 'dark' ? 'text-slate-400 hover:text-emerald-400 focus:text-emerald-400' : 'text-gray-500 hover:text-green-700 focus:text-green-700'} ${section === item.section ? (theme === 'dark' ? 'text-emerald-400' : 'text-green-700') : ''}`}
            onClick={() => setSection(item.section)}
            title={item.label}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
        {(subcomisionNavItem || settingsNavItem) && (
          <div className="mt-auto flex flex-col items-center gap-2">
            {subcomisionNavItem && (
              <button
                className={`flex flex-col items-center gap-1 transition ${theme === 'dark' ? 'text-slate-400 hover:text-emerald-400 focus:text-emerald-400' : 'text-gray-500 hover:text-green-700 focus:text-green-700'} ${section === subcomisionNavItem.section ? (theme === 'dark' ? 'text-emerald-400' : 'text-green-700') : ''}`}
                onClick={() => setSection(subcomisionNavItem.section)}
                title={subcomisionNavItem.label}
              >
                {subcomisionNavItem.icon}
                <span className="text-xs font-medium">{subcomisionNavItem.label}</span>
              </button>
            )}
            {settingsNavItem && (
              <button
                className={`flex flex-col items-center gap-1 transition ${theme === 'dark' ? 'text-slate-400 hover:text-emerald-400 focus:text-emerald-400' : 'text-gray-500 hover:text-green-700 focus:text-green-700'} ${section === settingsNavItem.section ? (theme === 'dark' ? 'text-emerald-400' : 'text-green-700') : ''}`}
                onClick={() => setSection(settingsNavItem.section)}
                title={settingsNavItem.label}
              >
                {settingsNavItem.icon}
                <span className="text-xs font-medium">{settingsNavItem.label}</span>
              </button>
            )}
          </div>
        )}
      </aside>
      {/* Mobile off-canvas menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className={`fixed inset-0 backdrop-blur-sm z-40 ${theme === 'dark' ? 'bg-slate-950/55' : 'bg-white/30'}`}
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside data-aos="fade-right" data-aos-duration="500" className={`fixed left-0 top-0 h-full w-64 shadow p-6 z-50 flex flex-col overflow-y-auto ${theme === 'dark' ? 'bg-slate-900 border-r border-slate-700' : 'bg-white border-r border-slate-200'}`}>
            <button
              onClick={() => {
                setSection('dashboard');
                setMobileMenuOpen(false);
              }}
              className="focus:outline-none mb-6"
              aria-label="Ir al Dashboard"
              title="Dashboard"
            >
              <img src="icon.svg" alt="Club" className="h-10 w-10" />
            </button>
            {dashboardNavItem && (
              <button
                className={`flex items-center gap-3 w-full text-left py-3 ${theme === 'dark' ? 'text-slate-200 hover:text-emerald-400' : 'text-gray-700 hover:text-green-700'} ${section === dashboardNavItem.section ? (theme === 'dark' ? 'text-emerald-400' : 'text-green-700') : ''}`}
                onClick={() => { setSection(dashboardNavItem.section); setMobileMenuOpen(false); }}
                title={dashboardNavItem.label}
              >
                {dashboardNavItem.icon}
                <span className="font-medium">{dashboardNavItem.label}</span>
              </button>
            )}
            {user && (() => {
              const currentRole = String(user?.rol || '').trim().toLowerCase();
              const isEnabled = currentRole === 'alumnos' || currentRole === 'alumno';
              return (
                <button
                  className={`flex items-center gap-3 w-full text-left py-3 ${isEnabled ? (theme === 'dark' ? 'text-slate-200 hover:text-emerald-400' : 'text-gray-700 hover:text-green-700') : 'text-gray-300 cursor-not-allowed'}`}
                  onClick={() => {
                    if (!isEnabled) return;
                    try {
                      setSection('students');
                      if (window.appOpenMyProfileModal) {
                        setTimeout(() => window.appOpenMyProfileModal(), 50);
                      } else {
                        localStorage.setItem('open_my_profile', '1');
                      }
                    } catch { /* ignore */ }
                    setMobileMenuOpen(false);
                  }}
                  title="Mi Perfil"
                  disabled={!isEnabled}
                  aria-disabled={!isEnabled}
                >
                  <UserIcon className="h-6 w-6" />
                  <span className="font-medium">Mi Perfil</span>
                </button>
              );
            })()}
            {secondaryNavItems.map(item => (
              <button
                key={item.section}
                className={`flex items-center gap-3 w-full text-left py-3 ${theme === 'dark' ? 'text-slate-200 hover:text-emerald-400' : 'text-gray-700 hover:text-green-700'} ${section === item.section ? (theme === 'dark' ? 'text-emerald-400' : 'text-green-700') : ''}`}
                onClick={() => { setSection(item.section); setMobileMenuOpen(false); }}
                title={item.label}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
            {(subcomisionNavItem || settingsNavItem) && (
              <div className="mt-auto">
                {subcomisionNavItem && (
                  <button
                    className={`flex items-center gap-3 w-full text-left py-3 ${theme === 'dark' ? 'text-slate-200 hover:text-emerald-400' : 'text-gray-700 hover:text-green-700'} ${section === subcomisionNavItem.section ? (theme === 'dark' ? 'text-emerald-400' : 'text-green-700') : ''}`}
                    onClick={() => { setSection(subcomisionNavItem.section); setMobileMenuOpen(false); }}
                    title={subcomisionNavItem.label}
                  >
                    {subcomisionNavItem.icon}
                    <span className="font-medium">{subcomisionNavItem.label}</span>
                  </button>
                )}
                {settingsNavItem && (
                  <button
                    className={`flex items-center gap-3 w-full text-left py-3 ${theme === 'dark' ? 'text-slate-200 hover:text-emerald-400' : 'text-gray-700 hover:text-green-700'} ${section === settingsNavItem.section ? (theme === 'dark' ? 'text-emerald-400' : 'text-green-700') : ''}`}
                    onClick={() => { setSection(settingsNavItem.section); setMobileMenuOpen(false); }}
                    title={settingsNavItem.label}
                  >
                    {settingsNavItem.icon}
                    <span className="font-medium">{settingsNavItem.label}</span>
                  </button>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
      <div className="flex-1 flex flex-col md:ml-24">
  <Topbar onLogout={logout} onMobileMenuToggle={setMobileMenuOpen} theme={theme} onToggleTheme={toggleTheme} />
  <ToastContainer position="bottom-right" transition={Slide} />
        <main className="flex flex-row gap-8 pt-24 md:pt-28 px-4 md:px-10 pb-8">
          <div className="flex-1">
            {section === 'dashboard' && <Dashboard />}
            {section === 'boats' && <Boats />}
            {section === 'students' && <Students />}
            {section === 'sheets' && <TechnicalSheets />}
            {section === 'subcomision' && canViewSubcomision && <Subcomision />}
            {section === 'informacion' && <Informacion />}
            {section === 'settings' && (
              <Settings />
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
