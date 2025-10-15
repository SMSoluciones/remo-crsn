
import { useState } from 'react';
import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { AcademicCapIcon, WrenchScrewdriverIcon, UserGroupIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import Avatar from 'react-avatar';
import { useAuth } from './context/useAuth.js';
import { AuthProvider } from './context/AuthContext.jsx';
import Login from './modules/Login.jsx';
import Dashboard from './modules/Dashboard.jsx';
import Boats from './modules/Boats.jsx';
import Students from './modules/Students.jsx';
import TechnicalSheets from './modules/TechnicalSheets.jsx';
import './App.css';



function MainApp() {
  const { user, logout } = useAuth();
  const [section, setSection] = useState('dashboard');

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  if (!user) return <Login />;

  const navItems = [
    { label: 'Dashboard', icon: <ChartBarIcon className="h-6 w-6" />, section: 'dashboard' },
    { label: 'Botes', icon: <AcademicCapIcon className="h-6 w-6" />, section: 'boats' },
    { label: 'Alumnos', icon: <UserGroupIcon className="h-6 w-6" />, section: 'students' },
    { label: 'Fichas Técnicas', icon: <WrenchScrewdriverIcon className="h-6 w-6" />, section: 'sheets' },
    { label: 'Configuración', icon: <Cog6ToothIcon className="h-6 w-6" />, section: 'settings' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="bg-white shadow-lg h-screen w-24 flex flex-col items-center py-8 gap-8 fixed left-0 top-0 z-20">
        {navItems.map(item => (
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
        <header className="w-full h-20 bg-white shadow flex items-center justify-between px-10 fixed top-0 left-24 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-blue-700">Club Regatas San Nicolás</h1>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative">
              <ChartBarIcon className="h-6 w-6 text-gray-500" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            <div className="flex items-center gap-2">
              <Avatar name={user?.nombre + ' ' + user?.apellido} size="36" round={true} />
              <span className="font-medium text-gray-700">{user?.nombre}</span>
            </div>
            <button onClick={logout} className="ml-4 px-3 py-1 bg-green-700 text-white rounded hover:bg-green-800 transition">Salir</button>
          </div>
        </header>
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
