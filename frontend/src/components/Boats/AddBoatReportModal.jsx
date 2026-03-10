import React, { useEffect, useState, useRef } from 'react';
import BeatLoader from 'react-spinners/BeatLoader';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createBoatReport } from '../../models/BoatReport';
import { showError, showSuccess } from '../../utils/toast';
import { useAuth } from '../../context/useAuth';

export default function AddBoatReportModal({ isOpen, onRequestClose, boats = [], onReportAdded }) {
  const { user } = useAuth();
  const [boatId, setBoatId] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [detectedBy, setDetectedBy] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [foto, setFoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setBoatId(boats && boats[0] ? (boats[0]._id || boats[0].id) : '');
      setDetectedBy(user ? (user.nombre || user.name || user.email || '') : '');
      setFecha(new Date().toISOString().slice(0,10));
      setHora(new Date().toTimeString().slice(0,5));
      setDescripcion('');
      setFoto(null);
    }
  }, [isOpen, boats, user]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onRequestClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onRequestClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!boatId) return showError('Seleccione un bote');
    if (!descripcion) return showError('Ingrese la descripción de la falla');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('boatId', boatId);
      fd.append('descripcion', descripcion);
      fd.append('fecha', fecha);
      fd.append('hora', hora);
      fd.append('detectedByName', detectedBy || '');
      if (foto) fd.append('foto', foto);
      // reporter info from user
      if (user) {
        fd.append('reporterId', user.id || user._id || '');
        fd.append('reporterName', user.nombre || user.name || user.email || '');
        if (user.email) fd.append('reporterEmail', user.email);
      }
      // Debug: log FormData entries to help diagnose missing fields from the client
      try {
        console.group('AddBoatReport Modal - FormData');
        for (const pair of fd.entries()) {
          console.log(pair[0], pair[1]);
        }
        console.groupEnd();
      } catch (e) {
        console.warn('FormData debug failed', e);
      }
      const created = await createBoatReport(fd, user);
      showSuccess('Reporte creado');
      if (typeof onReportAdded === 'function') onReportAdded(created);
      onRequestClose();
    } catch (err) {
      console.error('Error creando reporte:', err);
      showError(err.message || 'No se pudo crear el reporte');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 modal-overlay p-2 sm:p-4 flex items-start sm:items-center justify-center overflow-y-auto" onClick={onRequestClose}>
      <div className="modal-panel w-full max-w-2xl mx-auto bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col transform transition-all duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 tracking-wide">Reportar falla de bote</h3>
          <button onClick={onRequestClose} className="p-1.5 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100" aria-label="Cerrar modal"><XMarkIcon className="w-6 h-6"/></button>
        </div>
        <div className="p-3 sm:p-4 overflow-y-auto">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 p-3 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <label className="text-sm font-medium text-slate-600">Bote</label>
          <select value={boatId} onChange={e => setBoatId(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500">
            <option value="">Seleccione bote</option>
            {boats.map(b => <option key={b._id || b.id} value={b._id || b.id}>{b.nombre}</option>)}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium text-slate-600">Fecha</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Hora</label>
              <input type="time" value={hora} onChange={e => setHora(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" />
            </div>
          </div>

          <label className="text-sm font-medium text-slate-600">Detectado por (si otro)</label>
          <input value={detectedBy} onChange={e => setDetectedBy(e.target.value)} placeholder="Nombre de quien detectó" className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" />

          <label className="text-sm font-medium text-slate-600">Descripción</label>
          <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" rows={4} />

          <label className="text-sm font-medium text-slate-600">Foto (opcional)</label>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={e => setFoto(e.target.files[0] || null)} className="hidden" />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 hover:bg-slate-200"
            >
              Cargar foto
            </button>
            {foto && <span className="text-sm text-gray-600">{foto.name}</span>}
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={onRequestClose} className="px-4 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-100">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-300">{loading ? <BeatLoader size={8} color="#ffffff" /> : 'Reportar'}</button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
