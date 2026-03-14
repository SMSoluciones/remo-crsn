import React, { useEffect, useState } from 'react';
import { fireThemedSwal } from '../../utils/swalTheme';
import { XMarkIcon } from '@heroicons/react/24/outline';
import BeatLoader from 'react-spinners/BeatLoader';
import { fetchBoats, createBoat, updateBoat, deleteBoat, uploadBoatPhoto, BoatTypes, BoatStatus } from '../../models/Boat';
import { showError, showSuccess } from '../../utils/toast';


export default function ManageBoatsModal({ isOpen, onRequestClose, user, onUpdated }) {
  const requiresCause = (estado) => estado === BoatStatus.MANTENIMIENTO || estado === BoatStatus.FUERA_SERVICIO;
  const [loading, setLoading] = useState(false);
  const [boats, setBoats] = useState([]);
  const [newBoat, setNewBoat] = useState({
    nombre: '',
    tipo: BoatTypes[0],
    estado: BoatStatus.ACTIVO,
    nivelDif: 1,
    row: 1,
    pesoMinimo: '',
    pesoMaximo: '',
    ubicacion: '',
    causa: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchBoats();
      setBoats(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando botes:', err);
      showError('No se pudieron cargar los botes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isOpen) load(); }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onRequestClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onRequestClose]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (requiresCause(newBoat.estado) && !String(newBoat.causa || '').trim()) {
      showError('Debes ingresar la causa cuando el bote queda en mantenimiento o fuera de servicio');
      return;
    }
    try {
      const created = await createBoat({
        nombre: newBoat.nombre,
        tipo: newBoat.tipo,
        estado: newBoat.estado,
        nivelDif: Number(newBoat.nivelDif) || 1,
        row: Number(newBoat.row) || 1,
        pesoMinimo: newBoat.pesoMinimo !== '' ? Number(newBoat.pesoMinimo) : undefined,
        pesoMaximo: newBoat.pesoMaximo !== '' ? Number(newBoat.pesoMaximo) : undefined,
        ubicacion: newBoat.ubicacion?.trim() || undefined,
        causa: String(newBoat.causa || '').trim() || undefined,
        fechaIngreso: new Date().toISOString(),
      }, user);
      setBoats(prev => [created, ...prev]);
      setNewBoat({ nombre: '', tipo: BoatTypes[0], estado: BoatStatus.ACTIVO, nivelDif: 1, row: 1, pesoMinimo: '', pesoMaximo: '', ubicacion: '', causa: '' });
      showSuccess('Bote agregado');
      if (typeof onUpdated === 'function') onUpdated();
    } catch (err) {
      console.error('Error creando bote:', err);
      showError('No se pudo agregar el bote');
    }
  };

  const handleUpdate = async (id, changes) => {
    const current = boats.find((b) => b._id === id);
    const nextEstado = changes.estado ?? current?.estado;
    const nextCausa = String(changes.causa ?? current?.causa ?? '').trim();
    if (requiresCause(nextEstado) && !nextCausa) {
      showError('Debes ingresar la causa cuando el bote queda en mantenimiento o fuera de servicio');
      return;
    }
    try {
      const updated = await updateBoat(id, changes, user);
      setBoats(prev => prev.map(b => (b._id === id ? updated : b)));
      showSuccess('Bote actualizado');
      if (typeof onUpdated === 'function') onUpdated();
    } catch (err) {
      console.error('Error actualizando bote:', err);
      showError('No se pudo actualizar el bote');
    }
  };

  const handleEstadoChange = async (boat, nextEstado) => {
    if (!boat?._id) return;
    const prevEstado = boat.estado;
    if (nextEstado === prevEstado) return;

    if (!requiresCause(nextEstado)) {
      await handleUpdate(boat._id, { estado: nextEstado });
      return;
    }

    const currentCause = String(boat.causa || '').trim();
    if (currentCause) {
      await handleUpdate(boat._id, { estado: nextEstado });
      return;
    }

    const result = await fireThemedSwal({
      title: 'Causa obligatoria',
      text: 'Para dejar el bote en mantenimiento o fuera de servicio debes indicar la causa.',
      input: 'text',
      inputLabel: 'Causa',
      inputPlaceholder: 'Ej: fisura en casco',
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
    await handleUpdate(boat._id, { estado: nextEstado, causa: String(result.value || '').trim() });
  };

  const handleDelete = async (id) => {
    const result = await fireThemedSwal({
      title: 'Eliminar bote?',
      text: 'Esta accion no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await deleteBoat(id, user);
      setBoats(prev => prev.filter(b => b._id !== id));
      showSuccess('Bote eliminado');
      if (typeof onUpdated === 'function') onUpdated();
    } catch (err) {
      console.error('Error eliminando bote:', err);
      showError('No se pudo eliminar el bote');
    }
  };

  const handlePhotoUpload = async (boatId, file) => {
    if (!file) return;
    try {
      const updated = await uploadBoatPhoto(boatId, file, user);
      setBoats(prev => prev.map(b => (b._id === boatId ? updated : b)));
      showSuccess('Foto del bote cargada');
      if (typeof onUpdated === 'function') onUpdated();
    } catch (err) {
      console.error('Error cargando foto del bote:', err);
      showError('No se pudo cargar la foto del bote');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 modal-overlay p-2 sm:p-4 flex items-start sm:items-center justify-center overflow-y-auto" onClick={onRequestClose}>
      <div
        className="modal-panel w-full max-w-2xl mx-auto bg-slate-50 rounded-2xl shadow-2xl outline-none transform transition-all duration-300 max-h-[94vh] flex flex-col border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 tracking-wide">Administrar botes</h3>
          <button
            type="button"
            onClick={onRequestClose}
            className="p-1.5 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Cerrar modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-3 sm:p-4 overflow-y-auto">
        <form onSubmit={handleCreate} className="mb-3 p-3 sm:p-4 bg-white border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2 items-end shadow-sm">
          <div className="sm:col-span-2 md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Nombre</label>
            <input
              className="w-full border border-slate-300 px-2 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500"
              value={newBoat.nombre}
              onChange={(e) => setNewBoat(prev => ({ ...prev, nombre: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
            <select className="w-full border border-slate-300 px-2 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" value={newBoat.tipo} onChange={(e) => setNewBoat(prev => ({ ...prev, tipo: e.target.value }))}>
              {BoatTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Estado</label>
            <select className="w-full border border-slate-300 px-2 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" value={newBoat.estado} onChange={(e) => setNewBoat(prev => ({ ...prev, estado: e.target.value }))}>
              {Object.values(BoatStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Dificultad</label>
            <input type="number" min="1" max="5" className="w-full border border-slate-300 px-2 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" value={newBoat.nivelDif} onChange={(e) => setNewBoat(prev => ({ ...prev, nivelDif: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Remo</label>
            <input type="number" min="1" className="w-full border border-slate-300 px-2 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" value={newBoat.row} onChange={(e) => setNewBoat(prev => ({ ...prev, row: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Peso minimo (kg)</label>
            <input type="number" min="0" className="w-full border border-slate-300 px-2 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" value={newBoat.pesoMinimo} onChange={(e) => setNewBoat(prev => ({ ...prev, pesoMinimo: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Peso maximo (kg)</label>
            <input type="number" min="0" className="w-full border border-slate-300 px-2 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" value={newBoat.pesoMaximo} onChange={(e) => setNewBoat(prev => ({ ...prev, pesoMaximo: e.target.value }))} />
          </div>
          <div className="sm:col-span-2 md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Ubicacion</label>
            <input className="w-full border border-slate-300 px-2 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" value={newBoat.ubicacion} onChange={(e) => setNewBoat(prev => ({ ...prev, ubicacion: e.target.value }))} />
          </div>
          {requiresCause(newBoat.estado) && (
            <div className="sm:col-span-2 md:col-span-4">
              <label className="block text-xs font-medium text-slate-600 mb-1">Causa (obligatoria)</label>
              <input
                className="w-full border border-slate-300 px-2 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500"
                value={newBoat.causa}
                onChange={(e) => setNewBoat(prev => ({ ...prev, causa: e.target.value }))}
                placeholder="Ej: fisura en casco, golpe en popa, etc."
                required
              />
            </div>
          )}
          <div className="sm:col-span-2 md:col-span-6 flex justify-end">
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm font-medium">Agregar bote</button>
          </div>
        </form>
        <div data-aos="zoom-in" data-aos-duration="300">
      {loading ? (
        <div className="flex justify-center py-6"><BeatLoader color="#1E40AF" /></div>
      ) : (
        <div className="space-y-3 max-h-[58vh] sm:max-h-[60vh] overflow-y-auto">
          {boats.map(b => (
            <div key={b._id} className="p-3 sm:p-4 border border-slate-200 bg-white rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3 items-start md:items-center shadow-sm">
              <div className="md:col-span-2 space-y-2 min-w-0">
                <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_120px] gap-2 sm:gap-3">
                  <input className="border border-slate-300 px-2 py-1.5 rounded-lg w-full min-w-0 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" defaultValue={b.nombre} onBlur={(e) => handleUpdate(b._id, { nombre: e.target.value })} />
                  <select className="border border-slate-300 px-2 py-1.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" defaultValue={b.tipo} onChange={(e) => handleUpdate(b._id, { tipo: e.target.value })}>
                    {BoatTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <select className="border border-slate-300 px-2 py-1.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" value={b.estado} onChange={(e) => handleEstadoChange(b, e.target.value)}>
                    {Object.values(BoatStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input type="date" defaultValue={b.fechaIngreso ? new Date(b.fechaIngreso).toISOString().slice(0,10) : ''} className="border border-slate-300 px-2 py-1.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" onChange={(e) => handleUpdate(b._id, { fechaIngreso: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-[auto_100px_auto_100px] items-center gap-2 sm:gap-3">
                  <label className="text-sm text-slate-600 font-medium">Dificultad</label>
                  <input type="number" min="1" max="5" defaultValue={b.nivelDif || 1} className="border border-slate-300 px-2 py-1.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" onBlur={(e) => handleUpdate(b._id, { nivelDif: Number(e.target.value) })} />
                  <label className="text-sm text-slate-600 font-medium">Remo</label>
                  <input type="number" min="1" defaultValue={b.row || 1} className="border border-slate-300 px-2 py-1.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" onBlur={(e) => handleUpdate(b._id, { row: Number(e.target.value) })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[auto_120px_auto_120px] items-center gap-2 sm:gap-3">
                  <label className="text-sm text-slate-600 font-medium">Peso minimo (kg)</label>
                  <input type="number" min="0" defaultValue={b.pesoMinimo ?? ''} className="border border-slate-300 px-2 py-1.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" onBlur={(e) => handleUpdate(b._id, { pesoMinimo: e.target.value === '' ? null : Number(e.target.value) })} />
                  <label className="text-sm text-slate-600 font-medium">Peso maximo (kg)</label>
                  <input type="number" min="0" defaultValue={b.pesoMaximo ?? ''} className="border border-slate-300 px-2 py-1.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" onBlur={(e) => handleUpdate(b._id, { pesoMaximo: e.target.value === '' ? null : Number(e.target.value) })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
                  <label className="text-sm text-slate-600 font-medium">Ubicacion</label>
                  <input defaultValue={b.ubicacion || b.proveedor || ''} className="border border-slate-300 px-2 py-1.5 rounded-lg w-full min-w-0 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" onBlur={(e) => handleUpdate(b._id, { ubicacion: e.target.value.trim() })} />
                </div>
                {requiresCause(b.estado) && (
                  <div className="grid grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
                    <label className="text-sm text-slate-600 font-medium">Causa</label>
                    <input
                      defaultValue={b.causa || ''}
                      className="border border-slate-300 px-2 py-1.5 rounded-lg w-full min-w-0 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500"
                      placeholder="Obligatoria"
                      onBlur={(e) => handleUpdate(b._id, { causa: e.target.value.trim() })}
                    />
                  </div>
                )}
              </div>
              <div className="flex md:flex-col items-end md:items-end justify-end gap-2">
                <label className="px-3 py-1.5 rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200 font-medium cursor-pointer text-sm">
                  Cargar foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      handlePhotoUpload(b._id, file);
                      e.target.value = '';
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => handleDelete(b._id)}
                  className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 font-medium"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
        </div>
        </div>
      </div>
    </div>
  );
}
