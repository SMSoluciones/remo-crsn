import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import { showError, showSuccess } from '../../utils/toast';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { API_BASE_URL } from '../../utils/apiConfig';
import { fetchEvents as fetchEventsApi, deleteEvent as deleteEventApi } from '../../models/Event';
import { XMarkIcon } from '@heroicons/react/24/outline';

Modal.setAppElement('#root');

const AddEventModal = ({ isOpen, onRequestClose, onEventAdded, onEventDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [events, setEvents] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    AOS.init({ duration: 300, easing: 'ease-out' });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !date || !description) {
      showError('Complete los campos requeridos: título, fecha y descripción');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/events`, { title, date, description });
      showSuccess('Evento creado correctamente');
      setTitle('');
      setDate('');
      setDescription('');
      onEventAdded(response.data);
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
        .filter((e) => e && e.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      const noDate = arr.filter((e) => !e || !e.date);
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

  const handleDelete = async (id) => {
    if (!id) return;
    const ok = window.confirm('¿Eliminar este evento? Esta acción no se puede deshacer.');
    if (!ok) return;
    try {
      setDeletingId(id);
      await deleteEventApi(id);
      setEvents((prev) => prev.filter((e) => (e._id || e.id) !== id));
      if (typeof onEventDeleted === 'function') onEventDeleted(id);
      showSuccess('Evento eliminado');
    } catch (err) {
      console.error('Error eliminando evento:', err);
      showError('No se pudo eliminar el evento');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? '' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black opacity-40 backdrop-blur-sm" onClick={onRequestClose}></div>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 z-10" data-aos="fade-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Agregar Nuevo Evento</h3>
          <button onClick={onRequestClose} className="text-gray-500 hover:text-gray-700">Cerrar</button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <input
            type="text"
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border rounded px-3 py-2"
            required
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded px-3 py-2"
            required
          />
          <textarea
            placeholder="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border rounded px-3 py-2"
            required
          ></textarea>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onRequestClose}
              className="px-4 py-2 border rounded hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Evento'}
            </button>
          </div>
        </form>

        {/* Lista de eventos con opción de eliminar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-base font-semibold">Eventos existentes</h4>
            {listLoading && <span className="text-sm text-gray-500">Cargando...</span>}
          </div>
          {listError ? (
            <div className="text-sm text-red-600">{listError}</div>
          ) : events.length === 0 ? (
            <div className="text-sm text-gray-500">No hay eventos</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
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
                                title="Eliminar"
                                onClick={() => handleDelete(id)}
                                disabled={deletingId === id}
                                className={`p-2 rounded hover:bg-red-100 ${deletingId === id ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <XMarkIcon className="w-5 h-5 text-red-600" />
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
  );
};

export default AddEventModal;

