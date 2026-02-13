import { useState, useEffect } from 'react';
import { BoatTypes, BoatStatus } from '../../models/Boat';
import { API_BASE_URL } from '../../utils/apiConfig';
import axios from 'axios';
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function AddBoatsModal({ onClose, onBoatAdded }) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState(BoatTypes[0]);
  const [estado, setEstado] = useState(BoatStatus.ACTIVO);
  const [nivelDif, setNivelDif] = useState(1);
  const [row, setRow] = useState(1);

  useEffect(() => {
    AOS.init();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newBoat = {
        nombre,
        tipo,
        estado,
        nivelDif,
        fechaIngreso: new Date().toISOString(),
        row,
      };
      const response = await axios.post(`${API_BASE_URL}/api/boats`, newBoat);
      onBoatAdded(response.data);
      onClose();
    } catch (error) {
      console.error('Error al agregar el bote:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="absolute inset-0" onClick={onClose} />
      <div data-aos="zoom-in" data-aos-duration="300" className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md transform transition-all duration-300">
        <h2 className="text-xl font-bold mb-4">Agregar Nuevo Bote</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              required
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
            >
              {BoatTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              required
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
            >
              {Object.values(BoatStatus).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nivel de Dificultad</label>
            <input
              type="number"
              value={nivelDif}
              onChange={(e) => setNivelDif(Number(e.target.value))}
              min="1"
              max="5"
              required
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Número de Remo</label>
            <input
              type="number"
              value={row}
              onChange={(e) => setRow(Number(e.target.value))}
              min="1"
              required
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}