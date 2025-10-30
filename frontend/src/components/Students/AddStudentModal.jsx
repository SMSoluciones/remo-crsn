import { useState } from 'react';
import { createStudent } from '../../models/Student';
import { showError, showSuccess } from '../../utils/toast';
import { fetchStudents } from '../../models/Student';

export default function AddStudentModal({ open, onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nombre: '', apellido: '', dni: '', categoria: 'Senior', domicilio: '', nacimiento: '', celular: '', email: '', fechaIngreso: '' });

  const categories = ['Infantil', 'Juvenil', 'Senior', 'Master']; // asunción razonable; modificar si corresponde

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
      const emailExists = existingStudent.some(student => student.email === form.email);
      if (emailExists) {
        showError('El email ya fue utilizado');
        setLoading(false);
        return;
      }
      const payload = { ...form };
      const created = await createStudent(payload);
      showSuccess('Alumno creado correctamente');
      setForm({ nombre: '', apellido: '', dni: '', categoria: 'Senior', domicilio: '', nacimiento: '', celular: '', email: '', fechaIngreso: '' });
      onCreated && onCreated(created);
      onClose && onClose();
    } catch (err) {
      console.error('Error creando alumno:', err);
      showError('No se pudo crear el alumno');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Agregar Alumno</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Cerrar</button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre" required className="border rounded px-3 py-2" />
          <input value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} placeholder="Apellido" required className="border rounded px-3 py-2" />
          <input value={form.dni} onChange={e => setForm(f => ({ ...f, dni: e.target.value }))} placeholder="DNI" required className="border rounded px-3 py-2" />
          <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} className="border rounded px-3 py-2">
            {categories.map(c => (<option key={c} value={c}>{c}</option>))}
          </select>
          <input value={form.domicilio} onChange={e => setForm(f => ({ ...f, domicilio: e.target.value }))} placeholder="Domicilio" className="border rounded px-3 py-2 md:col-span-2" />
          <input type="date" value={form.nacimiento} onChange={e => setForm(f => ({ ...f, nacimiento: e.target.value }))} placeholder="Nacimiento" className="border rounded px-3 py-2" />
          <input value={form.celular} onChange={e => setForm(f => ({ ...f, celular: e.target.value }))} placeholder="Celular" className="border rounded px-3 py-2" />
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="border rounded px-3 py-2 md:col-span-2" />
          <input type="date" value={form.fechaIngreso} onChange={e => setForm(f => ({ ...f, fechaIngreso: e.target.value }))} placeholder="Fecha de ingreso" className="border rounded px-3 py-2 md:col-span-2" />
          <div className="md:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Alumno'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
