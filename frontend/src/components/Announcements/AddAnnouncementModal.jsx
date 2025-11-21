import React, { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { showError, showSuccess } from '../../utils/toast';
import { useAuth } from '../../context/useAuth';
import { fetchAnnouncements, createAnnouncement, deleteAnnouncement } from '../../models/Announcement';

export default function AddAnnouncementModal({ isOpen, onRequestClose, onAnnouncementAdded, onAnnouncementDeleted }) {
	const { user } = useAuth();
	const [title, setTitle] = useState('');
	const [date, setDate] = useState('');
	const [description, setDescription] = useState('');
	const [loading, setLoading] = useState(false);
	const [listLoading, setListLoading] = useState(false);
	const [listError, setListError] = useState(null);
	const [items, setItems] = useState([]);
	const [deletingId, setDeletingId] = useState(null);

	useEffect(() => {
		AOS.init({ duration: 300, easing: 'ease-out', once: true });
	}, []);

	useEffect(() => {
		if (!isOpen) return;
		(async () => {
			setListLoading(true);
			setListError(null);
			try {
				const data = await fetchAnnouncements();
				const arr = Array.isArray(data) ? data : [];
				const withDate = arr.filter(a => a && a.date).sort((a,b) => new Date(a.date) - new Date(b.date));
				const withoutDate = arr.filter(a => !a || !a.date);
				setItems([...withDate, ...withoutDate]);
			} catch (err) {
				console.error('Error cargando anuncios:', err);
				setListError('No se pudo cargar la lista de anuncios');
				setItems([]);
			} finally {
				setListLoading(false);
			}
		})();
	}, [isOpen]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!title || !date || !description) {
			showError('Complete los campos requeridos: título, fecha y descripción');
			return;
		}
		setLoading(true);
		try {
			const created = await createAnnouncement({ title, date, description }, user);
			showSuccess('Anuncio creado correctamente');
			setTitle('');
			setDate('');
			setDescription('');
			setItems(prev => {
				const list = Array.isArray(prev) ? [...prev, created] : [created];
				const withDate = list.filter(a => a && a.date).sort((a,b) => new Date(a.date) - new Date(b.date));
				const withoutDate = list.filter(a => !a || !a.date);
				return [...withDate, ...withoutDate];
			});
			if (typeof onAnnouncementAdded === 'function') onAnnouncementAdded(created);
			onRequestClose();
		} catch (err) {
			console.error('Error al crear el anuncio:', err);
			showError('No se pudo crear el anuncio');
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (id) => {
		if (!id) return;
		const ok = window.confirm('¿Eliminar este anuncio? Esta acción no se puede deshacer.');
		if (!ok) return;
		try {
			setDeletingId(id);
			await deleteAnnouncement(id, user);
			setItems(prev => prev.filter(a => (a._id || a.id) !== id));
			if (typeof onAnnouncementDeleted === 'function') onAnnouncementDeleted(id);
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
			<div className="bg-white rounded-xl shadow-lg w-full h-full sm:h-auto max-w-3xl p-4 sm:p-6 z-10 overflow-auto" data-aos="fade-up">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold">Agregar Nuevo Anuncio</h3>
					<button onClick={onRequestClose} className="text-gray-500 hover:text-gray-700">Cerrar</button>
				</div>
				<form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
					<input
						type="text"
						placeholder="Título"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="border rounded px-3 py-2 w-full"
						required
					/>
					<input
						type="date"
						value={date}
						onChange={(e) => setDate(e.target.value)}
						className="border rounded px-3 py-2 w-full"
						required
					/>
					<textarea
						placeholder="Descripción"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						className="border rounded px-3 py-2 w-full"
						required
					></textarea>
					<div className="flex flex-col sm:flex-row justify-end gap-4">
						<button
							type="button"
							onClick={onRequestClose}
							className="px-4 py-2 border rounded hover:bg-gray-200 w-full sm:w-auto"
						>
							Cancelar
						</button>
						<button
							type="submit"
							className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto"
							disabled={loading}
						>
							{loading ? 'Guardando...' : 'Guardar Anuncio'}
						</button>
					</div>
				</form>

				<div className="mt-6">
					<div className="flex items-center justify-between mb-2">
						<h4 className="text-base font-semibold">Anuncios existentes</h4>
						{listLoading && <span className="text-sm text-gray-500">Cargando...</span>}
					</div>
					{listError ? (
						<div className="text-sm text-red-600">{listError}</div>
					) : items.length === 0 ? (
						<div className="text-sm text-gray-500">No hay anuncios</div>
					) : (
							<div className="border rounded-lg overflow-hidden">
								<div className="max-h-72 overflow-y-auto">
									<div className="overflow-x-auto">
										<table className="min-w-[600px] sm:min-w-full text-sm">
									<thead className="bg-gray-100 text-gray-700">
										<tr>
											<th className="text-left px-4 py-2">Título</th>
											<th className="text-left px-4 py-2">Fecha</th>
											<th className="text-left px-4 py-2">Descripción</th>
											<th className="text-right px-4 py-2">Acciones</th>
										</tr>
									</thead>
									<tbody>
										{items.map((it) => {
											const id = it._id || it.id;
											const fecha = it.date
												? new Date(it.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
												: 'Sin fecha';
											return (
												<tr key={id}>
													<td className="px-4 py-2 align-top">
														<span className="font-medium">{it.title || 'Anuncio'}</span>
													</td>
													<td className="px-4 py-2 align-top whitespace-nowrap">{fecha}</td>
													<td className="px-4 py-2 align-top text-gray-600">{it.description || 'Sin descripción'}</td>
													<td className="px-4 py-2 align-top">
														<div className="flex justify-end">
															<button
																title="Eliminar"
																onClick={() => handleDelete(id)}
																disabled={deletingId === id}
																className={`p-2 rounded hover:bg-red-100 ${deletingId === id ? 'opacity-50 cursor-not-allowed' : ''}`}
															>
																<XMarkIcon className="w-5 h-5 text-red-600" />
															</button>
														</div>
													</td>
												</tr>
											);
										})}
									</tbody>
									</table>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
