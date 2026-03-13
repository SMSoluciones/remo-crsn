import React, { useEffect, useState } from 'react';
import { fireThemedSwal } from '../../utils/swalTheme';
import BeatLoader from 'react-spinners/BeatLoader';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/useAuth';
import { fetchAnnouncements, deleteAnnouncement } from '../../models/Announcement';
import { showError, showSuccess } from '../../utils/toast';

export default function AnnouncementsListModal({ isOpen, onRequestClose }) {
  const { user } = useAuth();
  const role = String(user?.rol || '').trim().toLowerCase();
  const editable = ['admin','entrenador','subcomision'].includes(role);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (!isOpen) return;
    setLoading(true);
    fetchAnnouncements()
      .then(list => {
        if (!mounted) return;
        const arr = Array.isArray(list) ? list : [];
        const withDate = arr.filter(a => a && a.date).sort((a,b) => new Date(a.date) - new Date(b.date));
        const withoutDate = arr.filter(a => !a || !a.date);
        setItems([...withDate, ...withoutDate]);
      })
      .catch(err => {
        console.error('Error cargando anuncios:', err);
        showError('No se pudieron cargar los anuncios');
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
      title: 'Eliminar anuncio?',
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
      await deleteAnnouncement(id, user);
      setItems(prev => prev.filter(a => (a._id || a.id) !== id));
      showSuccess('Anuncio eliminado');
    } catch (err) {
      console.error('Error eliminando anuncio:', err);
      showError('No se pudo eliminar el anuncio');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 modal-overlay p-2 sm:p-4 flex items-start sm:items-center justify-center overflow-y-auto" onClick={onRequestClose}>
      <div className="modal-panel w-full max-w-2xl mx-auto bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 tracking-wide">Anuncios</h3>
          <button onClick={onRequestClose} className="p-1.5 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100" aria-label="Cerrar modal"><XMarkIcon className="w-6 h-6"/></button>
        </div>
        <div className="p-3 sm:p-4 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8"><BeatLoader color="#1E40AF" /></div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-600">No hay anuncios</div>
        ) : (
          <div className="space-y-3">
            {items.map(it => {
              const id = it._id || it.id;
              const fecha = it.date ? new Date(it.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Sin fecha';
              return (
                <div key={id} className="flex justify-between items-start border border-slate-200 rounded-xl p-3 bg-white shadow-sm">
                  <div>
                    <div className="font-medium text-gray-800">{it.title || 'Anuncio'}</div>
                    <div className="text-sm text-gray-600">{fecha}</div>
                    <div className="mt-2 text-gray-700">{it.description || 'Sin descripción'}</div>
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
