import React, { useEffect, useState, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import BeatLoader from 'react-spinners/BeatLoader';
import { fetchBoatReports, deleteBoatReport, updateBoatReport } from '../../models/BoatReport';
import { showError, showSuccess } from '../../utils/toast';
import Avatar from 'react-avatar';


export default function ManageReportsModal({ isOpen, onRequestClose, boats = [], user, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [fullImage, setFullImage] = useState(null);
  const [filterBoatId, setFilterBoatId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterKeywords, setFilterKeywords] = useState('');
  const role = (user && (user.rol || user.role)) ? String(user.rol || user.role).toLowerCase() : '';
  const canDeleteReports = ['admin', 'subcomision'].includes(role);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchBoatReports().catch(() => []);
      // Determine visibility of closed reports based on user role
      const all = Array.isArray(data) ? data : [];
      const allowed = ['admin', 'subcomision', 'mantenimiento', 'entrenador', 'profesor'];
      let visible = all;
      if (!allowed.includes(role)) {
        // hide closed reports for non-privileged users
        visible = all.filter(r => String(r.status || '').toLowerCase() !== 'cerrado');
      }
      setReports(visible);
    } catch {
      console.error('Error cargando reportes:');
      showError('Error cargando reportes');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onRequestClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onRequestClose]);

  const getBoatName = (boatRef) => {
    if (!boatRef) return 'Bote';
    if (typeof boatRef === 'object') return boatRef.nombre || boatRef.name || 'Bote';
    const found = boats.find(b => (b._id === boatRef || b.id === boatRef));
    return found ? (found.nombre || found.name || 'Bote') : 'Bote';
  };

  const handleDelete = async (id) => {
    if (!canDeleteReports) {
      showError('No tienes permisos para eliminar reportes');
      return;
    }
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

  // prepare filtered list for rendering
  const filteredReports = (() => {
    const k = (filterKeywords || '').trim().toLowerCase();
    const fromTs = filterDateFrom ? new Date(filterDateFrom).setHours(0,0,0,0) : null;
    const toTs = filterDateTo ? new Date(filterDateTo).setHours(23,59,59,999) : null;
    return reports
      .filter(r => {
        if (filterBoatId) {
          const bid = String(r.boatId || r.boat || '');
          if (String(filterBoatId) !== bid) return false;
        }
        if (fromTs || toTs) {
          const t = r.fechaReporte ? new Date(r.fechaReporte).getTime() : 0;
          if (fromTs && t < fromTs) return false;
          if (toTs && t > toTs) return false;
        }
        if (k) {
          const hay = [r.descripcion, r.reporterName, r.detectedByName, r.reporterEmail].filter(Boolean).join(' ').toLowerCase();
          if (!hay.includes(k)) return false;
        }
        return true;
      })
      .slice()
      .sort((a,b) => {
        const order = { abierto: 0, en_reparacion: 1, cerrado: 2 };
        const oa = order[a.status] ?? 3;
        const ob = order[b.status] ?? 3;
        if (oa !== ob) return oa - ob;
        const ta = a.fechaReporte ? new Date(a.fechaReporte).getTime() : 0;
        const tb = b.fechaReporte ? new Date(b.fechaReporte).getTime() : 0;
        return tb - ta;
      });
  })();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 modal-overlay p-2 sm:p-4 flex items-start sm:items-center justify-center overflow-y-auto" onClick={onRequestClose}>
      <div className="modal-panel w-full max-w-2xl mx-auto bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 outline-none transform transition-all duration-300 max-h-[94vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 tracking-wide">Administrar reportes</h3>
            <p className="text-xs text-slate-500 mt-1">Los reportes con estado 'cerrado' solo son visibles para Admin, Subcomisión, Mantenimiento, Entrenador y Profesor.</p>
          </div>
          <button onClick={onRequestClose} className="p-1.5 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100" aria-label="Cerrar modal"><XMarkIcon className="w-6 h-6"/></button>
        </div>
        <div className="p-3 sm:p-4 overflow-y-auto" data-aos="zoom-in" data-aos-duration="300">
      {loading ? (
        <div className="flex justify-center py-6"><BeatLoader size={8} color="#1E40AF" /></div>
      ) : reports.length === 0 ? (
        <div className="text-sm text-gray-500">No hay reportes</div>
      ) : (
        <div>
          <div className="mb-4 p-3 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
            <div>
              <label className="text-xs font-medium text-slate-600">Bote</label>
              <select value={filterBoatId} onChange={e => setFilterBoatId(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500">
                <option value="">-- Todos --</option>
                {boats.map(b => <option key={b._id || b.id} value={b._id || b.id}>{b.nombre || b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Fecha desde</label>
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Fecha hasta</label>
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-600">Palabras clave</label>
              <input placeholder="Buscar descripción, reporter o detector" value={filterKeywords} onChange={e => setFilterKeywords(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" />
            </div>
          </div>
          <ul className="space-y-3 max-h-[58vh] sm:max-h-[60vh] overflow-y-auto">
            {filteredReports.map(r => {
              const id = r._id || r.id;
              const boatName = getBoatName(r.boatId);
              return (
                <li key={id} className="flex items-start gap-3 p-3 sm:p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
                  <div className="w-14 h-14 flex-shrink-0">
                    {r.fotoURL ? (
                      <img src={r.fotoURL} alt="foto" className="w-14 h-14 object-cover rounded cursor-pointer" onClick={() => setFullImage(r.fotoURL)} />
                    ) : (
                      <Avatar name={boatName} size="48" round={true} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800">{boatName}</div>
                    <div className="text-sm text-slate-600 break-words">{r.descripcion}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {r.reporterName ? (<div>Reportado por: <strong>{r.reporterName}</strong></div>) : null}
                      {r.reporterEmail ? (<div>Email: <strong>{r.reporterEmail}</strong></div>) : null}
                      {r.reporterId ? (<div>ID: {r.reporterId}</div>) : null}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Fecha reporte: {r.fechaReporte ? new Date(r.fechaReporte).toLocaleString('es-ES') : '—'}</div>
                    {r.enReparacionAt && (
                      <div className="text-xs text-yellow-700 mt-1">En reparación desde: {new Date(r.enReparacionAt).toLocaleString('es-ES')}</div>
                    )}
                    {r.cerradoAt && (
                      <div className="text-xs text-green-700 mt-1">Cerrado el: {new Date(r.cerradoAt).toLocaleString('es-ES')}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">{r.status}</div>
                    <select value={r.status} onChange={(e) => handleChangeStatus(id, e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500">
                      <option value="abierto">abierto</option>
                      <option value="en_reparacion">en_reparacion</option>
                      <option value="cerrado">cerrado</option>
                    </select>
                    {canDeleteReports && (
                      <div className="flex gap-2">
                        <button onClick={() => handleDelete(id)} className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 font-medium">Eliminar</button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
        </div>

        {/* Full image overlay */}
        {fullImage && (
          <div className="fixed inset-0 z-60 modal-overlay p-2 sm:p-4 flex items-center justify-center" onClick={() => setFullImage(null)}>
            <img src={fullImage} alt="full" className="modal-panel max-h-[75vh] max-w-[75vw] rounded" />
          </div>
        )}
      </div>
    </div>
  );
}
