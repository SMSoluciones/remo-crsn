import ProtectedRoute from './ProtectedRoute';
import { useEffect, useState } from 'react';
import { fetchStudents } from '../models/Student';
import { fetchBoats } from '../models/Boat';
import { fetchAllSheets } from '../models/TechnicalSheet';
import { useAuth } from '../context/useAuth';
import { fetchEvents } from '../models/Event';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import {
  LifebuoyIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowUpRightIcon,
} from '@heroicons/react/24/outline';


export default function Dashboard() {
  const [studentsCount, setStudentsCount] = useState(null);
  const [studentsError, setStudentsError] = useState(null);
  const [totalBoats, setTotalBoats] = useState(null);
  const [activeBoats, setActiveBoats] = useState(null);
  const [repairBoats, setRepairBoats] = useState(null);
  const [boatsError, setBoatsError] = useState(null);
  const [globalAvg, setGlobalAvg] = useState(null);
  const [avgError, setAvgError] = useState(null);
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchStudents()
      .then((list) => {
        if (!mounted) return;
        setStudentsCount(Array.isArray(list) ? list.length : 0);
      })
      .catch((err) => {
        console.error('Error obteniendo alumnos:', err);
        setStudentsError('No se pudo cargar');
        setStudentsCount(0);
      });
    return () => { mounted = false };
  }, []);

  useEffect(() => {
    let mounted = true;
    setEventsLoading(true);
    fetchEvents()
      .then(list => {
        if (!mounted) return;
        const arr = Array.isArray(list) ? list : [];
        const allSorted = arr.filter(ev => ev.date).sort((a,b) => new Date(a.date) - new Date(b.date));
        setEvents(allSorted);
        console.log('Eventos cargados:', allSorted);
      })
      .catch(err => {
        console.error('Error obteniendo eventos:', err);
        setEventsError('No se pudo cargar');
      })
      .finally(() => { if (mounted) setEventsLoading(false); });
    return () => { mounted = false };
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchBoats()
      .then((list) => {
        if (!mounted) return;
        const boats = Array.isArray(list) ? list : [];
        const norm = (v) => (v ?? '').toString().trim().toLowerCase();
        setTotalBoats(boats.length);
        setActiveBoats(boats.filter(b => norm(b.estado) === 'activo').length);
        // Reparación = mantenimiento + fuera_servicio
        setRepairBoats(
          boats.filter(b => {
            const s = norm(b.estado);
            return s === 'mantenimiento' || s === 'fuera_servicio';
          }).length
        );
      })
      .catch(err => {
        console.error('Error obteniendo botes:', err);
        setBoatsError('No se pudo cargar');
        setTotalBoats(0);
        setActiveBoats(0);
        setRepairBoats(0);
      });
    return () => { mounted = false };
  }, []);

  useEffect(() => {
    let mounted = true;
    // Necesita rol entrenador o admin según backend; si falta user/rol, no intenta.
    if (!user || !user.rol || !['admin','entrenador'].includes(String(user.rol).toLowerCase())) {
      setAvgError('Rol no autorizado');
      setGlobalAvg(0);
      return;
    }
    fetchAllSheets(user)
      .then(sheets => {
        if (!mounted) return;
        const rows = Array.isArray(sheets) ? sheets : [];
        let sum = 0;
        let count = 0;
        for (const sh of rows) {
          // Cada ficha: postura, remada, equilibrio, coordinacion, resistencia, velocidad
          const nums = [sh.postura, sh.remada, sh.equilibrio, sh.coordinacion, sh.resistencia, sh.velocidad]
            .map(n => Number(n) || 0);
          if (nums.every(v => v === 0)) continue; // si todas 0, posiblemente ficha vacía
          const avg = nums.reduce((a,b)=>a+b,0)/nums.length;
          sum += avg;
          count += 1;
        }
        const finalAvg = count === 0 ? 0 : (sum / count);
        setGlobalAvg(finalAvg);
      })
      .catch(err => {
        console.error('Error obteniendo fichas técnicas:', err);
        setAvgError('No se pudo cargar');
        setGlobalAvg(0);
      });
    return () => { mounted = false };
  }, [user]);
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center py-8 px-4">
      <div className="flex justify-between items-center w-full max-w-6xl mb-6">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-gradient-to-b from-blue-900 to-blue-500 text-white rounded-full hover:opacity-90">Botón 1</button>
          <button className="px-4 py-2 bg-gradient-to-b from-blue-900 to-blue-500 text-white rounded-full hover:opacity-90">Botón 2</button>
        </div>
      </div>
      <div className="bg-white text-black rounded-2xl p-6 shadow-lg w-full max-w-6xl mb-6 h-40 hover:bg-gradient-to-b hover:from-blue-900 hover:to-blue-500 hover:text-white transition-transform duration-300 hover:scale-105">
        <h2 className="text-2xl font-bold">ANUNCIOS</h2>
      </div>
      <div className="grid grid-cols-3 gap-4 w-full max-w-6xl">
        {/* Casillero principal */}
        <div className="bg-white text-black rounded-2xl p-4 shadow-lg h-40 hover:bg-gradient-to-b hover:from-blue-900 hover:to-blue-500 hover:text-white transition-all duration-300 hover:scale-105 relative overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold">Eventos</h2>
            <span className="text-black bg-gray-300 rounded-full p-2 hover:bg-green-800 hover:text-white">
              <ArrowUpRightIcon className="w-6 h-6" />
            </span>
          </div>
          {eventsLoading ? (
            <div className="flex items-center justify-center h-24">Cargando...</div>
          ) : eventsError ? (
            <div className="text-sm text-red-600">{eventsError}</div>
          ) : events.length === 0 ? (
            <div className="text-sm opacity-70 flex items-center justify-center h-24">No hay eventos</div>
          ) : (
            <div className="h-24 overflow-y-auto pr-2 space-y-2">
              {events.map(ev => {
                const fecha = ev.date ? new Date(ev.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Sin fecha';
                return (
                  <div key={ev._id || ev.id} className="border rounded-lg px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 transition">
                    <p className="font-semibold text-gray-800 truncate">{ev.title || 'Evento'}</p>
                    <p className="mt-1 text-gray-600">{fecha}</p>
                    <p className="mt-1 italic text-gray-500 truncate">{ev.description || 'Sin descripción'}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Casilleros secundarios */}
        <div className="bg-white text-black rounded-2xl p-6 shadow-lg flex flex-col justify-between h-40 hover:bg-gradient-to-b hover:from-blue-900 hover:to-blue-500 hover:text-white transition-transform duration-300 hover:scale-105">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Total Projects</h2>
            <span className="text-black bg-gray-300 rounded-full p-2 hover:bg-green-800 hover:text-white">
              <ArrowUpRightIcon className="w-6 h-6" />
            </span>
          </div>
          <div className="text-4xl font-bold">24</div>
       
        </div>

        <div className="bg-white text-black rounded-2xl p-6 shadow-lg flex flex-col justify-between h-40 hover:bg-gradient-to-b hover:from-blue-900 hover:to-blue-500 hover:text-white transition-transform duration-300 hover:scale-105">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Total Projects</h2>
            <span className="text-black bg-gray-300 rounded-full p-2 hover:bg-green-800 hover:text-white">
              <ArrowUpRightIcon className="w-6 h-6" />
            </span>
          </div>
          <div className="text-4xl font-bold">24</div>
       
        </div>

        {/* Casillero grande */}
        <div className="bg-white text-black rounded-2xl p-6 shadow-lg flex flex-col justify-between col-span-2 h-auto">
          <h2 className="text-lg font-bold mb-4">Estadísticas</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-green-600 text-white rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center text-center">
              <LifebuoyIcon className="w-10 h-10 mb-2" />
              <h3 className="text-lg font-bold">Total de Botes</h3>
              <p className="text-4xl font-bold">{totalBoats === null ? '...' : totalBoats}</p>
              <p className="text-sm mt-1 opacity-90">Activos: {activeBoats === null ? '...' : activeBoats}</p>
              {boatsError && <span className="text-xs mt-1 opacity-80">{boatsError}</span>}
            </div>
            <div className="bg-yellow-500 text-white rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center text-center">
              <WrenchScrewdriverIcon className="w-10 h-10 mb-2" />
              <h3 className="text-lg font-bold">Botes en reparación</h3>
              <p className="text-4xl font-bold">{repairBoats === null ? '...' : repairBoats}</p>
              {boatsError && <span className="text-xs mt-1 opacity-80">{boatsError}</span>}
            </div>
            <div className="bg-blue-600 text-white rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center text-center">
              <UserGroupIcon className="w-10 h-10 mb-2" />
              <h3 className="text-lg font-bold">Alumnos activos</h3>
              <p className="text-4xl font-bold">{studentsCount === null ? '...' : studentsCount}</p>
              {studentsError && <span className="text-xs mt-1 opacity-80">{studentsError}</span>}
            </div>
            <div className="bg-purple-600 text-white rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center text-center">
              <ChartBarIcon className="w-10 h-10 mb-2" />
              <h3 className="text-lg font-bold">Promedio técnico</h3>
              <p className="text-4xl font-bold">{globalAvg === null ? '...' : globalAvg.toFixed(1)}</p>
              {avgError && <span className="text-xs mt-1 opacity-80">{avgError}</span>}
            </div>
          </div>
        </div>

        <div className="bg-white text-black rounded-2xl p-6 shadow-lg flex flex-col justify-between h-40 hover:bg-gradient-to-b hover:from-blue-900 hover:to-blue-500 hover:text-white transition-transform duration-300 hover:scale-105">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Total Projects</h2>
            <span className="text-black bg-gray-300 rounded-full p-2 hover:bg-green-800 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap ="round" strokeLinejoin="round" d="M8.25 15.75L15.75 8.25M8.25 8.25h7.5v7.5" />
              </svg>
            </span>
          </div>
          <div className="text-4xl font-bold">24</div>
        </div>
      </div>
    </div>
  );
}
