import { LifebuoyIcon, WrenchScrewdriverIcon, UserGroupIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

const navItems = [
  { label: 'Dashboard', icon: <ChartBarIcon className="h-6 w-6" />, section: 'dashboard' },
  { label: 'Botes', icon: <LifebuoyIcon className="h-6 w-6" />, section: 'boats' },
  { label: 'Alumnos', icon: <UserGroupIcon className="h-6 w-6" />, section: 'students' },
  { label: 'Fichas Técnicas', icon: <WrenchScrewdriverIcon className="h-6 w-6" />, section: 'sheets' },
  { label: 'Configuración', icon: <Cog6ToothIcon className="h-6 w-6" />, section: 'settings' },
];

export default function Sidebar({ section, setSection }) {
  return (
    <aside className="bg-white shadow-lg h-screen w-20 flex flex-col items-center py-6 gap-6 fixed left-0 top-0 z-20">
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
  );
}
