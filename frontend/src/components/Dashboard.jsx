import ProtectedRoute from './ProtectedRoute';
import { AcademicCapIcon, WrenchScrewdriverIcon, UserGroupIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { fetchStudents } from '../models/Student';

const mockKPIs = {
  totalBoats: 5,
  boatsInRepair: 1,
  activeStudents: 12,
  lastReports: [
    { id: 'r1', boat: 'Bote 2', status: 'en reparación', fecha: '2025-10-10' },
    { id: 'r2', boat: 'Bote 1', status: 'abierto', fecha: '2025-10-12' },
  ],
  avgTechnical: 7.8,
};



import Avatar from 'react-avatar';
import UsersAdmin from './Login/UsersAdmin';
import { useAuth } from '../context/useAuth';

const mockRanking = [
  { id: 's1', nombre: 'Juan García', puntos: 28 },
  { id: 's2', nombre: 'Ana López', puntos: 25 },
  { id: 's3', nombre: 'Pedro Díaz', puntos: 22 },
];

const mockProfile = {
  nombre: 'Juan García',
  goles: 120,
  categoria: 'Senior',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [studentCount, setStudentCount] = useState(mockKPIs.activeStudents);

  useEffect(() => {
    let mounted = true;
    fetchStudents().then(data => {
      if (!mounted) return;
      setStudentCount(Array.isArray(data) ? data.length : (data.count || mockKPIs.activeStudents));
    }).catch(err => {
      console.error('No se pudo obtener el conteo de alumnos:', err);
    });
    return () => { mounted = false };
  }, []);
  return (
    <ProtectedRoute allowedRoles={['admin', 'entrenador', 'mantenimiento']}>
      <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 w-full max-w-6xl mx-auto">
          {/* Columna principal Dashboard */}
          <div className="col-span-2 flex flex-col gap-10 items-center justify-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-800 self-start">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 w-full">
              <div className="bg-green-700 text-white rounded-2xl p-10 shadow-lg flex flex-col items-center justify-center min-h-[160px]">
                <AcademicCapIcon className="h-10 w-10 mb-3" />
                <span className="text-lg">Total de Botes</span>
                <span className="text-5xl font-bold mt-2">{mockKPIs.totalBoats}</span>
              </div>
              <div className="bg-yellow-500 text-white rounded-2xl p-10 shadow-lg flex flex-col items-center justify-center min-h-[160px]">
                <WrenchScrewdriverIcon className="h-10 w-10 mb-3" />
                <span className="text-lg">Botes en reparación</span>
                <span className="text-5xl font-bold mt-2">{mockKPIs.boatsInRepair}</span>
              </div>
              <div className="bg-blue-600 text-white rounded-2xl p-10 shadow-lg flex flex-col items-center justify-center min-h-[160px]">
                <UserGroupIcon className="h-10 w-10 mb-3" />
                <span className="text-lg">Alumnos activos</span>
                <span className="text-5xl font-bold mt-2">{studentCount}</span>
              </div>
              <div className="bg-purple-600 text-white rounded-2xl p-10 shadow-lg flex flex-col items-center justify-center min-h-[160px]">
                <ChartBarIcon className="h-10 w-10 mb-3" />
                <span className="text-lg">Promedio técnico</span>
                <span className="text-5xl font-bold mt-2">{mockKPIs.avgTechnical}</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Últimos reportes de fallas</h3>
              <ul className="divide-y divide-gray-200">
                {mockKPIs.lastReports.map(r => (
                  <li key={r.id} className="py-2 flex justify-between items-center">
                    <span className="font-medium text-gray-800">{r.boat}</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${r.status === 'en reparación' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'}`}>{r.status}</span>
                    <span className="text-gray-500">{r.fecha}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* Columna lateral Dashboard */}
          <div className="flex flex-col gap-8 w-full max-w-xs justify-start">
            <div className="bg-white rounded-2xl shadow-lg p-8" data-aos="fade-right">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Ranking interno</h3>
              <ul className="space-y-3">
                {mockRanking.map((alum, idx) => (
                  <li key={alum.id} className="flex items-center gap-3">
                    <span className="font-bold text-gray-500">{idx + 1}</span>
                    <Avatar name={alum.nombre} size="32" round={true} />
                    <span className="font-medium text-gray-800">{alum.nombre}</span>
                    <span className="ml-auto text-green-700 font-bold">{alum.puntos} pts</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8" data-aos="fade-right">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Trending Now</h3>
              <div className="flex items-center gap-3">
                <Avatar name={mockProfile.nombre} size="48" round={true} />
                <div>
                  <span className="font-bold text-gray-800">{mockProfile.nombre}</span>
                  <div className="text-sm text-gray-500">{mockProfile.categoria} | <span className="text-yellow-500 font-bold">{mockProfile.goles} logros</span></div>
                  <button className="mt-2 px-3 py-1 bg-green-700 text-white rounded hover:bg-green-800 transition text-xs">Ver perfil</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Sección de administración de usuarios solo para admin */}
        {user?.rol === 'admin' && (
          <div className="mt-12 w-full max-w-6xl mx-auto">
            <UsersAdmin />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
