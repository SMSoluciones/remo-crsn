import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { fetchEvents, deleteEvent as deleteEventApi } from '../../models/Event';
import { XMarkIcon } from '@heroicons/react/24/outline';
import BeatLoader from 'react-spinners/BeatLoader';
import { useAuth } from '../../context/useAuth';
import { showError, showSuccess } from '../../utils/toast';

Modal.setAppElement('#root');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onRequestClose}></div>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 z-10 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Eventos</h3>
          <button onClick={onRequestClose} className="text-gray-500 hover:text-gray-700"><XMarkIcon className="w-6 h-6"/></button>
        </div>
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
                <div key={id} className={`border rounded-lg p-4 flex justify-between items-start ${isPast ? 'bg-red-50' : ''}`}>
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
  );
}
