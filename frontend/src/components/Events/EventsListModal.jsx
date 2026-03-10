import React, { useEffect, useState } from 'react';
import { fetchEvents, deleteEvent as deleteEventApi } from '../../models/Event';
import { XMarkIcon } from '@heroicons/react/24/outline';
import BeatLoader from 'react-spinners/BeatLoader';
import { useAuth } from '../../context/useAuth';
import { showError, showSuccess } from '../../utils/toast';

export default function EventsListModal({ isOpen, onRequestClose }) {
  const { user } = useAuth();
  const role = String(user?.rol || '').trim().toLowerCase();
  // Editable only for admin and entrenador and subcomision
  const editable = ['admin', 'entrenador', 'subcomision'].includes(role);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (!isOpen) return;
    setLoading(true);
    fetchEvents()
      .then(list => {
        if (!mounted) return;
        const arr = Array.isArray(list) ? list : [];
        const sorted = arr.filter(e => e && e.date).sort((a,b) => new Date(a.date) - new Date(b.date));
        const noDate = arr.filter(e => !e || !e.date);
        setEvents([...sorted, ...noDate]);
      })
      .catch(err => {
        console.error('Error listando eventos:', err);
        showError('No se pudieron cargar los eventos');
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onRequestClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onRequestClose]);

  const handleDelete = async (id) => {
    if (!editable) return;
    if (!window.confirm('¿Eliminar este evento? Esta acción no se puede deshacer.')) return;
    try {
      setDeletingId(id);
      await deleteEventApi(id, user);
      setEvents(prev => prev.filter(e => (e._id || e.id) !== id));
      showSuccess('Evento eliminado');
    } catch (err) {
      console.error('Error eliminando evento:', err);
      showError('No se pudo eliminar el evento');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 modal-overlay p-2 sm:p-4 flex items-start sm:items-center justify-center overflow-y-auto" onClick={onRequestClose}>
      <div className="modal-panel w-full max-w-2xl mx-auto bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 tracking-wide">Eventos</h3>
          <button onClick={onRequestClose} className="p-1.5 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100" aria-label="Cerrar modal"><XMarkIcon className="w-6 h-6"/></button>
        </div>
        <div className="p-3 sm:p-4 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8"><BeatLoader color="#1E40AF" /></div>
        ) : events.length === 0 ? (
          <div className="text-sm text-gray-600">No hay eventos</div>
        ) : (
          <div className="space-y-3">
            {events.map(ev => {
              const id = ev._id || ev.id;
              const fecha = ev.date ? new Date(ev.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Sin fecha';
              const isPast = ev.date ? new Date(ev.date) < new Date() : false;
              return (
                <div key={id} className={`border border-slate-200 rounded-xl p-4 flex justify-between items-start bg-white shadow-sm ${isPast ? 'bg-red-50' : ''}`}>
                  <div>
                    <div className="font-medium text-gray-800">{ev.title || 'Evento'}</div>
                    <div className="text-sm text-gray-600">{fecha}</div>
                    <div className="mt-2 text-gray-700">{ev.description || 'Sin descripción'}</div>
                  </div>
                  {editable ? (
                    <div className="ml-4 flex items-start">
                      <button onClick={() => handleDelete(id)} disabled={deletingId === id} className={`p-2 rounded ${deletingId === id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-100'}`}>
                        <XMarkIcon className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
