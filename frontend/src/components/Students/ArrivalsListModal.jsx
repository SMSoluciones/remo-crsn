import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { fetchStudents, deleteStudent } from '../../models/Student';
import BeatLoader from 'react-spinners/BeatLoader';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/useAuth';
import { showError, showSuccess } from '../../utils/toast';

Modal.setAppElement('#root');

export default function ArrivalsListModal({ isOpen, onRequestClose }) {
  const { user } = useAuth();
  const role = String(user?.rol || '').trim().toLowerCase();
  const editable = ['admin', 'entrenador', 'subcomision'].includes(role);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (!isOpen) return;
    setLoading(true);
    fetchStudents()
      .then(list => {
        if (!mounted) return;
        const arr = Array.isArray(list) ? list : [];
        // filter arrivals by fechaIngreso last 10 days
        const toDate = v => { if (!v) return null; const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; };
        const cutoff = new Date(); cutoff.setHours(0,0,0,0); cutoff.setDate(cutoff.getDate() - 10);
        const recent = arr.filter(s => {
          const d = toDate(s.fechaIngreso || s.fecha_ingreso || s.ingreso);
          return d && d >= cutoff;
        });
        setItems(recent);
      })
      .catch(err => {
        console.error('Error cargando llegados:', err);
        showError('No se pudieron cargar los llegados');
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false };
  }, [isOpen]);

  const handleDelete = async (id) => {
    if (!editable) return;
    if (!window.confirm('¿Eliminar este alumno?')) return;
    try {
      setDeletingId(id);
      await deleteStudent(id);
      setItems(prev => prev.filter(s => (s._id || s.id) !== id));
      showSuccess('Alumno eliminado');
    } catch (err) {
      console.error('Error eliminando alumno:', err);
      showError('No se pudo eliminar el alumno');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onRequestClose}></div>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 z-10 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Llegados (últimos 10 días)</h3>
          <button onClick={onRequestClose} className="text-gray-500 hover:text-gray-700"><XMarkIcon className="w-6 h-6"/></button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8"><BeatLoader color="#1E40AF" /></div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-600">Sin novedades</div>
        ) : (
          <div className="space-y-3">
            {items.map(s => {
              const id = s._id || s.id || s.dni;
              const name = `${s.nombre || ''} ${s.apellido || ''}`.trim() || id;
              const fecha = s.fechaIngreso || s.fecha_ingreso || s.ingreso;
              const fechaStr = fecha ? new Date(fecha).toLocaleDateString('es-ES') : '—';
              return (
                <div key={id} className="flex justify-between items-start border rounded-lg p-3">
                  <div>
                    <div className="font-medium text-gray-800">{name}</div>
                    <div className="text-sm text-gray-600">Ingreso: {fechaStr}</div>
                  </div>
                  {editable ? (
                    <div className="ml-4">
                      <button onClick={() => handleDelete(id)} disabled={deletingId === id} className={`p-2 rounded ${deletingId === id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-100'}`}>
                        <XMarkIcon className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
