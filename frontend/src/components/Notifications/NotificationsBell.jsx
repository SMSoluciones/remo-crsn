import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { fetchBoats } from '../../models/Boat';
import { fetchAnnouncements } from '../../models/Announcement';
import { fetchEvents } from '../../models/Event';
import { fetchSheetsByStudent } from '../../models/TechnicalSheet';
import { fetchStudents } from '../../models/Student';

const MAX_NOTIFICATIONS = 120;
const POLL_MS = 30000;

function normalizeId(value) {
  return String(value || '').trim();
}

function normalizeText(value) {
  return String(value || '').trim();
}

function statusLabel(status) {
  const raw = normalizeText(status).toLowerCase();
  if (raw === 'activo') return 'Activo';
  if (raw === 'mantenimiento') return 'Mantenimiento';
  if (raw === 'fuera_servicio') return 'Fuera de servicio';
  return raw || 'Sin estado';
}

function buildStorageKey(user) {
  const uid = normalizeId(user?._id || user?.id);
  const email = normalizeText(user?.email).toLowerCase();
  const dni = normalizeText(user?.documento || user?.dni);
  return `notifications_state_${uid || email || dni || 'anon'}`;
}

function findStudentIdForUser(students, user) {
  const arr = Array.isArray(students) ? students : [];
  const userEmail = normalizeText(user?.email).toLowerCase();
  const userDoc = normalizeText(user?.documento || user?.dni);
  const userName = `${normalizeText(user?.nombre).toLowerCase()} ${normalizeText(user?.apellido).toLowerCase()}`.trim();

  const byDoc = arr.find((s) => {
    const sDoc = normalizeText(s?.documento || s?.dni);
    return !!userDoc && !!sDoc && sDoc === userDoc;
  });
  if (byDoc) return normalizeId(byDoc._id || byDoc.id);

  const byEmail = arr.find((s) => normalizeText(s?.email).toLowerCase() === userEmail);
  if (byEmail) return normalizeId(byEmail._id || byEmail.id);

  const byName = arr.find((s) => `${normalizeText(s?.nombre).toLowerCase()} ${normalizeText(s?.apellido).toLowerCase()}`.trim() === userName);
  if (byName) return normalizeId(byName._id || byName.id);

  return '';
}

