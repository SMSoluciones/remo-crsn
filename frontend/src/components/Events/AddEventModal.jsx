import React, { useState, useEffect } from 'react';
import { showError, showSuccess } from '../../utils/toast';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { fetchEvents as fetchEventsApi, finalizeEvent as finalizeEventApi, createEvent as createEventApi } from '../../models/Event';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/useAuth';
import BeatLoader from 'react-spinners/BeatLoader';

const AddEventModal = ({ isOpen, onRequestClose, onEventAdded, onEventDeleted }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [events, setEvents] = useState([]);
  const [finalizingId, setFinalizingId] = useState(null);

  useEffect(() => {
    AOS.init({ duration: 300, easing: 'ease-out', once: true });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !date || !description) {
      showError('Complete los campos requeridos: título, fecha y descripción');
      return;
    }
    setLoading(true);
    try {
      const data = await createEventApi({ title, date, description }, user);
      showSuccess('Evento creado correctamente');
      setTitle('');
      setDate('');
      setDescription('');
      onEventAdded(data);
      onRequestClose();
    } catch (error) {
      console.error('Error al crear el evento:', error);
      showError('No se pudo crear el evento');
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    setListLoading(true);
    setListError(null);
    try {
      const data = await fetchEventsApi();
      const arr = Array.isArray(data) ? data : [];
      const sorted = arr
        .filter((e) => !e?.isFinalizado)
        .filter((e) => e && e.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      const noDate = arr.filter((e) => (!e || !e.date) && !e?.isFinalizado);
      setEvents([...sorted, ...noDate]);
    } catch (err) {
      console.error('Error listando eventos:', err);
      setListError('No se pudo cargar la lista de eventos');
      setEvents([]);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadEvents();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onRequestClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onRequestClose]);

  const handleFinalize = async (id) => {
    if (!id) return;
    const ok = window.confirm('¿Finalizar este evento? Dejara de figurar en la lista de eventos activos.');
    if (!ok) return;
    try {
      setFinalizingId(id);
      await finalizeEventApi(id, user);
      setEvents((prev) => prev.filter((e) => (e._id || e.id) !== id));
      if (typeof onEventDeleted === 'function') onEventDeleted(id);
      showSuccess('Evento finalizado');
    } catch (err) {
      console.error('Error finalizando evento:', err);
      showError('No se pudo finalizar el evento');
    } finally {
      setFinalizingId(null);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 modal-overlay p-2 sm:p-4 flex items-start sm:items-center justify-center overflow-y-auto" onClick={onRequestClose}>
      <div className="modal-panel w-full max-w-3xl mx-auto bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col z-10" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 tracking-wide">Agregar nuevo evento</h3>
          <button onClick={onRequestClose} className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100">Cerrar</button>
        </div>
        <div className="p-3 sm:p-4 overflow-y-auto">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 p-3 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <input
            type="text"
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500"
            required
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500"
            required
          />
          <textarea
            placeholder="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500"
            required
          ></textarea>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onRequestClose}
              className="px-4 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Evento'}
            </button>
          </div>
        </form>

        {/* Lista de eventos activos con opción de finalizar */}
        <div className="mt-6 bg-white border border-slate-200 rounded-xl shadow-sm p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-base font-semibold">Eventos existentes</h4>
            {listLoading && <div className="flex items-center"><BeatLoader size={6} color="#1E40AF" /></div>}
          </div>
          {listError ? (
            <div className="text-sm text-red-600">{listError}</div>
          ) : events.length === 0 ? (
            <div className="text-sm text-gray-500">No hay eventos</div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="max-h-72 overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="text-left px-4 py-2">Título</th>
                      <th className="text-left px-4 py-2">Fecha</th>
                      <th className="text-left px-4 py-2">Descripción</th>
                      <th className="text-right px-4 py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => {
                      const id = ev._id || ev.id;
                      const fecha = ev.date
                        ? new Date(ev.date).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        : 'Sin fecha';
                      const isPast = ev.date ? new Date(ev.date) < new Date() : false;
                      return (
                        <tr key={id} className={isPast ? 'bg-red-50' : ''}>
                          <td className="px-4 py-2 align-top">
                            <span className="font-medium">{ev.title || 'Evento'}</span>
                          </td>
                          <td className="px-4 py-2 align-top whitespace-nowrap">{fecha}</td>
                          <td className="px-4 py-2 align-top text-gray-600">{ev.description || 'Sin descripción'}</td>
                          <td className="px-4 py-2 align-top">
                            <div className="flex justify-end">
                              <button
                                title="Finalizar"
                                onClick={() => handleFinalize(id)}
                                disabled={finalizingId === id}
                                className={`px-2.5 py-1.5 text-xs font-medium rounded bg-amber-100 text-amber-800 hover:bg-amber-200 ${finalizingId === id ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {finalizingId === id ? 'Finalizando...' : 'Finalizar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default AddEventModal;

