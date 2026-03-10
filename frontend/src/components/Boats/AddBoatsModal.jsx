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

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

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
    <div className="fixed inset-0 z-50 modal-overlay p-2 sm:p-4 flex items-start sm:items-center justify-center overflow-y-auto" onClick={onClose}>
      <div className="modal-panel w-full max-w-md mx-auto bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col transform transition-all duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold text-slate-800 tracking-wide">Agregar nuevo bote</h2>
          <button type="button" onClick={onClose} className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100">Cerrar</button>
        </div>
        <div className="p-3 sm:p-4 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4 p-3 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500"
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
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500"
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
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500"
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
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-100 text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Guardar
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}