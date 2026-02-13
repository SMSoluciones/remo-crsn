import React, { useEffect, useState, useRef } from 'react';
import Modal from 'react-modal';
import BeatLoader from 'react-spinners/BeatLoader';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createBoatReport } from '../../models/BoatReport';
import { showError, showSuccess } from '../../utils/toast';
import { useAuth } from '../../context/useAuth';

Modal.setAppElement('#root');

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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="absolute inset-0" onClick={onRequestClose}></div>
      <div data-aos="zoom-in" data-aos-duration="300" className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 z-10 overflow-auto transform transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Reportar Falla de Bote</h3>
          <button onClick={onRequestClose} className="text-gray-500 hover:text-gray-700"><XMarkIcon className="w-6 h-6"/></button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3">
          <label className="text-sm">Bote</label>
          <select value={boatId} onChange={e => setBoatId(e.target.value)} className="border rounded px-3 py-2">
            <option value="">Seleccione bote</option>
            {boats.map(b => <option key={b._id || b.id} value={b._id || b.id}>{b.nombre}</option>)}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm">Fecha</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="text-sm">Hora</label>
              <input type="time" value={hora} onChange={e => setHora(e.target.value)} className="border rounded px-3 py-2 w-full" />
            </div>
          </div>

          <label className="text-sm">Detectado por (si otro)</label>
          <input value={detectedBy} onChange={e => setDetectedBy(e.target.value)} placeholder="Nombre de quien detectó" className="border rounded px-3 py-2" />

          <label className="text-sm">Descripción</label>
          <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} className="border rounded px-3 py-2" rows={4} />

          <label className="text-sm">Foto (opcional)</label>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={e => setFoto(e.target.files[0] || null)} className="hidden" />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="px-3 py-2 border rounded bg-gray-100 hover:bg-gray-200"
            >
              Cargar foto
            </button>
            {foto && <span className="text-sm text-gray-600">{foto.name}</span>}
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={onRequestClose} className="px-4 py-2 border rounded">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? <BeatLoader size={8} color="#fff" /> : 'Reportar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
