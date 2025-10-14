import { useState } from 'react';
import ProtectedRoute from './ProtectedRoute';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const mockSheets = [
  { id: 't1', student: 'Juan García', entrenador: 'Entrenador Perez', fecha: '2023-03-01', postura: 8, remada: 7, equilibrio: 9, observaciones: 'Muy buen progreso.' },
  { id: 't2', student: 'Ana López', entrenador: 'Entrenador Perez', fecha: '2023-03-05', postura: 7, remada: 8, equilibrio: 8, observaciones: 'Debe mejorar la postura.' },
];


export default function TechnicalSheets() {
  const [sheets, setSheets] = useState(mockSheets);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ student: '', entrenador: '', fecha: '', postura: 5, remada: 5, equilibrio: 5, observaciones: '' });

  const handleAddSheet = (e) => {
    e.preventDefault();
    setSheets([...sheets, { ...form, id: 't' + (sheets.length + 1) }]);
    setForm({ student: '', entrenador: '', fecha: '', postura: 5, remada: 5, equilibrio: 5, observaciones: '' });
    setShowForm(false);
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'entrenador']}>
  <div className="bg-gray-50 min-h-screen p-8" data-aos="fade-up">
        <div className="flex items-center gap-2 mb-6">
          <ChartBarIcon className="h-7 w-7 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800">Fichas Técnicas</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="mb-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
        >
          {showForm ? 'Cancelar' : 'Nueva Ficha Técnica'}
        </button>
        {showForm && (
          <form onSubmit={handleAddSheet} className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-7 gap-4" data-aos="zoom-in">
            <input
              value={form.student}
              onChange={e => setForm(f => ({ ...f, student: e.target.value }))}
              placeholder="Alumno"
              required
              className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
            />
            <input
              value={form.entrenador}
              onChange={e => setForm(f => ({ ...f, entrenador: e.target.value }))}
              placeholder="Entrenador"
              required
              className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
            />
            <input
              type="date"
              value={form.fecha}
              onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
              required
              className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
            />
            <input
              type="number"
              min={1}
              max={10}
              value={form.postura}
              onChange={e => setForm(f => ({ ...f, postura: Number(e.target.value) }))}
              placeholder="Postura"
              required
              className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
            />
            <input
              type="number"
              min={1}
              max={10}
              value={form.remada}
              onChange={e => setForm(f => ({ ...f, remada: Number(e.target.value) }))}
              placeholder="Remada"
              required
              className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
            />
            <input
              type="number"
              min={1}
              max={10}
              value={form.equilibrio}
              onChange={e => setForm(f => ({ ...f, equilibrio: Number(e.target.value) }))}
              placeholder="Equilibrio"
              required
              className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
            />
            <textarea
              value={form.observaciones}
              onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
              placeholder="Observaciones"
              className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
            />
            <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 transition col-span-1 md:col-span-7">Guardar</button>
          </form>
        )}
  <div className="overflow-x-auto mb-8" data-aos="fade-left">
          <table className="min-w-full bg-white rounded-xl shadow">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-2 px-4 text-left">Alumno</th>
                <th className="py-2 px-4 text-left">Entrenador</th>
                <th className="py-2 px-4 text-left">Fecha</th>
                <th className="py-2 px-4 text-left">Postura</th>
                <th className="py-2 px-4 text-left">Remada</th>
                <th className="py-2 px-4 text-left">Equilibrio</th>
                <th className="py-2 px-4 text-left">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {sheets.map(s => (
                <tr key={s.id} className="border-b">
                  <td className="py-2 px-4">{s.student}</td>
                  <td className="py-2 px-4">{s.entrenador}</td>
                  <td className="py-2 px-4">{s.fecha}</td>
                  <td className="py-2 px-4">{s.postura}</td>
                  <td className="py-2 px-4">{s.remada}</td>
                  <td className="py-2 px-4">{s.equilibrio}</td>
                  <td className="py-2 px-4">{s.observaciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  <div className="bg-white rounded-xl shadow p-6 mb-8" data-aos="fade-right">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Evolución Técnica (Mock)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sheets.map(s => ({ fecha: s.fecha, postura: s.postura, remada: s.remada, equilibrio: s.equilibrio }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="postura" stroke="#8b5cf6" name="Postura" />
              <Line type="monotone" dataKey="remada" stroke="#2563eb" name="Remada" />
              <Line type="monotone" dataKey="equilibrio" stroke="#22c55e" name="Equilibrio" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ProtectedRoute>
  );
}
