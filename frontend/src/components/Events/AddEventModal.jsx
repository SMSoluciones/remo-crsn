import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import { showError, showSuccess } from '../../utils/toast';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { API_BASE_URL } from '../../utils/apiConfig';

Modal.setAppElement('#root');

const AddEventModal = ({ isOpen, onRequestClose, onEventAdded }) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

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

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? '' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black opacity-40 backdrop-blur-sm" onClick={onRequestClose}></div>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 z-10" data-aos="fade-up">
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
      </div>
    </div>
  );
};

export default AddEventModal;

