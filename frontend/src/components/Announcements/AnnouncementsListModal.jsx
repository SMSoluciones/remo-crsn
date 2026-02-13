import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import BeatLoader from 'react-spinners/BeatLoader';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/useAuth';
import { fetchAnnouncements, deleteAnnouncement } from '../../models/Announcement';
import { showError, showSuccess } from '../../utils/toast';

Modal.setAppElement('#root');

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

  const handleDelete = async (id) => {
    if (!editable) return;
    if (!window.confirm('¿Eliminar este anuncio?')) return;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onRequestClose}></div>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 z-10 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Anuncios</h3>
          <button onClick={onRequestClose} className="text-gray-500 hover:text-gray-700"><XMarkIcon className="w-6 h-6"/></button>
        </div>
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
                <div key={id} className="flex justify-between items-start border rounded-lg p-3">
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
  );
}
