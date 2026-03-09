import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import BeatLoader from 'react-spinners/BeatLoader';
import { fetchBoats, createBoat, updateBoat, deleteBoat, BoatTypes, BoatStatus } from '../../models/Boat';
import { showError, showSuccess } from '../../utils/toast';


export default function ManageBoatsModal({ isOpen, onRequestClose, user, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [boats, setBoats] = useState([]);
  const [newBoat, setNewBoat] = useState({
    nombre: '',
    tipo: BoatTypes[0],
    estado: BoatStatus.ACTIVO,
    nivelDif: 1,
    row: 1,
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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const created = await createBoat({
        nombre: newBoat.nombre,
        tipo: newBoat.tipo,
        estado: newBoat.estado,
        nivelDif: Number(newBoat.nivelDif) || 1,
        row: Number(newBoat.row) || 1,
        fechaIngreso: new Date().toISOString(),
      }, user);
      setBoats(prev => [created, ...prev]);
      setNewBoat({ nombre: '', tipo: BoatTypes[0], estado: BoatStatus.ACTIVO, nivelDif: 1, row: 1 });
      showSuccess('Bote agregado');
      if (typeof onUpdated === 'function') onUpdated();
    } catch (err) {
      console.error('Error creando bote:', err);
      showError('No se pudo agregar el bote');
    }
  };

  const handleUpdate = async (id, changes) => {
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

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar este bote?')) return;
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onRequestClose}>
      <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6 outline-none transform transition-all duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Administrar botes</h3>
          <button onClick={onRequestClose} className="text-gray-600 hover:text-gray-800"><XMarkIcon className="w-6 h-6"/></button>
        </div>
        <form onSubmit={handleCreate} className="mb-4 p-3 border rounded grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Nombre</label>
            <input
              className="w-full border px-2 py-1 rounded"
              value={newBoat.nombre}
              onChange={(e) => setNewBoat(prev => ({ ...prev, nombre: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Tipo</label>
            <select className="w-full border px-2 py-1 rounded" value={newBoat.tipo} onChange={(e) => setNewBoat(prev => ({ ...prev, tipo: e.target.value }))}>
              {BoatTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Estado</label>
            <select className="w-full border px-2 py-1 rounded" value={newBoat.estado} onChange={(e) => setNewBoat(prev => ({ ...prev, estado: e.target.value }))}>
              {Object.values(BoatStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Dificultad</label>
            <input type="number" min="1" max="5" className="w-full border px-2 py-1 rounded" value={newBoat.nivelDif} onChange={(e) => setNewBoat(prev => ({ ...prev, nivelDif: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Remo</label>
            <input type="number" min="1" className="w-full border px-2 py-1 rounded" value={newBoat.row} onChange={(e) => setNewBoat(prev => ({ ...prev, row: e.target.value }))} />
          </div>
          <div className="md:col-span-6 flex justify-end">
            <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700">Agregar bote</button>
          </div>
        </form>
        <div data-aos="zoom-in" data-aos-duration="300">
      {loading ? (
        <div className="flex justify-center py-6"><BeatLoader color="#1E40AF" /></div>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-auto">
          {boats.map(b => (
            <div key={b._id} className="p-3 border rounded grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center gap-3">
                  <input className="border px-2 py-1 rounded flex-1" defaultValue={b.nombre} onBlur={(e) => handleUpdate(b._id, { nombre: e.target.value })} />
                  <select className="border px-2 py-1 rounded" defaultValue={b.tipo} onChange={(e) => handleUpdate(b._id, { tipo: e.target.value })}>
                    {BoatTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <select className="border px-2 py-1 rounded" defaultValue={b.estado} onChange={(e) => handleUpdate(b._id, { estado: e.target.value })}>
                    {Object.values(BoatStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input type="date" defaultValue={b.fechaIngreso ? new Date(b.fechaIngreso).toISOString().slice(0,10) : ''} className="border px-2 py-1 rounded" onChange={(e) => handleUpdate(b._id, { fechaIngreso: e.target.value })} />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm">Dificultad</label>
                  <input type="number" min="1" max="5" defaultValue={b.nivelDif || 1} className="border px-2 py-1 rounded w-20" onBlur={(e) => handleUpdate(b._id, { nivelDif: Number(e.target.value) })} />
                  <label className="text-sm">Remo</label>
                  <input type="number" min="1" defaultValue={b.row || 1} className="border px-2 py-1 rounded w-20" onBlur={(e) => handleUpdate(b._id, { row: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button onClick={() => handleDelete(b._id)} className="text-red-600 hover:text-red-800">Eliminar</button>
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
