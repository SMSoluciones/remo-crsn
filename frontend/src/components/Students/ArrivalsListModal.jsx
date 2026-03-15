import React, { useEffect, useState } from 'react';
import { fireThemedSwal } from '../../utils/swalTheme';
import Modal from 'react-modal';
import { fetchStudents, deleteStudent } from '../../models/Student';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/useAuth';
import { showError, showSuccess } from '../../utils/toast';
import LoadingSpinner from '../common/LoadingSpinner';

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

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onRequestClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onRequestClose]);

  const handleDelete = async (id) => {
    if (!editable) return;
    const result = await fireThemedSwal({
      title: 'Eliminar alumno?',
      text: 'Esta accion no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
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
    <div className="fixed inset-0 z-50 modal-overlay p-2 sm:p-4 flex items-start sm:items-center justify-center overflow-y-auto" onClick={onRequestClose}>
      <div className="modal-panel w-full max-w-2xl mx-auto bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 z-10 max-h-[94vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 tracking-wide">Llegados (ultimos 10 dias)</h3>
          <button onClick={onRequestClose} className="p-1.5 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100" aria-label="Cerrar modal"><XMarkIcon className="w-6 h-6"/></button>
        </div>
        <div className="p-3 sm:p-4 overflow-y-auto">
        {loading ? (
          <LoadingSpinner message="" className="py-8" />
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
                <div key={id} className="flex justify-between items-start border border-slate-200 rounded-xl p-3 bg-white shadow-sm">
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
    </div>
  );
}
