import ProtectedRoute from './ProtectedRoute';
import { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { fetchStudents } from '../models/Student';
import { fetchBoats } from '../models/Boat';
import { createBoatUsage, fetchBoatUsages } from '../models/BoatUsage';
import { API_BASE_URL } from '../utils/apiConfig';
import { fetchAllSheets, fetchSheetsByStudent } from '../models/TechnicalSheet';
import { useAuth } from '../context/useAuth';
import { fetchEvents } from '../models/Event';
import { fetchAnnouncements } from '../models/Announcement';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import BeatLoader from 'react-spinners/BeatLoader';
import AddEventModal from './Events/AddEventModal';
import AddAnnouncementModal from './Announcements/AddAnnouncementModal.jsx';
import AnnouncementsListModal from './Announcements/AnnouncementsListModal';
import UsersAdminModal from './Login/UsersAdminModal.jsx';
import EventsListModal from './Events/EventsListModal';
import ArrivalsListModal from './Students/ArrivalsListModal';
import { showSuccess, showError } from '../utils/toast';
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
  const [recentArr, setRecentArr] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
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
  const [boatsList, setBoatsList] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(true);
  const [annError, setAnnError] = useState(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isAddAnnouncementOpen, setIsAddAnnouncementOpen] = useState(false);
  const [isUsersAdminOpen, setIsUsersAdminOpen] = useState(false);
  const [isRemarHistoryOpen, setIsRemarHistoryOpen] = useState(false);
  const [remarHistory, setRemarHistory] = useState([]);
  const [remarHistoryLoading, setRemarHistoryLoading] = useState(false);
  const [remarHistoryError, setRemarHistoryError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const role = String(user?.rol || '').trim().toLowerCase();
  const canManageEvents = ['admin','entrenador','mantenimiento','subcomision'].includes(role);
  const [isEventsListOpen, setIsEventsListOpen] = useState(false);
  const [isArrivalsListOpen, setIsArrivalsListOpen] = useState(false);
  const [isAnnouncementsListOpen, setIsAnnouncementsListOpen] = useState(false);
  const [isRemarOpen, setIsRemarOpen] = useState(false);
  const [selectedBoatId, setSelectedBoatId] = useState('');
  const [durationHours, setDurationHours] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [activeBoatLocks, setActiveBoatLocks] = useState({});
  // Ajustes del slider para eventos
  
  const eventSliderSettings = {
    dots: true,
    infinite: events.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3500,
    arrows: false,
    pauseOnHover: true,
  };
  const announcementSliderSettings = {
    dots: true,
    infinite: announcements.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3500,
    arrows: false,
    pauseOnHover: true,
  };
  const recentSliderSettings = {
    dots: true,
    infinite: recentArr.length > 1,
    speed: 400,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false,
    pauseOnHover: true,
  };

  useEffect(() => {
    let mounted = true;
    setRecentLoading(true);
    fetchStudents()
      .then((list) => {
        if (!mounted) return;
        const arr = Array.isArray(list) ? list : [];
        setStudentsCount(arr.length);
        // Ordenar por fecha de ingreso de la ficha del alumno (más reciente primero)
        const toDate = (v) => {
          if (!v) return null;
          const d = new Date(v);
          return Number.isNaN(d.getTime()) ? null : d;
        };
        const cutoff = new Date();
        cutoff.setHours(0,0,0,0);
        cutoff.setDate(cutoff.getDate() - 10);
        const recent = arr
          .map(s => ({
            src: s,
            fecha: toDate(s.fechaIngreso || s.fecha_ingreso || s.ingreso)
          }))
          .filter(item => item && item.fecha && item.fecha >= cutoff)
          .sort((a, b) => b.fecha - a.fecha)
          .slice(0, 10)
          .map(item => item.src);
        setRecentArr(recent);
      })
      .catch((err) => {
        console.error('Error obteniendo alumnos:', err);
        setStudentsError('No se pudo cargar');
        setStudentsCount(0);
        setRecentArr([]);
      })
      .finally(() => { if (mounted) setRecentLoading(false); });
    return () => { mounted = false };
  }, []);

  // Init AOS for dashboard animations
  useEffect(() => {
    try {
      AOS.init({ duration: 700, easing: 'ease-out', once: true });
    } catch (err) {
      console.warn('AOS init failed', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    setAnnLoading(true);
    fetchAnnouncements()
      .then(list => {
        if (!mounted) return;
        const arr = Array.isArray(list) ? list : [];
        const withDate = arr.filter(a => a && a.date);
        const withoutDate = arr.filter(a => !a || !a.date);
        withDate.sort((a,b) => new Date(a.date) - new Date(b.date));
        setAnnouncements([...withDate, ...withoutDate]);
      })
      .catch(err => {
        console.error('Error obteniendo anuncios:', err);
        setAnnError('No se pudo cargar');
      })
      .finally(() => { if (mounted) setAnnLoading(false); });
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
        setBoatsList(boats);
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
    // Mostrar el promedio técnico a TODOS los roles: intentamos obtener las fichas
    const effectiveUser = user || {};
    const effectiveRole = String(effectiveUser?.rol || '').trim().toLowerCase();
    fetchAllSheets(effectiveUser)
      .then(sheets => {
        if (!mounted) return;
        const rows = Array.isArray(sheets) ? sheets : [];
        let sum = 0;
        let count = 0;
        for (const sh of rows) {
          const nums = [sh.postura, sh.remada, sh.equilibrio, sh.coordinacion, sh.resistencia, sh.velocidad]
            .map(n => Number(n) || 0);
          if (nums.every(v => v === 0)) continue;
          const avg = nums.reduce((a,b)=>a+b,0)/nums.length;
          sum += avg;
          count += 1;
        }
        const finalAvg = count === 0 ? 0 : (sum / count);
        setGlobalAvg(finalAvg);
        setAvgError(null);
      })
      .catch(async () => {
        // Fallback: si el usuario es alumno, intentamos obtener sus propias fichas
        if (effectiveRole === 'alumno' || effectiveRole === 'alumnos') {
          try {
            const allStudents = await fetchStudents();
            const arr = Array.isArray(allStudents) ? allStudents : [];
            const email = (effectiveUser?.email || '').toString().trim().toLowerCase();
            const found = arr.find(s => s.email && String(s.email).trim().toLowerCase() === email);
            if (!found) {
              setAvgError('No se pudo cargar');
              setGlobalAvg(0);
              return;
            }
            const sid = found._id || found.id || found.dni;
            const sheetsForStudent = await fetchSheetsByStudent(sid, effectiveUser).catch(() => []);
            const rows = Array.isArray(sheetsForStudent) ? sheetsForStudent : [];
            let sum = 0;
            let count = 0;
            for (const sh of rows) {
              const nums = [sh.postura, sh.remada, sh.equilibrio, sh.coordinacion, sh.resistencia, sh.velocidad]
                .map(n => Number(n) || 0);
              if (nums.every(v => v === 0)) continue;
              const avg = nums.reduce((a,b)=>a+b,0)/nums.length;
              sum += avg;
              count += 1;
            }
            const finalAvg = count === 0 ? 0 : (sum / count);
            setGlobalAvg(finalAvg);
            setAvgError(null);
            return;
          } catch (er) {
            console.error('Fallback alumno error:', er);
            setAvgError('No se pudo cargar');
            setGlobalAvg(0);
            return;
          }
        }
        setAvgError('No se pudo cargar');
        setGlobalAvg(0);
      });
    return () => { mounted = false };
  }, [user]);

  // Refresh AOS when dashboard data changes so animations run on mount/update
  useEffect(() => {
    try { AOS.refresh(); } catch (err) { console.warn('AOS refresh failed', err); }
  }, [totalBoats, activeBoats, repairBoats, studentsCount, announcements.length, events.length, recentArr.length]);

  // When opening the Remar modal, compute which boats are currently in use and poll periodically
  useEffect(() => {
    if (!isRemarOpen) return;
    let mounted = true;
    const POLL_INTERVAL = 10000; // ms
    const fetchLocks = async () => {
      try {
        const list = await fetchBoatUsages();
        const now = new Date();
        const locks = {};
        (list || []).forEach(item => {
          const bid = String(item.boatId || item.boat || '');
          const et = item.estimatedReturn ? new Date(item.estimatedReturn) : null;
          if (et && et > now) locks[bid] = et.toISOString();
        });
        if (mounted) setActiveBoatLocks(locks);
      } catch (e) {
        console.error('Error fetching boat usages for locks', e);
      }
    };
    // initial
    fetchLocks();
    const timer = setInterval(fetchLocks, POLL_INTERVAL);
    return () => { mounted = false; clearInterval(timer); };
  }, [isRemarOpen]);
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-stretch sm:items-center py-6 px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full max-w-6xl mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl md:text-4xl font-bold">Dashboard</h1>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 sm:gap-4">
          {canManageEvents && (
            <button
              onClick={async () => {
                setIsRemarHistoryOpen(true);
                setRemarHistoryLoading(true);
                setRemarHistoryError(null);
                try {
                  const list = await fetchBoatUsages();
                  setRemarHistory(list || []);
                } catch (err) {
                  console.error('Error cargando historial Remar', err);
                  setRemarHistoryError('No se pudo cargar el historial');
                } finally {
                  setRemarHistoryLoading(false);
                }
              }}
              className="max-w-xs w-full sm:w-auto mx-auto sm:mx-0 px-4 py-3 text-base sm:text-sm bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors flex items-center justify-center text-center"
            >
              Historial Remar
            </button>
          )}
          {canManageEvents && (
            <button
              onClick={() => setIsAddEventOpen(true)}
              className="max-w-xs w-full sm:w-auto mx-auto sm:mx-0 px-4 py-3 text-base sm:text-sm bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition-colors flex items-center justify-center text-center"
            >
              Agregar Evento
            </button>
          )}
          {canManageEvents && (
            <button
              onClick={() => setIsAddAnnouncementOpen(true)}
              className="max-w-xs w-full sm:w-auto mx-auto sm:mx-0 px-4 py-3 text-base sm:text-sm bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition-colors flex items-center justify-center text-center"
            >
              Agregar Anuncio
            </button>
          )}
          {user?.rol === 'admin' && (
            <button
              onClick={() => setIsUsersAdminOpen(true)}
              className="max-w-xs w-full sm:w-auto mx-auto sm:mx-0 px-4 py-3 text-base sm:text-sm bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition-colors flex items-center justify-center text-center"
            >
              Administrar cuentas
            </button>
          )}

        </div>
      </div>
      {/* REMAR History Modal */}
      {isRemarHistoryOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setIsRemarHistoryOpen(false)}>
          <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-4 mx-4" onClick={(e) => e.stopPropagation()} data-aos="zoom-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Historial Remar</h3>
              <div className="flex items-center gap-2">
                <button onClick={async () => {
                  setRemarHistoryLoading(true);
                  setRemarHistoryError(null);
                  try {
                    const list = await fetchBoatUsages();
                    setRemarHistory(list || []);
                  } catch (err) {
                    console.error('Error refrescando historial', err);
                    setRemarHistoryError('No se pudo cargar el historial');
                  } finally { setRemarHistoryLoading(false); }
                }} className="text-sm px-3 py-1 bg-gray-100 rounded">Refrescar</button>
                <button onClick={() => setIsRemarHistoryOpen(false)} className="text-gray-600 hover:text-gray-800">Cerrar</button>
              </div>
            </div>
            {remarHistoryLoading ? (
              <div className="py-6 flex justify-center"><BeatLoader color="#1E40AF" /></div>
            ) : remarHistoryError ? (
              <div className="text-red-600">{remarHistoryError}</div>
            ) : (
              <div className="overflow-auto max-h-96">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-sm text-gray-600 border-b">
                      <th className="p-2">Bote</th>
                      <th className="p-2">Usuario</th>
                      <th className="p-2">Salida</th>
                      <th className="p-2">Regreso estimado</th>
                      <th className="p-2">Duración (h)</th>
                      <th className="p-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remarHistory.length === 0 ? (
                      <tr><td colSpan={6} className="p-4 text-sm text-gray-600">Sin registros</td></tr>
                    ) : remarHistory.map((r) => {
                      const boat = boatsList.find(b => (b._id || b.id) == (r.boatId || r.boat)) || {};
                      return (
                        <tr key={r._id || r.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 align-top">{boat.nombre || boat.name || (r.boatId || r.boat)}</td>
                          <td className="p-2 align-top">{r.userName || r.userEmail || 'Desconocido'}</td>
                          <td className="p-2 align-top">{r.requestedAt ? new Date(r.requestedAt).toLocaleString('es-ES') : ''}</td>
                          <td className="p-2 align-top">{r.estimatedReturn ? new Date(r.estimatedReturn).toLocaleString('es-ES') : ''}</td>
                          <td className="p-2 align-top">{r.durationHours}</td>
                          <td className="p-2 align-top">
                            {role === 'admin' ? (
                              <div className="flex items-center gap-2">
                                <button
                                  title="Eliminar"
                                  disabled={deletingId === (r._id||r.id)}
                                  onClick={async () => {
                                    if (!window.confirm('¿Eliminar esta entrada del historial?')) return;
                                    const id = r._id || r.id;
                                    try {
                                      setDeletingId(id);
                                      const url = `${API_BASE_URL}/api/boat-usages/${id}`;
                                      const headers = { 'Content-Type': 'application/json' };
                                      const isLocal = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');
                                      if (isLocal && user) {
                                        if (user.rol) headers['x-user-role'] = user.rol;
                                        if (user._id) headers['x-user-id'] = user._id;
                                      }
                                      const res = await fetch(url, { method: 'DELETE', headers, body: JSON.stringify({ userRole: user?.rol }) });
                                      if (!res.ok) {
                                        const body = await res.json().catch(() => ({}));
                                        throw new Error(body.error || body.message || `HTTP ${res.status}`);
                                      }
                                      setRemarHistory(prev => prev.filter(it => String(it._id||it.id) !== String(id)));
                                    } catch (err) {
                                      console.error('Delete remar failed', err);
                                      alert('No se pudo eliminar: ' + (err.message || 'error'));
                                    } finally {
                                      setDeletingId(null);
                                    }
                                  }}
                                  className="text-white bg-red-600 hover:bg-red-700 w-6 h-6 flex items-center justify-center rounded-full text-sm"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">Sin permisos</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Estadísticas - movidas para aparecer arriba */}
      <div className="bg-white text-black rounded-2xl p-4 sm:p-6 shadow-lg w-full max-w-xs sm:max-w-6xl mx-auto mb-6 transition-transform duration-300 relative overflow-hidden box-border">
        <h2 className="text-lg font-bold mb-4">Estadísticas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div data-aos="fade-up" data-aos-duration="600" data-aos-delay="100" className="bg-green-600 text-white rounded-2xl p-4 sm:p-6 shadow-lg flex flex-col items-center justify-center text-center w-full max-w-full min-w-0 box-border">
            <LifebuoyIcon className="w-8 h-8 sm:w-10 sm:h-10 mb-2" />
            <h3 className="text-lg font-bold">Total de Botes</h3>
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold">{totalBoats === null ? '...' : totalBoats}</p>
            <p className="text-sm mt-1 opacity-90">Activos: {activeBoats === null ? '...' : activeBoats}</p>
            {boatsError && <span className="text-xs mt-1 opacity-80">{boatsError}</span>}
          </div>
          <div data-aos="fade-up" data-aos-duration="600" data-aos-delay="200" className="bg-yellow-500 text-white rounded-2xl p-4 sm:p-6 shadow-lg flex flex-col items-center justify-center text-center w-full max-w-full min-w-0 box-border">
            <WrenchScrewdriverIcon className="w-8 h-8 sm:w-10 sm:h-10 mb-2" />
            <h3 className="text-lg font-bold">Botes en reparación</h3>
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold">{repairBoats === null ? '...' : repairBoats}</p>
            {boatsError && <span className="text-xs mt-1 opacity-80">{boatsError}</span>}
          </div>
          <div data-aos="fade-up" data-aos-duration="600" data-aos-delay="300" className="bg-blue-600 text-white rounded-2xl p-4 sm:p-6 shadow-lg flex flex-col items-center justify-center text-center w-full max-w-full min-w-0 box-border">
            <UserGroupIcon className="w-8 h-8 sm:w-10 sm:h-10 mb-2" />
            <h3 className="text-lg font-bold">Alumnos activos</h3>
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold">{studentsCount === null ? '...' : studentsCount}</p>
            {studentsError && <span className="text-xs mt-1 opacity-80">{studentsError}</span>}
          </div>
          <div data-aos="fade-up" data-aos-duration="600" data-aos-delay="400" className="bg-purple-600 text-white rounded-2xl p-4 sm:p-6 shadow-lg flex flex-col items-center justify-center text-center w-full max-w-full min-w-0 box-border">
            <ChartBarIcon className="w-8 h-8 sm:w-10 sm:h-10 mb-2" />
            <h3 className="text-lg font-bold">Promedio técnico</h3>
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold">{globalAvg === null ? '...' : (typeof globalAvg === 'number' ? globalAvg.toFixed(1) : globalAvg)}</p>
            {avgError && <span className="text-xs mt-1 opacity-80">{avgError}</span>}
          </div>
        </div>
      </div>
      <div data-aos="fade-up" data-aos-duration="700" data-aos-delay="450" className="bg-white text-black rounded-2xl p-4 sm:p-6 shadow-lg w-full max-w-xs sm:max-w-6xl mx-auto mb-6 hover:bg-gradient-to-b hover:from-blue-900 hover:to-blue-500 hover:text-white transition-transform duration-300 hover:scale-105 relative overflow-hidden box-border">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold uppercase">Anuncios</h2>
          <button onClick={() => setIsAnnouncementsListOpen(true)} aria-label="Ver anuncios" className="text-black bg-gray-300 rounded-full p-2 hover:bg-orange-500 hover:text-white">
            <ArrowUpRightIcon className="w-6 h-6" />
          </button>
        </div>
        {annLoading ? (
          <div className="flex items-center justify-center h-24"><BeatLoader color="#1E40AF" /></div>
        ) : annError ? (
          <div className="text-sm text-red-600">{annError}</div>
        ) : announcements.length === 0 ? (
          <div className="text-sm opacity-70 flex items-center justify-center h-24">No hay anuncios</div>
        ) : (
            <div className="h-auto md:h-24 overflow-hidden">
            <Slider {...announcementSliderSettings}>
                {announcements.map((an) => {
                const fecha = an.date
                  ? new Date(an.date).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                  : 'Sin fecha';
                    return (
                      <div key={an._id || an.id} className="px-1 h-full w-full max-w-full box-border flex justify-center">
                        <div className="h-full border rounded-lg px-3 py-2 text-xs sm:text-sm bg-gray-50 hover:bg-gray-100 transition flex flex-col justify-start w-full max-w-xs lg:max-w-none mx-auto min-w-0">
                      <p className="font-semibold text-gray-800 truncate text-base sm:text-lg">{an.title || 'Anuncio'}</p>
                      <p className="mt-1 text-gray-600">{fecha}</p>
                      <p className="mt-1 italic text-gray-500">{an.description || 'Sin descripción'}</p>
                    </div>
                  </div>
                );
              })}
            </Slider>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl">
          {/* Casillero principal */}
        {/* REMAR (same size as Eventos) */}
        <div
          data-aos="fade-up"
          data-aos-duration="700"
          data-aos-delay="480"
          role="button"
          tabIndex={0}
          onClick={() => setIsRemarOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsRemarOpen(true); } }}
          className="bg-blue-600 text-white rounded-2xl p-4 shadow-lg h-auto md:h-56 transition-transform duration-300 hover:scale-105 transform relative overflow-hidden w-full max-w-xs sm:max-w-full mx-auto sm:mx-0 min-w-0 box-border cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-extrabold">REMAR</h2>
            <button onClick={(e) => { e.stopPropagation(); setIsRemarOpen(true); }} aria-label="Abrir Remar" className="relative z-20 text-white bg-orange-500 rounded-full p-2 hover:bg-orange-600">
              <ArrowUpRightIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div data-aos="fade-up" data-aos-duration="700" data-aos-delay="500" className="bg-white text-black rounded-2xl p-4 shadow-lg h-auto md:h-56 hover:bg-gradient-to-b hover:from-blue-900 hover:to-blue-500 hover:text-white transition-transform duration-300 hover:scale-105 relative overflow-hidden w-full max-w-xs sm:max-w-full mx-auto sm:mx-0 min-w-0 box-border">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold">Eventos</h2>
            <button onClick={() => setIsEventsListOpen(true)} aria-label="Ver eventos" className="relative z-20 text-black bg-gray-300  rounded-full p-2 hover:bg-orange-500 hover:text-white">
              <ArrowUpRightIcon className="w-6 h-6" />
            </button>
          </div>
          {eventsLoading ? (
          <div className="flex items-center justify-center h-24"><BeatLoader color="#1E40AF" /></div>
        ) : eventsError ? (
            <div className="text-sm text-red-600">{eventsError}</div>
          ) : events.length === 0 ? (
            <div className="text-sm opacity-70 flex items-center justify-center h-24">No hay eventos</div>
          ) : (
            <div className="h-auto md:h-36 overflow-hidden">
              <Slider {...eventSliderSettings}>
                {events.map((ev) => {
                  const fecha = ev.date
                    ? new Date(ev.date).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : 'Sin fecha';
                    return (
                      <div key={ev._id || ev.id} className="px-1 h-full w-full max-w-full box-border flex justify-center">
                        <div className="h-full border rounded-lg px-3 py-2 text-xs sm:text-sm bg-gray-50 hover:bg-gray-100 transition flex flex-col justify-start w-full max-w-xs lg:max-w-none mx-auto min-w-0">
                        <p className="font-semibold text-gray-800 truncate">
                          {ev.title || 'Evento'}
                        </p>
                        <p className="mt-1 text-gray-600">{fecha}</p>
                        <p className="mt-1 italic text-gray-500">
                          {ev.description || 'Sin descripción'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </Slider>
            </div>
          )}
        </div>

        {/* Casilleros secundarios */}
        <div className="hidden bg-white text-black rounded-2xl p-4 sm:p-6 shadow-lg flex-col justify-between h-auto md:h-40 hover:bg-gradient-to-b hover:from-blue-900 hover:to-blue-500 hover:text-white transition-transform duration-300 hover:scale-105 w-full max-w-xs sm:max-w-full mx-auto sm:mx-0 min-w-0 box-border">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Ranking</h2>
            <div className="flex gap-2">
              <button onClick={() => setIsEventsListOpen(true)} aria-label="Ver eventos" className="relative z-20 text-black bg-gray-300  rounded-full p-2 hover:bg-orange-500 hover:text-white">
                <ArrowUpRightIcon className="w-6 h-6" />
              </button>
              <button onClick={() => setIsAnnouncementsListOpen(true)} aria-label="Ver anuncios" className="relative z-20 text-black bg-gray-300 rounded-full p-2 hover:bg-orange-500 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 10-14 0v3a1 1 0 001 1h3l3 3v-7a1 1 0 011-1h6a1 1 0 011 1v3"/></svg>
              </button>
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-bold">24</div>
        </div>

        <div data-aos="fade-up" data-aos-duration="650" data-aos-delay="550" className="bg-white text-black rounded-2xl p-4 sm:p-6 shadow-lg flex flex-col justify-between h-auto md:h-40 hover:bg-gradient-to-b hover:from-blue-900 hover:to-blue-500 hover:text-white transition-transform duration-300 hover:scale-105 w-full max-w-xs sm:max-w-full mx-auto sm:mx-0 min-w-0 box-border">
          <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Llegados</h2>
              <button onClick={() => setIsArrivalsListOpen(true)} aria-label="Ver llegados" className="relative z-20 text-black bg-gray-300 rounded-full p-2 hover:bg-orange-500 hover:text-white">
                <ArrowUpRightIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="mt-2">
              {recentLoading ? (
                <div className="flex items-center justify-center h-8"><BeatLoader size={8} color="#1E40AF" /></div>
              ) : recentArr.length === 0 ? (
                <div className="text-sm opacity-70">Sin novedades 🚣‍♂️</div>
              ) : (
                <div className="h-24 overflow-hidden">
                  <Slider {...recentSliderSettings}>
                    {recentArr.map((s) => {
                      const first = s.nombre || s.name || s.firstName || s.nombres || '';
                      const last = s.apellido || s.lastname || s.lastName || s.apellidos || '';
                      const display = (first + ' ' + last).trim() || (s.dni || s._id || 'Sin nombre');
                      return (
                        <div key={s._id || s.id || s.dni} className="px-1 h-full w-full box-border flex items-center">
                          <div className="h-full border rounded-lg px-3 py-3 text-base sm:text-lg bg-gray-50 hover:bg-gray-100 transition flex items-center w-full">
                            <p className="font-semibold text-gray-800 truncate">{String(display).toUpperCase()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </Slider>
                </div>
              )}
            </div>
        </div>

        <ArrivalsListModal isOpen={isArrivalsListOpen} onRequestClose={() => setIsArrivalsListOpen(false)} />
        <AnnouncementsListModal isOpen={isAnnouncementsListOpen} onRequestClose={() => setIsAnnouncementsListOpen(false)} />

        {/* REMAR Modal (select boat + duration) */}
        {isRemarOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setIsRemarOpen(false)}>
            <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg p-6 outline-none transform transition-all duration-300" onClick={(e) => e.stopPropagation()} data-aos="zoom-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Remar</h3>
                <button onClick={() => setIsRemarOpen(false)} className="text-gray-600 hover:text-gray-800">Cerrar</button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <label className="text-sm font-medium">Seleccionar bote</label>
                <select value={selectedBoatId} onChange={(e) => setSelectedBoatId(e.target.value)} className="border rounded px-3 py-2 w-full">
                  <option value="">-- Seleccione un bote --</option>
                  {boatsList.map((b) => {
                    const id = b._id || b.id;
                    const lockIso = activeBoatLocks[String(id)];
                    const locked = lockIso ? (new Date(lockIso) > new Date()) : false;
                    const label = `${b.nombre || b.name || id}${locked ? ` (En uso hasta ${new Date(lockIso).toLocaleString('es-ES')})` : ''}`;
                    return (
                      <option key={id} value={id} disabled={locked}>{label}</option>
                    );
                  })}
                </select>

                <label className="text-sm font-medium">Duración estimada</label>
                <div className="flex gap-2">
                  {[1,2,3,4,6].map((h) => (
                    <button key={h} onClick={() => setDurationHours(h)} type="button" className={`px-3 py-2 rounded ${durationHours===h? 'bg-blue-800 text-white':'bg-gray-100'}`}>
                      {h} {h===1? 'hora' : 'horas'}
                    </button>
                  ))}
                </div>

                <div className="text-sm text-gray-700">
                  <div>Hora solicitada: {new Date().toLocaleString('es-ES')}</div>
                  <div>Hora estimada de regreso: {new Date(Date.now() + (durationHours * 60 * 60 * 1000)).toLocaleString('es-ES')}</div>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setIsRemarOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                <button disabled={submitting} onClick={async () => {
                  if (!selectedBoatId) { showError('Seleccione un bote'); return; }
                  try {
                      setSubmitting(true);
                      await createBoatUsage({ boatId: selectedBoatId, durationHours }, user);
                      showSuccess('Solicitud registrada');
                      // refresh history if open
                      if (isRemarHistoryOpen) {
                        setRemarHistoryLoading(true);
                        try {
                          const list = await fetchBoatUsages();
                          setRemarHistory(list || []);
                        } catch (err) {
                          console.error('Error refrescando historial tras crear uso', err);
                          // don't block success flow
                        } finally { setRemarHistoryLoading(false); }
                      }
                      setIsRemarOpen(false);
                      // reset
                      setSelectedBoatId('');
                      setDurationHours(1);
                  } catch (err) {
                    console.error(err);
                    showError(err.message || 'Error al registrar solicitud');
                  } finally { setSubmitting(false); }
                }} className="px-4 py-2 bg-green-600 text-white rounded">{submitting? 'Enviando...' : 'Guardar'}</button>
              </div>
            </div>
          </div>
        )}

        

        <div data-aos="fade-up" data-aos-duration="650" data-aos-delay="600" className="hidden bg-white text-black rounded-2xl p-4 sm:p-6 shadow-lg flex-col justify-between h-auto md:h-40 hover:bg-gradient-to-b hover:from-blue-900 hover:to-blue-500 hover:text-white transition-transform duration-300 hover:scale-105 w-full max-w-xs sm:max-w-full mx-auto sm:mx-0">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Total Projects</h2>
            <span className="text-black bg-gray-300 rounded-full p-2 hover:bg-orange-500 hover:text-white">
              <ArrowUpRightIcon className="w-6 h-6" />
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-bold">24</div>
        </div>
      </div>
      <EventsListModal isOpen={isEventsListOpen} onRequestClose={() => setIsEventsListOpen(false)} />
      {/* Modal: Agregar Evento */}
      {canManageEvents && (
        <AddEventModal
          isOpen={isAddEventOpen}
          onRequestClose={() => setIsAddEventOpen(false)}
          onEventAdded={(newEv) => {
          // Inserta y reordena por fecha ascendente (solo eventos con fecha válida primero)
            setEvents((prev) => {
              const list = Array.isArray(prev) ? [...prev, newEv] : [newEv];
              const withDate = list.filter((e) => e && e.date);
              const withoutDate = list.filter((e) => !e || !e.date);
              withDate.sort((a, b) => new Date(a.date) - new Date(b.date));
              return [...withDate, ...withoutDate];
            });
          }}
          onEventDeleted={(deletedId) => {
            setEvents((prev) => prev.filter((e) => (e._id || e.id) !== deletedId));
          }}
        />
      )}
      {canManageEvents && (
        <AddAnnouncementModal
          isOpen={isAddAnnouncementOpen}
          onRequestClose={() => setIsAddAnnouncementOpen(false)}
          onAnnouncementAdded={(an) => {
            setAnnouncements((prev) => {
              const list = Array.isArray(prev) ? [...prev, an] : [an];
              const withDate = list.filter((e) => e && e.date);
              const withoutDate = list.filter((e) => !e || !e.date);
              withDate.sort((a, b) => new Date(a.date) - new Date(b.date));
              return [...withDate, ...withoutDate];
            });
          }}
          onAnnouncementDeleted={(deletedId) => {
            setAnnouncements((prev) => prev.filter((e) => (e._id || e.id) !== deletedId));
          }}
        />
      )}
      {/* Modal: Administrar Usuarios */}
      <UsersAdminModal
        isOpen={isUsersAdminOpen}
        onRequestClose={() => setIsUsersAdminOpen(false)}
      />
    </div>
  );
}
