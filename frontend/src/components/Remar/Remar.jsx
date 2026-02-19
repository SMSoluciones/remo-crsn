import { useState, useEffect } from 'react';
import { createBoatUsage, fetchBoatUsages } from '../../models/BoatUsage';
import { BoatStatus } from '../../models/Boat';
import { showError, showSuccess } from '../../utils/toast';

export default function Remar({ isOpen, onRequestClose, boatsList = [], activeBoatLocks = {}, initialSelectedBoatId, user, isRemarHistoryOpen, setRemarHistoryLoading, setRemarHistory }) {
  const [selectedBoatId, setSelectedBoatId] = useState('');
  const [zone, setZone] = useState('');
  const [durationHours, setDurationHours] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedBoatId('');
      setZone('');
      setDurationHours(1);
      return;
    }
    if (initialSelectedBoatId) {
      setSelectedBoatId(initialSelectedBoatId);
    }
  }, [isOpen, initialSelectedBoatId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => onRequestClose && onRequestClose(false)}>
      <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg p-6 outline-none transform transition-all duration-300" onClick={(e) => e.stopPropagation()} data-aos="zoom-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Remar</h3>
          <button onClick={() => onRequestClose && onRequestClose(false)} className="text-gray-600 hover:text-gray-800">Cerrar</button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <label className="text-sm font-medium">Seleccionar bote</label>
          <select value={selectedBoatId} onChange={(e) => setSelectedBoatId(e.target.value)} className="border rounded px-3 py-2 w-full">
            <option value="">-- Seleccione un bote --</option>
            {boatsList.map((b) => {
              const id = b._id || b.id;
              const lockIso = activeBoatLocks[String(id)];
              const locked = lockIso ? (new Date(lockIso) > new Date()) : false;
              const unavailable = b.estado === BoatStatus.MANTENIMIENTO || b.estado === BoatStatus.FUERA_SERVICIO;
              const statusNote = unavailable ? (b.estado === BoatStatus.MANTENIMIENTO ? 'Mantenimiento' : 'Fuera de servicio') : '';
              const label = `${b.nombre || b.name || id}${locked ? ` (En uso hasta ${new Date(lockIso).toLocaleString('es-ES')})` : ''}${statusNote ? ` (No disponible: ${statusNote})` : ''}`;
              return (
                <option key={id} value={id} disabled={locked || unavailable}>{label}</option>
              );
            })}
          </select>

          <label className="text-sm font-medium">Duración estimada</label>
          <div className="flex gap-2">
            {[1,2,3,4].map((h) => (
              <button key={h} onClick={() => setDurationHours(h)} type="button" className={`px-3 py-2 rounded ${durationHours===h? 'bg-blue-800 text-white':'bg-gray-100'}`}>
                {h} {h===1? 'hora' : 'horas'}
              </button>
            ))}
          </div>

          <label className="text-sm font-medium">Zona</label>
          <input maxLength={20} value={zone} onChange={(e)=>setZone(e.target.value)} placeholder="Zona de Remo" className="border rounded px-3 py-2 w-full" />

          <div className="text-sm text-gray-700">
            <div>Hora solicitada: {new Date().toLocaleString('es-ES')}</div>
            <div>Hora estimada de regreso: {new Date(Date.now() + (durationHours * 60 * 60 * 1000)).toLocaleString('es-ES')}</div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => onRequestClose && onRequestClose(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
          <button disabled={submitting} onClick={async () => {
            if (!selectedBoatId) { showError('Seleccione un bote'); return; }
            try {
              setSubmitting(true);
              await createBoatUsage({ boatId: selectedBoatId, durationHours, note: undefined, zone: zone ? String(zone).slice(0,20) : undefined }, user);
              showSuccess('Solicitud registrada');
              if (isRemarHistoryOpen && typeof setRemarHistoryLoading === 'function') {
                setRemarHistoryLoading(true);
                try {
                  const list = await fetchBoatUsages();
                  if (typeof setRemarHistory === 'function') setRemarHistory(list || []);
                } catch (err) {
                  console.error('Error refrescando historial tras crear uso', err);
                } finally { setRemarHistoryLoading(false); }
              }
              onRequestClose && onRequestClose(false);
              setSelectedBoatId('');
              setDurationHours(1);
            } catch (err) {
              console.error(err);
              showError(err.message || 'Error al registrar solicitud');
            } finally { setSubmitting(false); }
          }} className="px-4 py-2 bg-green-600 text-white rounded">{submitting? 'Enviando...' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  );
}
