import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import BeatLoader from 'react-spinners/BeatLoader';
import { fetchBoatReports, deleteBoatReport, updateBoatReport } from '../../models/BoatReport';
import { showError, showSuccess } from '../../utils/toast';
import Avatar from 'react-avatar';


export default function ManageReportsModal({ isOpen, onRequestClose, boats = [], user, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [fullImage, setFullImage] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchBoatReports().catch(() => []);
      // Keep only 'abierto' reports
      const open = Array.isArray(data) ? data.filter(r => r.status === 'abierto') : [];
      setReports(open);
    } catch {
      console.error('Error cargando reportes:');
      showError('Error cargando reportes');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen]);

  const getBoatName = (boatRef) => {
    if (!boatRef) return 'Bote';
    if (typeof boatRef === 'object') return boatRef.nombre || boatRef.name || 'Bote';
    const found = boats.find(b => (b._id === boatRef || b.id === boatRef));
    return found ? (found.nombre || found.name || 'Bote') : 'Bote';
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar este reporte?')) return;
    try {
      await deleteBoatReport(id, user);
      showSuccess('Reporte eliminado');
      await load();
      if (typeof onUpdated === 'function') onUpdated();
    } catch {
      console.error('Error eliminando reporte:');
      showError('No se pudo eliminar');
    }
  };

  const handleChangeStatus = async (id, status) => {
    try {
      await updateBoatReport(id, { status }, user);
      showSuccess('Estado actualizado');
      await load();
      if (typeof onUpdated === 'function') onUpdated();
    } catch {
      console.error('Error actualizando estado de reporte:');
      showError('No se pudo actualizar estado');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onRequestClose}>
      <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6 outline-none transform transition-all duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Administrar reportes abiertos</h3>
          <button onClick={onRequestClose} className="text-gray-600 hover:text-gray-800"><XMarkIcon className="w-6 h-6"/></button>
        </div>
        <div data-aos="zoom-in" data-aos-duration="300">
      {loading ? (
        <div className="flex justify-center py-6"><BeatLoader size={8} /></div>
      ) : reports.length === 0 ? (
        <div className="text-sm text-gray-500">No hay reportes abiertos</div>
      ) : (
        <ul className="space-y-3 max-h-80 overflow-auto">
          {reports.map(r => {
            const id = r._id || r.id;
            const boatName = getBoatName(r.boatId);
            return (
              <li key={id} className="flex items-center gap-3 p-2 border rounded">
                <div className="w-14 h-14 flex-shrink-0">
                  {r.fotoURL ? (
                    <img src={r.fotoURL} alt="foto" className="w-14 h-14 object-cover rounded cursor-pointer" onClick={() => setFullImage(r.fotoURL)} />
                  ) : (
                    <Avatar name={boatName} size="48" round={true} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{boatName}</div>
                  <div className="text-sm text-gray-600">{r.descripcion}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <select value={r.status} onChange={(e) => handleChangeStatus(id, e.target.value)} className="border rounded px-2 py-1 text-sm">
                    <option value="abierto">abierto</option>
                    <option value="en_reparacion">en_reparacion</option>
                    <option value="cerrado">cerrado</option>
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => handleDelete(id)} className="text-red-600 hover:text-red-800">Eliminar</button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
        </div>

        {/* Full image overlay */}
        {fullImage && (
          <div className="fixed inset-0 bg-black/90 z-60 flex items-center justify-center" onClick={() => setFullImage(null)}>
            <img src={fullImage} alt="full" className="max-h-[75vh] max-w-[75vw] rounded" />
          </div>
        )}
      </div>
    </div>
  );
}
