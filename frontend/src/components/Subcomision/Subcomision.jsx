import { useMemo, useState } from 'react';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  WalletIcon,
} from '@heroicons/react/24/outline';
import ProtectedRoute from '../ProtectedRoute';
import EventCost from './EventCost';
import Tasks from './Tasks';
import Meetings from './Meetings';
import Repairs from './Repairs';
import Wallet from './Wallet';

const sections = [
  { key: 'eventos', label: 'Eventos', icon: CalendarDaysIcon },
  { key: 'tareas', label: 'Tareas', icon: CheckCircleIcon },
  { key: 'reuniones', label: 'Reuniones', icon: UsersIcon },
  { key: 'reparaciones', label: 'Reparaciones', icon: WrenchScrewdriverIcon },
  { key: 'cartera', label: 'Cartera', icon: WalletIcon },
];

export default function Subcomision() {
  const [activeSection, setActiveSection] = useState('eventos');

  const currentSection = useMemo(
    () => sections.find((section) => section.key === activeSection) || sections[0],
    [activeSection]
  );

  const SectionIcon = currentSection.icon;

  return (
    <ProtectedRoute>
      <div className="w-full sm:max-w-7xl mx-auto px-0 sm:px-2" data-aos="fade-up">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Subcomision</h2>
              <p className="text-sm text-slate-600 mt-1">Espacio de gestion para eventos, tareas, reuniones, reparaciones y cartera.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-emerald-700 text-sm font-medium">
              <SectionIcon className="h-5 w-5" />
              <span>{currentSection.label}</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = section.key === activeSection;
              return (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => setActiveSection(section.key)}
                  className={`rounded-xl border px-3 py-3 text-left transition ${isActive ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <span className="font-semibold text-sm">{section.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {activeSection === 'eventos' && <EventCost />}
          {activeSection === 'tareas' && <Tasks />}
          {activeSection === 'reuniones' && <Meetings />}
          {activeSection === 'reparaciones' && <Repairs />}
          {activeSection === 'cartera' && <Wallet />}
        </div>
      </div>
    </ProtectedRoute>
  );
}