function aggregateNotifications(items) {
  const list = Array.isArray(items) ? items : [];
  if (list.length <= 1) return list;

  const groups = new Map();
  list.forEach((item) => {
    const key = normalizeText(item?.type) || 'other';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });

  const aggregated = [];
  groups.forEach((group, type) => {
    if (group.length === 1) {
      aggregated.push(group[0]);
      return;
    }

    let message = `${group.length} notificaciones nuevas.`;
    if (type === 'boat') message = `Hubo ${group.length} cambios en botes.`;
    if (type === 'announcement') message = `Se agregaron ${group.length} anuncios nuevos.`;
    if (type === 'event') message = `Se agregaron ${group.length} eventos nuevos.`;
    if (type === 'sheet') message = `Se te agregaron ${group.length} fichas tecnicas nuevas.`;

    aggregated.push({
      id: `${type}-group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      message,
      createdAt: new Date().toISOString(),
      read: false,
    });
  });

  return aggregated;
}

export default function NotificationsBell({ user, theme = 'light' }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const storageRef = useRef({
    boatsSnapshot: {},
    knownAnnouncementIds: [],
    knownEventIds: [],
    knownSheetIds: [],
    initializedAnnouncements: false,
    initializedEvents: false,
    initializedSheets: false,
    notifications: [],
  });
  const studentIdRef = useRef('');
  const storageKey = useMemo(() => buildStorageKey(user), [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const persistState = useCallback((next) => {
    storageRef.current = next;
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch (err) {
      console.warn('No se pudo persistir estado de notificaciones', err);
    }
  }, [storageKey]);

  const appendNotifications = useCallback((newItems) => {
    const compact = aggregateNotifications(newItems);
    if (!Array.isArray(compact) || compact.length === 0) return;
    setNotifications((prev) => {
      const merged = [...compact, ...prev].slice(0, MAX_NOTIFICATIONS);
      const nextState = { ...storageRef.current, notifications: merged };
      persistState(nextState);
      return merged;
    });
  }, [persistState]);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const normalized = {
        boatsSnapshot: raw.boatsSnapshot || {},
        knownAnnouncementIds: Array.isArray(raw.knownAnnouncementIds) ? raw.knownAnnouncementIds : [],
        knownEventIds: Array.isArray(raw.knownEventIds) ? raw.knownEventIds : [],
        knownSheetIds: Array.isArray(raw.knownSheetIds) ? raw.knownSheetIds : [],
        initializedAnnouncements: !!raw.initializedAnnouncements,
        initializedEvents: !!raw.initializedEvents,
        initializedSheets: !!raw.initializedSheets,
        notifications: Array.isArray(raw.notifications) ? raw.notifications : [],
      };
      storageRef.current = normalized;
      setNotifications(normalized.notifications);
    } catch (err) {
      console.warn('No se pudo cargar estado de notificaciones', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [storageKey]);

  useEffect(() => {
    let mounted = true;
    const resolveStudent = async () => {
      try {
        const students = await fetchStudents();
        if (!mounted) return;
        studentIdRef.current = findStudentIdForUser(students, user);
      } catch {
        if (!mounted) return;
        studentIdRef.current = '';
      }
    };
    resolveStudent();
    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user || loading) return;
    let mounted = true;

    const poll = async () => {
      try {
        const [boats, announcements, events] = await Promise.all([
          fetchBoats().catch(() => []),
          fetchAnnouncements().catch(() => []),
          fetchEvents().catch(() => []),
        ]);

        const pending = [];
        const nextState = { ...storageRef.current };

        // Boat changes notifications
        const previousBoats = nextState.boatsSnapshot || {};
        const currentBoats = {};
        (Array.isArray(boats) ? boats : []).forEach((boat) => {
          const id = normalizeId(boat._id || boat.id);
          if (!id) return;
          const current = {
            nombre: normalizeText(boat.nombre || boat.name),
            row: String(boat.row ?? ''),
            estado: normalizeText(boat.estado).toLowerCase(),
          };
          currentBoats[id] = current;
          const before = previousBoats[id];
          if (!before) return;

          if (before.nombre !== current.nombre) {
            pending.push({
              id: `boat-name-${id}-${Date.now()}`,
              type: 'boat',
              message: `El bote "${before.nombre || 'sin nombre'}" cambió su nombre a "${current.nombre || 'sin nombre'}".`,
              createdAt: new Date().toISOString(),
              read: false,
            });
          }

          if (String(before.row) !== String(current.row)) {
            pending.push({
              id: `boat-row-${id}-${Date.now()}`,
              type: 'boat',
              message: `El bote "${current.nombre || 'sin nombre'}" cambió cantidad de remos a ${current.row || '—'}.`,
              createdAt: new Date().toISOString(),
              read: false,
            });
          }

          if (normalizeText(before.estado).toLowerCase() !== current.estado) {
            pending.push({
              id: `boat-status-${id}-${Date.now()}`,
              type: 'boat',
              message: `El bote "${current.nombre || 'sin nombre'}" pasó de ${statusLabel(before.estado)} a ${statusLabel(current.estado)}.`,
              createdAt: new Date().toISOString(),
              read: false,
            });
          }
        });
        nextState.boatsSnapshot = currentBoats;

        // New announcements
        const announcementIds = (Array.isArray(announcements) ? announcements : [])
          .map((a) => normalizeId(a._id || a.id))
          .filter(Boolean);
        if (!nextState.initializedAnnouncements) {
          nextState.knownAnnouncementIds = announcementIds;
          nextState.initializedAnnouncements = true;
        } else {
          const known = new Set(nextState.knownAnnouncementIds || []);
          (Array.isArray(announcements) ? announcements : []).forEach((a) => {
            const id = normalizeId(a._id || a.id);
            if (!id || known.has(id)) return;
            pending.push({
              id: `announcement-${id}`,
              type: 'announcement',
              message: `Nuevo anuncio: ${normalizeText(a.title) || 'Sin título'}.`,
              createdAt: new Date().toISOString(),
              read: false,
            });
            known.add(id);
          });
          nextState.knownAnnouncementIds = Array.from(known);
        }

        // New events
        const eventIds = (Array.isArray(events) ? events : [])
          .map((e) => normalizeId(e._id || e.id))
          .filter(Boolean);
        if (!nextState.initializedEvents) {
          nextState.knownEventIds = eventIds;
          nextState.initializedEvents = true;
        } else {
          const known = new Set(nextState.knownEventIds || []);
          (Array.isArray(events) ? events : []).forEach((e) => {
            const id = normalizeId(e._id || e.id);
            if (!id || known.has(id)) return;
            pending.push({
              id: `event-${id}`,
              type: 'event',
              message: `Nuevo evento: ${normalizeText(e.title) || 'Sin título'}.`,
              createdAt: new Date().toISOString(),
              read: false,
            });
            known.add(id);
          });
          nextState.knownEventIds = Array.from(known);
        }

        // New technical sheet for current logged user (receiver)
        const studentId = normalizeId(studentIdRef.current);
        if (studentId) {
          const sheets = await fetchSheetsByStudent(studentId, user).catch(() => []);
          const sheetIds = (Array.isArray(sheets) ? sheets : [])
            .map((s) => normalizeId(s._id || s.id))
            .filter(Boolean);

          if (!nextState.initializedSheets) {
            nextState.knownSheetIds = sheetIds;
            nextState.initializedSheets = true;
          } else {
            const knownSheets = new Set(nextState.knownSheetIds || []);
            sheetIds.forEach((id) => {
              if (knownSheets.has(id)) return;
              pending.push({
                id: `sheet-${id}`,
                type: 'sheet',
                message: 'Se te ha agregado una nueva ficha tecnica.',
                createdAt: new Date().toISOString(),
                read: false,
              });
              knownSheets.add(id);
            });
            nextState.knownSheetIds = Array.from(knownSheets);
          }
        }

        if (!mounted) return;
        nextState.notifications = storageRef.current.notifications || [];
        persistState(nextState);
        appendNotifications(pending);
      } catch (err) {
        console.warn('Error actualizando notificaciones', err);
      }
    };

    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [user, loading, appendNotifications, persistState]);

  useEffect(() => {
    function handleOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    function handleEsc(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      persistState({ ...storageRef.current, notifications: next });
      return next;
    });
  };

  const clearAllNotifications = () => {
    setNotifications(() => {
      const next = [];
      persistState({ ...storageRef.current, notifications: next });
      return next;
    });
  };

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      if (!prev && unreadCount > 0) markAllAsRead();
      return next;
    });
  };

  return (
    <div ref={containerRef} className="relative">
      <button className="relative" onClick={toggleOpen} aria-label="Notificaciones" title="Notificaciones">
        <BellIcon className={`h-6 w-6 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-500'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-[16px] h-4 px-1 rounded-full items-center justify-center text-[10px] font-bold bg-red-500 text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className={`md:hidden fixed inset-0 z-50 notifications-mobile-panel ${theme === 'dark' ? 'bg-slate-950' : 'bg-white'} flex flex-col`}>
            <div className={`px-4 py-3 border-b flex items-center justify-between gap-2 ${theme === 'dark' ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
              <p className={`text-base font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>Notificaciones</p>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllNotifications}
                    className={`text-xs px-2.5 py-1 rounded border ${theme === 'dark' ? 'text-slate-300 border-slate-600 hover:bg-slate-700' : 'text-slate-600 border-slate-300 hover:bg-slate-100'}`}
                  >
                    Limpiar todas
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded border ${theme === 'dark' ? 'text-slate-300 border-slate-600 hover:bg-slate-700' : 'text-slate-600 border-slate-300 hover:bg-slate-100'}`}
                >
                  <XMarkIcon className="w-4 h-4" /> Cerrar
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className={`px-4 py-4 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>No hay notificaciones nuevas.</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{n.message}</p>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                      {new Date(n.createdAt).toLocaleString('es-ES')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={`hidden md:block dropdown-slide-down absolute right-0 top-10 w-80 max-w-[85vw] border rounded-xl shadow-xl z-40 overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`px-4 py-3 border-b flex items-center justify-between gap-2 ${theme === 'dark' ? 'border-slate-700 bg-slate-800/80' : 'border-slate-100 bg-slate-50/70'}`}>
              <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>Notificaciones</p>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllNotifications}
                  className={`text-xs px-2.5 py-1 rounded border ${theme === 'dark' ? 'text-slate-300 border-slate-600 hover:bg-slate-700' : 'text-slate-600 border-slate-300 hover:bg-slate-100'}`}
                >
                  Limpiar todas
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className={`px-4 py-4 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>No hay notificaciones nuevas.</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{n.message}</p>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                      {new Date(n.createdAt).toLocaleString('es-ES')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
