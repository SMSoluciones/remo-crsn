import ProtectedRoute from './ProtectedRoute';
import { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { fetchStudents } from '../models/Student';
import { fetchBoats } from '../models/Boat';
import { fetchBoatUsages } from '../models/BoatUsage';
import { stopBoatUsage } from '../models/BoatUsage';
import { API_BASE_URL } from '../utils/apiConfig';
import { useAuth } from '../context/useAuth';
import { fetchEvents } from '../models/Event';
import { fetchAnnouncements } from '../models/Announcement';
import { showSuccess, showError } from '../utils/toast';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import BeatLoader from 'react-spinners/BeatLoader';
import AddEventModal from './Events/AddEventModal';
import AddAnnouncementModal from './Announcements/AddAnnouncementModal.jsx';
import AnnouncementsListModal from './Announcements/AnnouncementsListModal';
import UsersAdminModal from './Login/UsersAdminModal.jsx';
import LoggedUsersModal from './Login/LoggedUsersModal.jsx';
import EventsListModal from './Events/EventsListModal';
import ArrivalsListModal from './Students/ArrivalsListModal';
import Remar from './Remar/Remar';
import RemarHistoryModal from './Remar/RemarHistoryModal';
import {
  LifebuoyIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
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
  const [enabledBoatsCount, setEnabledBoatsCount] = useState(0);
  const [loggedUserStatus, setLoggedUserStatus] = useState('—');
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
  const [isLoggedUsersOpen, setIsLoggedUsersOpen] = useState(false);
  const [isRemarHistoryOpen, setIsRemarHistoryOpen] = useState(false);
  const role = String(user?.rol || '').trim().toLowerCase();
  const canManageEvents = ['admin','entrenador','mantenimiento','subcomision'].includes(role);
  const [isEventsListOpen, setIsEventsListOpen] = useState(false);
  const [isArrivalsListOpen, setIsArrivalsListOpen] = useState(false);
  const [isAnnouncementsListOpen, setIsAnnouncementsListOpen] = useState(false);
  const [isRemarOpen, setIsRemarOpen] = useState(false);
  const [activeBoatLocks, setActiveBoatLocks] = useState({});
  const [userActiveUsage, setUserActiveUsage] = useState(null);
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [conflictUsage, setConflictUsage] = useState(null);
  const isUserInactive = loggedUserStatus === 'INACTIVO';
  const isRemarDisabled = !!userActiveUsage || isUserInactive;

  const handleOpenRemarAttempt = () => {
    if (isUserInactive) {
      showError('Tu estado es INACTIVO. No puedes iniciar REMAR.');
      return;
    }
    if (userActiveUsage) {
      setConflictUsage(userActiveUsage);
      setIsConflictModalOpen(true);
      return;
    }
    setIsRemarOpen(true);
  };
  
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

  useEffect(() => {
    let mounted = true;
    const isAlumno = role === 'alumno' || role === 'alumnos';
    if (!isAlumno) {
      setEnabledBoatsCount(0);
      setLoggedUserStatus('—');
      return () => { mounted = false; };
    }

    setEnabledBoatsCount(null);
    setLoggedUserStatus('...');
    fetchStudents()
      .then((list) => {
        if (!mounted) return;
        const students = Array.isArray(list) ? list : [];
        const normalize = (value) => String(value || '').trim().toLowerCase();
        const userEmail = normalize(user?.email);
        const userDoc = String(user?.documento || user?.dni || '').trim();
        const userNombre = normalize(user?.nombre);
        const userApellido = normalize(user?.apellido);
        const lsEmail = normalize(localStorage.getItem('open_student_email'));
        const lsDoc = String(localStorage.getItem('open_student_documento') || '').trim();

        const byDocumento = students.find((student) => {
          const studentDoc = String(student?.documento || student?.dni || '').trim();
          return !!userDoc && !!studentDoc && studentDoc === userDoc;
        });

        const byEmail = students.find((student) => {
          const studentEmail = normalize(student?.email);
          return !!userEmail && !!studentEmail && studentEmail === userEmail;
        });

        const byLocalStorage = students.find((student) => {
          const studentEmail = normalize(student?.email);
          const studentDoc = String(student?.documento || student?.dni || '').trim();
          if (lsDoc && studentDoc && studentDoc === lsDoc) return true;
          if (lsEmail && studentEmail && studentEmail === lsEmail) return true;
          return false;
        });

        const byName = students.find((student) => {
          const studentNombre = normalize(student?.nombre);
          const studentApellido = normalize(student?.apellido);
          return !!userNombre && !!userApellido && studentNombre === userNombre && studentApellido === userApellido;
        });

        const found = byDocumento || byEmail || byLocalStorage || byName || null;

        const enabled = Array.isArray(found?.botesHabilitados) ? found.botesHabilitados.length : 0;
        const status = String(found?.estado || '—').trim().toUpperCase();
        setEnabledBoatsCount(enabled);
        setLoggedUserStatus(status || '—');
      })
      .catch(() => {
        if (!mounted) return;
        setEnabledBoatsCount(0);
        setLoggedUserStatus('—');
      });

    return () => { mounted = false; };
  }, [role, user]);

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

  // Refresh AOS when dashboard data changes so animations run on mount/update
  useEffect(() => {
    try { AOS.refresh(); } catch (err) { console.warn('AOS refresh failed', err); }
    // Force immediate AOS animations for elements marked with data-aos-immediate
    try {
      const nodes = Array.from(document.querySelectorAll('[data-aos-immediate]'));
      nodes.forEach((el) => {
        el.classList.add('aos-init');
        el.classList.add('aos-animate');
      });
    } catch { /* ignore */ }
  }, [totalBoats, activeBoats, repairBoats, studentsCount, announcements.length, events.length, recentArr.length, userActiveUsage, isRemarOpen]);

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
          const actual = item.actualReturn ? new Date(item.actualReturn) : null;
          if (!actual && et && et > now) locks[bid] = et.toISOString();
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

  // Poll for current user's active usage (so we can show the floating Stop button)
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const POLL = 10000;
    const load = async () => {
      try {
        const list = await fetchBoatUsages();
        if (!mounted) return;
        const uid = String(user._id || user.id || '').trim();
        const email = (user.email || '').trim().toLowerCase();
        const now = new Date();
        const me = (list || []).find(u => {
          if (u.actualReturn) return false;
          // hide if estimated return already passed
          try {
            const est = u.estimatedReturn ? new Date(u.estimatedReturn) : null;
            if (!est || est <= now) return false;
          } catch (e) { return console.warn(e); }
          try {
            if (u.userId && uid && String(u.userId) === uid) return true;
            if (u.userEmail && email && String(u.userEmail).toLowerCase() === email) return true;
            if (u.userName && user) {
              const first = user.nombre || user.name || user.fullName || '';
              if (String(u.userName).trim() === String(first).trim()) return true;
            }
          } catch (e) { return console.warn(e); }
          return false;
        }) || null;
        setUserActiveUsage(me);
      } catch (e) {
        console.error('Error polling user active usage', e);
      }
    };
    load();
    const ti = setInterval(load, POLL);
    return () => { mounted = false; clearInterval(ti); };
  }, [user]);
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-stretch sm:items-center py-6 px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full max-w-6xl mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl md:text-4xl font-bold">Dashboard</h1>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 sm:gap-4">
          {canManageEvents && (
              <button
              onClick={() => { setIsRemarHistoryOpen(true); }}
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
          {user?.rol === 'admin' && (
            <button
              onClick={() => setIsLoggedUsersOpen(true)}
              className="max-w-xs w-full sm:w-auto mx-auto sm:mx-0 px-4 py-3 text-base sm:text-sm bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition-colors flex items-center justify-center text-center"
            >
              Historial de logins
            </button>
          )}

        </div>
      </div>
      {/* Responsive inline buttons for small screens: under action buttons and above Estadísticas */}
      <div className="md:hidden w-full max-w-6xl mx-auto px-2 mt-4 mb-4 flex gap-4 items-center justify-center">
        {userActiveUsage && (
          <button
            data-aos="zoom-in"
            data-aos-duration="400"
            data-aos-delay="80"
            data-aos-immediate="true"
            onClick={() => userActiveUsage && setIsStopModalOpen(true)}
            aria-label="Detener remada"
            className={`transform transition-all duration-300 scale-100 opacity-100 bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-16 shadow flex items-center justify-center`}
          >
            <div className="bg-white w-6 h-6 rounded-md shadow-inner" aria-hidden="true" />
          </button>
        )}
        {/* Mobile Play button (visible only on small screens) */}
        <button
          data-aos="zoom-in"
          data-aos-duration="400"
          data-aos-delay="140"
          data-aos-immediate="true"
          onClick={() => handleOpenRemarAttempt()}
          disabled={isRemarDisabled}
          aria-disabled={isRemarDisabled}
          className={`${isRemarDisabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'} rounded-full w-16 h-16 shadow flex items-center justify-center`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white" aria-hidden="true">
            <path fillRule="evenodd" clipRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" />
          </svg>
        </button>
      </div>
      {/* Floating Stop button + Modal */}
      {userActiveUsage && (
        <>
          <button
            data-aos="zoom-in"
            data-aos-duration="450"
            data-aos-delay="60"
            data-aos-immediate="true"
            onClick={() => userActiveUsage && setIsStopModalOpen(true)}
            aria-label="Detener remada"
            className={`hidden md:flex fixed bottom-32 right-6 z-50 rounded-full w-20 h-20 shadow-lg items-center justify-center transform transition-all duration-300 ${userActiveUsage ? 'scale-100 opacity-100 bg-red-600 hover:bg-red-700 text-white' : 'scale-0 opacity-0 pointer-events-none bg-red-600 text-white'}`}
          >
            <div className="bg-white w-8 h-8 rounded-md shadow-inner" aria-hidden="true" />
          </button>

          {isStopModalOpen && (
            <div className="fixed inset-0 z-60 modal-overlay p-2 sm:p-4 flex items-start sm:items-center justify-center overflow-y-auto" onClick={() => setIsStopModalOpen(false)}>
              <div className="modal-panel w-full max-w-md bg-white rounded-xl p-6 mx-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-2">Detener la remada actual</h3>
                <p className="text-sm text-gray-700 mb-4">¿Detener la remada actual? Se registrará la hora de detención: <strong>{new Date().toLocaleString('es-ES')}</strong></p>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsStopModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                  <button disabled={stopping} onClick={async () => {
                    try {
                      setStopping(true);
                      const updated = await stopBoatUsage(userActiveUsage._id || userActiveUsage.id, user);
                      setUserActiveUsage(updated);
                      // remove lock for boat
                      const bid = String(updated.boatId || updated.boat || '');
                      setActiveBoatLocks(prev => {
                        const copy = { ...(prev || {}) };
                        delete copy[bid];
                        return copy;
                      });
                      showSuccess('Remada detenida');
                      setIsStopModalOpen(false);
                    } catch (err) {
                      console.error('Stop failed', err);
                      showError(err.message || 'No se pudo detener la remada');
                    } finally { setStopping(false); }
                  }} className="px-4 py-2 bg-red-600 text-white rounded">{stopping ? 'Deteniendo...' : 'Detener'}</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Conflict modal: preventing starting a new Remar when one is active */}
      {isConflictModalOpen && conflictUsage && (
        <div className="fixed inset-0 z-70 modal-overlay p-2 sm:p-4 flex items-start sm:items-center justify-center overflow-y-auto" onClick={() => setIsConflictModalOpen(false)}>
          <div className="modal-panel w-full max-w-md bg-white rounded-xl p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">No se pueden iniciar dos sesiones de Remo a la vez</h3>
            <p className="text-sm text-gray-700 mb-4">¿Terminar sesión iniciada con el: "{conflictUsage.boatDisplay || (conflictUsage.boatId && (conflictUsage.boatId.nombre || conflictUsage.boatId.name)) || conflictUsage.boat || 'este bote'}"?</p>
            <div className="flex justify-end gap-2">
              <button onClick={async () => {
                try {
                  setStopping(true);
                  const updated = await stopBoatUsage(conflictUsage._id || conflictUsage.id, user);
                  // remove lock
                  const bid = String(updated.boatId || updated.boat || '');
                  setActiveBoatLocks(prev => {
                    const copy = { ...(prev || {}) };
                    delete copy[bid];
                    return copy;
                  });
                  setUserActiveUsage(null);
                  setIsConflictModalOpen(false);
                  setIsRemarOpen(true);
                  showSuccess('Remada detenida');
                } catch (err) {
                  console.error('Stop failed', err);
                  showError(err.message || 'No se pudo detener la remada');
                } finally { setStopping(false); }
              }} className="px-4 py-2 bg-red-600 text-white rounded mr-auto">{stopping ? 'Deteniendo...' : 'Terminar sesión'}</button>
              <button onClick={() => setIsConflictModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {/* Shortcut button to open Remar modal (orange, play icon) */}
      <button
        data-aos="zoom-in"
        data-aos-duration="450"
        data-aos-delay="120"
        data-aos-immediate="true"
        onClick={() => handleOpenRemarAttempt()}
        aria-label="Abrir Remar"
        disabled={isRemarDisabled}
        aria-disabled={isRemarDisabled}
        className={`${isRemarDisabled ? 'hidden md:flex fixed bottom-6 right-6 z-50 bg-gray-300 text-gray-500 cursor-not-allowed' : 'hidden md:flex fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white'} rounded-full w-20 h-20 shadow-lg items-center justify-center`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white" aria-hidden="true">
          <path fillRule="evenodd" clipRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" />
        </svg>
      </button>
      {/* duplicate button removed to avoid duplicate rendering */}
      {/* REMAR History Modal (migrado a componente) */}
      <RemarHistoryModal isOpen={isRemarHistoryOpen} onClose={() => setIsRemarHistoryOpen(false)} user={user} boatsList={boatsList} />

      <div className="w-full max-w-xs sm:max-w-6xl mx-auto mb-2 flex justify-center sm:justify-end">
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs shadow ${loggedUserStatus === 'ACTIVO' ? 'bg-green-600 text-white' : loggedUserStatus === 'INACTIVO' ? 'bg-red-600 text-white' : 'bg-gray-500 text-white'}`}>
          {loggedUserStatus === 'ACTIVO' ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75" />
            </svg>
          ) : loggedUserStatus === 'INACTIVO' ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5" />
            </svg>
          ) : null}
          Estado: {loggedUserStatus}
        </span>
      </div>
      
      {/* Estadísticas - movidas para aparecer arriba */}
      <div className="bg-white text-black rounded-2xl p-4 sm:p-6 shadow-lg w-full max-w-xs sm:max-w-6xl mx-auto mb-6 transition-transform duration-300 relative overflow-hidden box-border">
        <h2 className="text-lg font-bold mb-4">Estadísticas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div data-aos="fade-up" data-aos-duration="600" data-aos-delay="100" className="bg-purple-600 text-white rounded-2xl p-4 sm:p-6 shadow-lg flex flex-col items-center justify-center text-center w-full max-w-full min-w-0 box-border">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 sm:w-10 sm:h-10 mb-2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
            </svg>
            <h3 className="text-lg font-bold">Botes habilitados</h3>
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold">{enabledBoatsCount === null ? '...' : enabledBoatsCount}</p>
          </div>
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
        </div>
      </div>
      <div data-aos="fade-up" data-aos-duration="700" data-aos-delay="450" className="bg-white text-slate-900 rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-200/80 w-full max-w-xs sm:max-w-6xl mx-auto mb-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl relative overflow-hidden box-border">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-extrabold uppercase tracking-tight">Anuncios</h2>
          <button onClick={() => setIsAnnouncementsListOpen(true)} aria-label="Ver anuncios" className="text-slate-700 bg-slate-100 rounded-full p-2 border border-slate-200 hover:bg-slate-900 hover:text-white transition-colors">
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
                        <div className="h-full border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm bg-gradient-to-b from-slate-50 to-white transition flex flex-col justify-start w-full max-w-xs lg:max-w-none mx-auto min-w-0">
                      <p className="font-bold text-slate-800 truncate text-base sm:text-lg">{an.title || 'Anuncio'}</p>
                      <p className="mt-1 text-slate-500 font-medium">{fecha}</p>
                      <p className="mt-1 italic text-slate-600">{an.description || 'Sin descripción'}</p>
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
          data-aos="zoom-in"
          data-aos-duration="700"
          data-aos-delay="480"
          data-aos-immediate="true"
          role="button"
          tabIndex={isRemarDisabled ? -1 : 0}
          onClick={() => { if (!isRemarDisabled) handleOpenRemarAttempt(); }}
          onKeyDown={(e) => { if (!isRemarDisabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleOpenRemarAttempt(); } }}
          aria-disabled={isRemarDisabled}
          className={`${isRemarDisabled ? 'bg-slate-300 text-slate-600 cursor-not-allowed' : 'bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 text-white'} rounded-3xl p-5 shadow-xl border border-white/20 h-auto md:h-56 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl transform relative overflow-hidden w-full max-w-xs sm:max-w-full mx-auto sm:mx-0 min-w-0 box-border`}
        >
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-3xl font-extrabold tracking-tight">REMAR</h2>
            <button
              onClick={(e) => { e.stopPropagation(); if (!isRemarDisabled) handleOpenRemarAttempt(); }}
              aria-label="Abrir Remar"
              disabled={isRemarDisabled}
              aria-disabled={isRemarDisabled}
              className={`${isRemarDisabled ? 'relative z-20 bg-slate-400 text-slate-600 rounded-full p-2 cursor-not-allowed' : 'relative z-20 text-white bg-orange-500 rounded-full p-2 hover:bg-orange-600 transition-colors'}`}
            >
              <ArrowUpRightIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div data-aos="fade-up" data-aos-duration="700" data-aos-delay="500" className="bg-white text-slate-900 rounded-3xl p-4 shadow-xl border border-slate-200/80 h-auto md:h-56 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl relative overflow-hidden w-full max-w-xs sm:max-w-full mx-auto sm:mx-0 min-w-0 box-border">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-extrabold tracking-tight">Eventos</h2>
            <button onClick={() => setIsEventsListOpen(true)} aria-label="Ver eventos" className="relative z-20 text-slate-700 bg-slate-100 rounded-full p-2 border border-slate-200 hover:bg-slate-900 hover:text-white transition-colors">
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
                        <div className="h-full border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm bg-gradient-to-b from-slate-50 to-white transition flex flex-col justify-start w-full max-w-xs lg:max-w-none mx-auto min-w-0">
                        <p className="font-bold text-slate-800 truncate text-base">
                          {ev.title || 'Evento'}
                        </p>
                        <p className="mt-1 text-slate-500 font-medium">{fecha}</p>
                        <p className="mt-1 italic text-slate-600">
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

        <div data-aos="fade-up" data-aos-duration="650" data-aos-delay="550" className="bg-white text-slate-900 rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-200/80 flex flex-col justify-between h-auto md:h-40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl w-full max-w-xs sm:max-w-full mx-auto sm:mx-0 min-w-0 box-border">
          <div className="flex justify-between items-center">
              <h2 className="text-2xl font-extrabold tracking-tight">Llegados</h2>
              <button onClick={() => setIsArrivalsListOpen(true)} aria-label="Ver llegados" className="relative z-20 text-slate-700 bg-slate-100 rounded-full p-2 border border-slate-200 hover:bg-slate-900 hover:text-white transition-colors">
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
                          <div className="h-full border border-slate-200 rounded-2xl px-4 py-3 text-base sm:text-lg bg-gradient-to-b from-slate-50 to-white transition flex items-center w-full">
                            <p className="font-bold text-slate-800 truncate tracking-tight">{String(display).toUpperCase()}</p>
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

        {/* REMAR Modal (migrado a componente Remar) */}
        <Remar
          isOpen={isRemarOpen}
          onRequestClose={() => setIsRemarOpen(false)}
          boatsList={boatsList}
          activeBoatLocks={activeBoatLocks}
          user={user}
          isRemarHistoryOpen={isRemarHistoryOpen}
        />

        

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
      <LoggedUsersModal
        isOpen={isLoggedUsersOpen}
        onRequestClose={() => setIsLoggedUsersOpen(false)}
      />
    </div>
  );
}
