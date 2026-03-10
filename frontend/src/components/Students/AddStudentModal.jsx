import { useState, useEffect } from 'react';
import { createStudent, updateStudent } from '../../models/Student';
import { showError, showSuccess } from '../../utils/toast';
import { fetchStudents } from '../../models/Student';

export default function AddStudentModal({ open, onClose, onCreated, initialData, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const empty = { socioN: '', tipo: '', ciudad: '', nombre: '', apellido: '', dni: '', categoria: 'Adulto - Master', domicilio: '', nacimiento: '', celular: '', email: '', fechaIngreso: '', beca: false, competitivo: false, federado: false, estado: 'ACTIVO' };
  const [form, setForm] = useState(empty);

  const categories = ['Escuelita', 'Promocional', 'Adulto - Master'];

  useEffect(() => {
    if (initialData) {
      // populate form with initial data for editing
      setForm({ ...empty, ...initialData });
    } else {
      setForm(empty);
    }
  }, [initialData]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.apellido || !form.dni || !form.categoria) {
      showError('Complete los campos requeridos: nombre, apellido, dni y categoría');
      return;
    }
    setLoading(true);
    try {
      const existingStudent = await fetchStudents();
      const emailExists = existingStudent.some(student => student.email === form.email && String(student._id || student.id) !== String(initialData?._id || initialData?.id));
      if (emailExists) {
        showError('El email ya fue utilizado');
        setLoading(false);
        return;
      }
      const payload = { ...form };
      if (initialData && (initialData._id || initialData.id)) {
        const id = initialData._id || initialData.id;
        const updated = await updateStudent(id, payload);
        showSuccess('Alumno actualizado correctamente');
        onUpdated && onUpdated(updated);
      } else {
        const created = await createStudent(payload);
        showSuccess('Alumno creado correctamente');
        onCreated && onCreated(created);
      }
      setForm(empty);
      onClose && onClose();
    } catch (err) {
      console.error('Error guardando alumno:', err);
      showError('No se pudo guardar el alumno');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 modal-overlay p-2 sm:p-4 flex items-start sm:items-center justify-center overflow-y-auto" onClick={onClose}>
      <div className="modal-panel w-full max-w-2xl mx-auto bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 tracking-wide">{initialData ? 'Editar alumno' : 'Agregar alumno'}</h3>
          <button onClick={onClose} className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100">Cerrar</button>
        </div>
        <div className="p-3 sm:p-4 overflow-y-auto">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <input value={form.socioN} onChange={e => setForm(f => ({ ...f, socioN: e.target.value }))} placeholder="N° Socio" className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" />
          <input value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} placeholder="Tipo" className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" />
          <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre" required className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" />
          <input value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} placeholder="Apellido" required className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" />
          <input value={form.dni} onChange={e => setForm(f => ({ ...f, dni: e.target.value }))} placeholder="DNI" required className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" />
          <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500">
            {categories.map(c => (<option key={c} value={c}>{c}</option>))}
          </select>
          <input value={form.domicilio} onChange={e => setForm(f => ({ ...f, domicilio: e.target.value }))} placeholder="Domicilio" className="border border-slate-300 rounded-lg px-3 py-2 md:col-span-2 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" />
          <input value={form.ciudad} onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))} placeholder="Ciudad" className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" />
          <input type="date" value={form.nacimiento} onChange={e => setForm(f => ({ ...f, nacimiento: e.target.value }))} placeholder="Nacimiento" className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" />
          <input value={form.celular} onChange={e => setForm(f => ({ ...f, celular: e.target.value }))} placeholder="Celular" className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" />
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="border border-slate-300 rounded-lg px-3 py-2 md:col-span-2 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" />
          <input type="date" value={form.fechaIngreso} onChange={e => setForm(f => ({ ...f, fechaIngreso: e.target.value }))} placeholder="Fecha de ingreso" className="border border-slate-300 rounded-lg px-3 py-2 md:col-span-2 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" />
          <div className="flex items-center gap-3 text-slate-700">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.beca} onChange={e => setForm(f => ({ ...f, beca: e.target.checked }))} /> Beca</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.competitivo} onChange={e => setForm(f => ({ ...f, competitivo: e.target.checked }))} /> Competitivo</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.federado} onChange={e => setForm(f => ({ ...f, federado: e.target.checked }))} /> Federado</label>
          </div>
          <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} className="border border-slate-300 rounded-lg px-3 py-2 md:col-span-2 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500">
            <option value="ACTIVO">ACTIVO</option>
            <option value="INACTIVO">INACTIVO</option>
          </select>
          <div className="md:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-100">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50" disabled={loading}>{loading ? 'Guardando...' : (initialData ? 'Actualizar' : 'Guardar Alumno')}</button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
