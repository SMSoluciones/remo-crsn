import { useState, useEffect } from 'react';
import { createBoatUsage, fetchBoatUsages } from '../../models/BoatUsage';
import { BoatStatus } from '../../models/Boat';
import { showError, showSuccess } from '../../utils/toast';

export default function Remar({ isOpen, onRequestClose, boatsList = [], activeBoatLocks = {}, initialSelectedBoatId, user, isRemarHistoryOpen, setRemarHistoryLoading, setRemarHistory }) {
  const [selectedBoatId, setSelectedBoatId] = useState('');
  const [zone, setZone] = useState('');
  const [durationHours, setDurationHours] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const DURATION_OPTIONS = [
    { value: 0.5, label: '30 min' },
    { value: 1, label: '1 hora' },
    { value: 2, label: '2 horas' },
  ];

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
    <div className="fixed inset-0 z-50 modal-overlay p-2 sm:p-4 flex items-start sm:items-center justify-center overflow-y-auto" onClick={() => onRequestClose && onRequestClose(false)}>
      <div className="modal-panel w-full max-w-lg mx-auto bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col outline-none transform transition-all duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 tracking-wide">Remar</h3>
          <button onClick={() => onRequestClose && onRequestClose(false)} className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100">Cerrar</button>
        </div>
        <div className="p-3 sm:p-4 overflow-y-auto">
        <div className="grid grid-cols-1 gap-3 bg-white border border-slate-200 rounded-xl shadow-sm p-3 sm:p-4">
          <label className="text-sm font-medium">Seleccionar bote</label>
          <select value={selectedBoatId} onChange={(e) => setSelectedBoatId(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500">
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
            {DURATION_OPTIONS.map((opt) => (
              <button key={String(opt.value)} onClick={() => setDurationHours(opt.value)} type="button" className={`px-3 py-2 rounded ${durationHours===opt.value? 'bg-blue-800 text-white':'bg-gray-100'}`}>
                {opt.label}
              </button>
            ))}
          </div>

          <label className="text-sm font-medium">Zona</label>
          <input maxLength={20} value={zone} onChange={(e)=>setZone(e.target.value)} placeholder="Zona de Remo" className="border border-slate-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" />

          <div className="text-sm text-gray-700">
            <div>Hora solicitada: {new Date().toLocaleString('es-ES')}</div>
            <div>Hora estimada de regreso: {new Date(Date.now() + (durationHours * 60 * 60 * 1000)).toLocaleString('es-ES')}</div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => onRequestClose && onRequestClose(false)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100">Cancelar</button>
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
          }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">{submitting? 'Enviando...' : 'Guardar'}</button>
        </div>
        </div>
      </div>
    </div>
  );
}
