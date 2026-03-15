import React, { useEffect, useState } from 'react';
import { fireThemedSwal } from '../../utils/swalTheme';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  fetchOars,
  createOar,
  updateOar,
  deleteOar,
  OarTypes,
  OarStatus,
  OarHachaSizes,
} from '../../models/Oar';
import { showError, showSuccess } from '../../utils/toast';
import LoadingSpinner from '../common/LoadingSpinner';

export default function ManageOarsModal({ isOpen, onRequestClose, user, onUpdated }) {
  const requiresCause = (estado) => estado === OarStatus.MANTENIMIENTO || estado === OarStatus.FUERA_SERVICIO;
  const [loading, setLoading] = useState(false);
  const [oars, setOars] = useState([]);
  const [newOar, setNewOar] = useState({
    nombre: '',
    tipo: OarTypes[0],
    largoHacha: OarHachaSizes[0],
    estado: OarStatus.ACTIVO,
    causa: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchOars();
      setOars(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando remos:', err);
      showError('No se pudieron cargar los remos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isOpen) load(); }, [isOpen]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (requiresCause(newOar.estado) && !String(newOar.causa || '').trim()) {
      showError('Debes ingresar la causa cuando el remo queda en mantenimiento o fuera de servicio');
      return;
    }
    try {
      const payload = {
        nombre: newOar.nombre,
        tipo: newOar.tipo,
        estado: newOar.estado,
        largoHacha: newOar.tipo === 'hacha' ? newOar.largoHacha : undefined,
        causa: String(newOar.causa || '').trim() || undefined,
        fechaIngreso: new Date().toISOString(),
      };
      const created = await createOar(payload, user);
      setOars(prev => [created, ...prev]);
      setNewOar({ nombre: '', tipo: OarTypes[0], largoHacha: OarHachaSizes[0], estado: OarStatus.ACTIVO, causa: '' });
      showSuccess('Par de remo agregado');
      if (typeof onUpdated === 'function') onUpdated();
    } catch (err) {
      console.error('Error creando remo:', err);
      showError('No se pudo agregar el par de remo');
    }
  };

  const handleUpdate = async (id, changes) => {
    const current = oars.find((o) => o._id === id);
    const nextEstado = changes.estado ?? current?.estado;
    const nextCausa = String(changes.causa ?? current?.causa ?? '').trim();
    if (requiresCause(nextEstado) && !nextCausa) {
      showError('Debes ingresar la causa cuando el remo queda en mantenimiento o fuera de servicio');
      return;
    }
    try {
      const updated = await updateOar(id, changes, user);
      setOars(prev => prev.map(o => (o._id === id ? updated : o)));
      showSuccess('Remo actualizado');
      if (typeof onUpdated === 'function') onUpdated();
    } catch (err) {
      console.error('Error actualizando remo:', err);
      showError('No se pudo actualizar el remo');
    }
  };

  const handleEstadoChange = async (oar, nextEstado) => {
    if (!oar?._id) return;
    const prevEstado = oar.estado;
    if (nextEstado === prevEstado) return;

    if (!requiresCause(nextEstado)) {
      await handleUpdate(oar._id, { estado: nextEstado });
      return;
    }

    const currentCause = String(oar.causa || '').trim();
    if (currentCause) {
      await handleUpdate(oar._id, { estado: nextEstado });
      return;
    }

    const result = await fireThemedSwal({
      title: 'Causa obligatoria',
      text: 'Para dejar el remo en mantenimiento o fuera de servicio debes indicar la causa.',
      input: 'text',
      inputLabel: 'Causa',
      inputPlaceholder: 'Ej: pala dañada o rajadura',
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
    await handleUpdate(oar._id, { estado: nextEstado, causa: String(result.value || '').trim() });
  };

  const handleDelete = async (id) => {
    const result = await fireThemedSwal({
      title: 'Eliminar par de remo?',
      text: 'Esta accion no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await deleteOar(id, user);
      setOars(prev => prev.filter(o => o._id !== id));
      showSuccess('Par de remo eliminado');
      if (typeof onUpdated === 'function') onUpdated();
    } catch (err) {
      console.error('Error eliminando remo:', err);
      showError('No se pudo eliminar el remo');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 modal-overlay p-2 sm:p-4 flex items-start sm:items-center justify-center overflow-y-auto" onClick={onRequestClose}>
      <div className="modal-panel w-full max-w-2xl mx-auto bg-slate-50 rounded-2xl shadow-2xl outline-none max-h-[94vh] flex flex-col border border-slate-200" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 tracking-wide">Administrar remos</h3>
          <button type="button" onClick={onRequestClose} className="p-1.5 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100" aria-label="Cerrar modal">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-3 sm:p-4 overflow-y-auto">
          <form onSubmit={handleCreate} className="mb-3 p-3 sm:p-4 bg-white border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 items-end shadow-sm">
            <div className="sm:col-span-2 md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Nombre</label>
              <input className="w-full border border-slate-300 px-2 py-1.5 rounded-lg" value={newOar.nombre} onChange={(e) => setNewOar(prev => ({ ...prev, nombre: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
              <select className="w-full border border-slate-300 px-2 py-1.5 rounded-lg" value={newOar.tipo} onChange={(e) => setNewOar(prev => ({ ...prev, tipo: e.target.value }))}>
                {OarTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {newOar.tipo === 'hacha' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Largo</label>
                <select className="w-full border border-slate-300 px-2 py-1.5 rounded-lg" value={newOar.largoHacha} onChange={(e) => setNewOar(prev => ({ ...prev, largoHacha: e.target.value }))}>
                  {OarHachaSizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Estado</label>
              <select className="w-full border border-slate-300 px-2 py-1.5 rounded-lg" value={newOar.estado} onChange={(e) => setNewOar(prev => ({ ...prev, estado: e.target.value }))}>
                {Object.values(OarStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {requiresCause(newOar.estado) && (
              <div className="sm:col-span-2 md:col-span-5">
                <label className="block text-xs font-medium text-slate-600 mb-1">Causa (obligatoria)</label>
                <input
                  className="w-full border border-slate-300 px-2 py-1.5 rounded-lg"
                  value={newOar.causa}
                  onChange={(e) => setNewOar(prev => ({ ...prev, causa: e.target.value }))}
                  placeholder="Ej: pala dañada, rajadura, etc."
                  required
                />
              </div>
            )}
            <div className="sm:col-span-2 md:col-span-5 flex justify-end">
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm font-medium">Agregar par de remo</button>
            </div>
          </form>

          {loading ? (
            <LoadingSpinner message="" className="py-6" />
          ) : (
            <div className="space-y-3 max-h-[58vh] sm:max-h-[60vh] overflow-y-auto">
              {oars.map((o) => (
                <div key={o._id} className="p-3 sm:p-4 border border-slate-200 bg-white rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3 items-start md:items-center shadow-sm">
                  <div className="md:col-span-2 space-y-2 min-w-0">
                    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_120px_120px] gap-2 sm:gap-3">
                      <input className="border border-slate-300 px-2 py-1.5 rounded-lg" defaultValue={o.nombre} onBlur={(e) => handleUpdate(o._id, { nombre: e.target.value })} />
                      <select className="border border-slate-300 px-2 py-1.5 rounded-lg" defaultValue={o.tipo} onChange={(e) => handleUpdate(o._id, { tipo: e.target.value })}>
                        {OarTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <select className="border border-slate-300 px-2 py-1.5 rounded-lg" value={o.estado} onChange={(e) => handleEstadoChange(o, e.target.value)}>
                        {Object.values(OarStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    {o.tipo === 'hacha' && (
                      <div className="grid grid-cols-1 sm:grid-cols-[auto_160px] items-center gap-2 sm:gap-3">
                        <label className="text-sm text-slate-600 font-medium">Largo</label>
                        <select className="border border-slate-300 px-2 py-1.5 rounded-lg" defaultValue={o.largoHacha || OarHachaSizes[0]} onChange={(e) => handleUpdate(o._id, { largoHacha: e.target.value })}>
                          {OarHachaSizes.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    )}
                    {requiresCause(o.estado) && (
                      <div className="grid grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
                        <label className="text-sm text-slate-600 font-medium">Causa</label>
                        <input
                          className="border border-slate-300 px-2 py-1.5 rounded-lg"
                          defaultValue={o.causa || ''}
                          placeholder="Obligatoria"
                          onBlur={(e) => handleUpdate(o._id, { causa: e.target.value.trim() })}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex md:flex-col items-end justify-end gap-2">
                    <button type="button" onClick={() => handleDelete(o._id)} className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 font-medium">Eliminar</button>
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
