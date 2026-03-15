import React, { useEffect, useState } from 'react';
import { fireThemedSwal } from '../../utils/swalTheme';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { fetchSeats, createSeat, updateSeat, deleteSeat, SeatStatus } from '../../models/Seat';
import { showError, showSuccess } from '../../utils/toast';
import LoadingSpinner from '../common/LoadingSpinner';

export default function ManageSeatsModal({ isOpen, onRequestClose, user, onUpdated }) {
  const requiresCause = (estado) => estado === SeatStatus.MANTENIMIENTO || estado === SeatStatus.FUERA_SERVICIO;
  const [loading, setLoading] = useState(false);
  const [seats, setSeats] = useState([]);
  const [newSeat, setNewSeat] = useState({
    nombre: '',
    estado: SeatStatus.ACTIVO,
    causa: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchSeats();
      setSeats(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando asientos:', err);
      showError('No se pudieron cargar los asientos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isOpen) load(); }, [isOpen]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (requiresCause(newSeat.estado) && !String(newSeat.causa || '').trim()) {
      showError('Debes ingresar la causa cuando el carro queda en mantenimiento o fuera de servicio');
      return;
    }
    try {
      const created = await createSeat({
        nombre: newSeat.nombre,
        estado: newSeat.estado,
        causa: String(newSeat.causa || '').trim() || undefined,
        fechaIngreso: new Date().toISOString(),
      }, user);
      setSeats(prev => [created, ...prev]);
      setNewSeat({ nombre: '', estado: SeatStatus.ACTIVO, causa: '' });
      showSuccess('Asiento agregado');
      if (typeof onUpdated === 'function') onUpdated();
    } catch (err) {
      console.error('Error creando asiento:', err);
      showError('No se pudo agregar el asiento');
    }
  };

  const handleUpdate = async (id, changes) => {
    const current = seats.find((s) => s._id === id);
    const nextEstado = changes.estado ?? current?.estado;
    const nextCausa = String(changes.causa ?? current?.causa ?? '').trim();
    if (requiresCause(nextEstado) && !nextCausa) {
      showError('Debes ingresar la causa cuando el carro queda en mantenimiento o fuera de servicio');
      return;
    }
    try {
      const updated = await updateSeat(id, changes, user);
      setSeats(prev => prev.map(s => (s._id === id ? updated : s)));
      showSuccess('Asiento actualizado');
      if (typeof onUpdated === 'function') onUpdated();
    } catch (err) {
      console.error('Error actualizando asiento:', err);
      showError('No se pudo actualizar el asiento');
    }
  };

  const handleEstadoChange = async (seat, nextEstado) => {
    if (!seat?._id) return;
    const prevEstado = seat.estado;
    if (nextEstado === prevEstado) return;

    if (!requiresCause(nextEstado)) {
      await handleUpdate(seat._id, { estado: nextEstado });
      return;
    }

    const currentCause = String(seat.causa || '').trim();
    if (currentCause) {
      await handleUpdate(seat._id, { estado: nextEstado });
      return;
    }

    const result = await fireThemedSwal({
      title: 'Causa obligatoria',
      text: 'Para dejar el carro en mantenimiento o fuera de servicio debes indicar la causa.',
      input: 'text',
      inputLabel: 'Causa',
      inputPlaceholder: 'Ej: rueda trabada o rotura',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      inputValidator: (value) => {
        if (!String(value || '').trim()) return 'La causa es obligatoria';
        return null;
      },
    });

    if (!result.isConfirmed) return;
    await handleUpdate(seat._id, { estado: nextEstado, causa: String(result.value || '').trim() });
  };

  const handleDelete = async (id) => {
    const result = await fireThemedSwal({
      title: 'Eliminar asiento?',
      text: 'Esta accion no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await deleteSeat(id, user);
      setSeats(prev => prev.filter(s => s._id !== id));
      showSuccess('Asiento eliminado');
      if (typeof onUpdated === 'function') onUpdated();
    } catch (err) {
      console.error('Error eliminando asiento:', err);
      showError('No se pudo eliminar el asiento');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 modal-overlay p-2 sm:p-4 flex items-start sm:items-center justify-center overflow-y-auto" onClick={onRequestClose}>
      <div className="modal-panel w-full max-w-2xl mx-auto bg-slate-50 rounded-2xl shadow-2xl outline-none max-h-[94vh] flex flex-col border border-slate-200" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 tracking-wide">Administrar asientos</h3>
          <button type="button" onClick={onRequestClose} className="p-1.5 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100" aria-label="Cerrar modal">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-3 sm:p-4 overflow-y-auto">
          <form onSubmit={handleCreate} className="mb-3 p-3 sm:p-4 bg-white border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 items-end shadow-sm">
            <div className="sm:col-span-2 md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Nombre</label>
              <input className="w-full border border-slate-300 px-2 py-1.5 rounded-lg" value={newSeat.nombre} onChange={(e) => setNewSeat(prev => ({ ...prev, nombre: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Estado</label>
              <select className="w-full border border-slate-300 px-2 py-1.5 rounded-lg" value={newSeat.estado} onChange={(e) => setNewSeat(prev => ({ ...prev, estado: e.target.value }))}>
                {Object.values(SeatStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {requiresCause(newSeat.estado) && (
              <div className="sm:col-span-2 md:col-span-4">
                <label className="block text-xs font-medium text-slate-600 mb-1">Causa (obligatoria)</label>
                <input
                  className="w-full border border-slate-300 px-2 py-1.5 rounded-lg"
                  value={newSeat.causa}
                  onChange={(e) => setNewSeat(prev => ({ ...prev, causa: e.target.value }))}
                  placeholder="Ej: rueda trabada, rotura, etc."
                  required
                />
              </div>
            )}
            <div className="sm:col-span-2 md:col-span-4 flex justify-end">
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm font-medium">Agregar asiento</button>
            </div>
          </form>

          {loading ? (
            <LoadingSpinner message="" className="py-6" />
          ) : (
            <div className="space-y-3 max-h-[58vh] sm:max-h-[60vh] overflow-y-auto">
              {seats.map((s) => (
                <div key={s._id} className="p-3 sm:p-4 border border-slate-200 bg-white rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3 items-start md:items-center shadow-sm">
                  <div className="md:col-span-2 space-y-2 min-w-0">
                    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_150px] gap-2 sm:gap-3">
                      <input className="border border-slate-300 px-2 py-1.5 rounded-lg" defaultValue={s.nombre} onBlur={(e) => handleUpdate(s._id, { nombre: e.target.value })} />
                      <select className="border border-slate-300 px-2 py-1.5 rounded-lg" value={s.estado} onChange={(e) => handleEstadoChange(s, e.target.value)}>
                        {Object.values(SeatStatus).map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>
                    {requiresCause(s.estado) && (
                      <div className="grid grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
                        <label className="text-sm text-slate-600 font-medium">Causa</label>
                        <input
                          className="border border-slate-300 px-2 py-1.5 rounded-lg"
                          defaultValue={s.causa || ''}
                          placeholder="Obligatoria"
                          onBlur={(e) => handleUpdate(s._id, { causa: e.target.value.trim() })}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex md:flex-col items-end justify-end gap-2">
                    <button type="button" onClick={() => handleDelete(s._id)} className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 font-medium">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
