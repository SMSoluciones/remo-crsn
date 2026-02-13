import { useEffect, useState } from 'react';
import { fetchBoatUsages } from '../models/BoatUsage';
import { API_BASE_URL } from '../utils/apiConfig';

export default function RemarHistoryModal({ isOpen, onClose, user, boatsList = [] }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const items = await fetchBoatUsages();
        if (!mounted) return;
        let arr = [];
        if (Array.isArray(items)) arr = items;
        else if (items && Array.isArray(items.data)) arr = items.data;
        else if (items && Array.isArray(items.items)) arr = items.items;
        else arr = [];
        setList(arr);
      } catch (err) {
        console.error('RemarHistoryModal load failed', err);
        if (mounted) setError('No se pudo cargar el historial');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const fmtDate = (iso) => {
    try {
      if (!iso) return '—';
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString('es-ES');
    } catch (e) { return e; }
  };

  const getBoatDisplay = (usage) => {
    if (!usage) return 'Desconocido';
    if (usage.boatDisplay) return String(usage.boatDisplay);
    const b = usage.boatId || usage.boat || null;
    if (!b) return 'Desconocido';
    if (typeof b === 'string') {
      const found = boatsList.find(x => String(x._id) === String(b) || String(x.id) === String(b));
      return found ? (found.nombre || found.name || found.modelo || String(found._id)) : String(b);
    }
    // b might be a populated boat object
    try {
      return String(b.nombre || b.name || b.modelo || b._id || 'Desconocido');
    } catch (e) {
      return e;
    }
  };

  const getUserDisplay = (usage) => {
    if (!usage) return 'Desconocido';
    // direct fields
    if (usage.userName) return String(usage.userName);
    if (usage.userFullName) return String(usage.userFullName);
    // populated user object
    const u = usage.user || usage.userId || usage.userData || null;
    if (u && typeof u === 'object') {
      const first = u.nombre || u.name || u.firstName || u.nombres || '';
      const last = u.apellido || u.lastname || u.lastName || u.apellidos || '';
      const disp = (String(first + ' ' + last).trim()) || (u.email || u._id || 'Desconocido');
      return disp;
    }
    if (usage.userEmail) return String(usage.userEmail);
    // fallback: maybe the usage stores a plain name
    if (usage.requestedBy) return String(usage.requestedBy);
    return 'Desconocido';
  };

  const handleDelete = async (id) => {
    if (!id) return;
    if (!window.confirm('¿Eliminar esta entrada del historial?')) return;
    setDeletingId(id);
    try {
      const url = `${API_BASE_URL}/api/boat-usages/${id}`;
      const headers = { 'Content-Type': 'application/json' };
      // allow server to check role from header when running locally
      const isLocal = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');
      if (isLocal && user) {
        if (user.rol) headers['x-user-role'] = user.rol;
        if (user._id) headers['x-user-id'] = user._id;
      }
      const res = await fetch(url, { method: 'DELETE', headers, body: JSON.stringify({ userRole: user?.rol }) });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || body.message || `HTTP ${res.status}`);
      }
      // remove from list
      setList(prev => prev.filter(it => String(it._id) !== String(id)));
    } catch (err) {
      console.error('Delete failed', err);
      alert('No se pudo eliminar: ' + (err.message || 'error'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-4 mx-4 max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Historial Remar</h3>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1 bg-red-100 text-red-700 rounded">Cerrar</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : list.length === 0 ? (
          <div className="text-sm opacity-80">No hay registros en el historial.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="text-left border-b">
                  <th className="px-2 py-2">Usuario</th>
                  <th className="px-2 py-2">Bote</th>
                  <th className="px-2 py-2">Salida</th>
                  <th className="px-2 py-2">Regreso estimado</th>
                  <th className="px-2 py-2">Horas</th>
                  <th className="px-2 py-2">Nota</th>
                  <th className="px-2 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u._id || u.id} className="border-b">
                    <td className="px-2 py-2 align-top">{getUserDisplay(u)}</td>
                    <td className="px-2 py-2 align-top">{getBoatDisplay(u)}</td>
                    <td className="px-2 py-2 align-top">{fmtDate(u.requestedAt || u.salida || u.createdAt)}</td>
                    <td className="px-2 py-2 align-top">{fmtDate(u.estimatedReturn)}</td>
                    <td className="px-2 py-2 align-top">{u.durationHours ?? u.hours ?? '—'}</td>
                    <td className="px-2 py-2 align-top">{u.note || u.nota || '—'}</td>
                    <td className="px-2 py-2 align-top flex items-center gap-2">
                      {String(user?.rol || '').toLowerCase() === 'admin' ? (
                        <>
                          <button
                            title="Eliminar"
                            disabled={deletingId === (u._id||u.id)}
                            onClick={() => handleDelete(u._id||u.id)}
                            className="text-white bg-red-600 hover:bg-red-700 w-6 h-6 flex items-center justify-center rounded-full text-sm"
                          >
                            ×
                          </button>
                          <button disabled={deletingId === (u._id||u.id)} onClick={() => handleDelete(u._id||u.id)} className="px-2 py-1 bg-red-500 text-white rounded">
                            {deletingId === (u._id||u.id) ? 'Eliminando...' : 'Eliminar'}
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-500">Sin permisos</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
