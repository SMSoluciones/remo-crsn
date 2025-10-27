
import { useState, useEffect } from 'react';
import ProtectedRoute from '../ProtectedRoute';
import { useAuth } from '../../context/useAuth';
import { showError, showSuccess } from '../../utils/toast';
import { fetchStudents, deleteStudent } from '../../models/Student';
import { fetchSheetsByStudent } from '../../models/TechnicalSheet';
import Avatar from 'react-avatar';
import { EllipsisVerticalIcon, UserIcon, PlusIcon } from '@heroicons/react/24/outline';
import AddStudentModal from './AddStudentModal';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function Students() {

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [selected, setSelected] = useState('s1');
  const [search, setSearch] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [openMenuFor, setOpenMenuFor] = useState(null);
  const [sheets, setSheets] = useState({}); // { studentId: [fichas...] }
  const [form, setForm] = useState({ fecha: '', entrenador: '', postura: 5, remada: 5, equilibrio: 5, coordinacion: 5, resistencia: 5, velocidad: 5, observaciones: '' });
  const [showAddStudent, setShowAddStudent] = useState(false);

  // Filtrado por nombre
  const filtered = students.filter(s =>
    (`${s.nombre} ${s.apellido}`.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchStudents()
      .then(data => {
        if (!mounted) return;
        // API might return items with _id — normalize to id
        const normalized = data.map(s => ({ id: s._id || s.id || s.dni, ...s }));
        setStudents(normalized);
      })
      .catch(err => {
        console.error('Error cargando alumnos:', err);
        showError('No se pudieron cargar los alumnos desde el servidor.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false };
  }, []);

  const selectedStudent = students.find(s => s.id === selected);
  const studentSheets = sheets[selected] || [];

  // Abrir perfil
  const handleOpenProfile = (id) => {
    // Sólo entrenador o admin pueden abrir perfiles
    if (!user || (user.rol !== 'admin' && user.rol !== 'entrenador')) {
      showError('No tienes permisos para ver el perfil del alumno.');
      return;
    }
    // fetch sheets for this student (pass user so headers are included)
    fetchSheetsByStudent(id, user).then(data => {
      setSheets(prev => ({ ...prev, [id]: data }));
      setSelected(id);
      setShowProfile(true);
    }).catch(err => {
      console.error('Error fetching sheets for student', err);
      showError('No se pudieron cargar las fichas del alumno.');
    });
  };

  const handleDeleteStudent = async (id) => {
    try {
      await deleteStudent(id);
      setStudents(prev => prev.filter(s => (s.id || s._id) !== id));
      showSuccess('Alumno eliminado');
      if (selected === id) {
        setShowProfile(false);
      }
    } catch (err) {
      console.error('Error eliminando alumno:', err);
      showError('No se pudo eliminar el alumno');
    }
  };

  // Agregar ficha técnica (POST al backend)
  const handleAddSheet = async (e) => {
    e.preventDefault();
    if (!user || (user.rol !== 'admin' && user.rol !== 'entrenador')) {
      showError('No tiene permisos para crear fichas técnicas');
      return;
    }
    try {
      const payload = { ...form, fecha: form.fecha || new Date().toISOString().slice(0,10), studentId: selected };
  const { createSheet } = await import('../../models/TechnicalSheet');
  // ensure entrenadorId fallback uses _id when available
  if (!payload.entrenadorId && user) payload.entrenadorId = user._id || user.id;
  const created = await createSheet(payload, user);
      setSheets(prev => ({ ...prev, [selected]: [...(prev[selected] || []), created] }));
  setForm({ fecha: '', entrenador: '', postura: 5, remada: 5, equilibrio: 5, coordinacion: 5, resistencia: 5, velocidad: 5, observaciones: '' });
  showSuccess('Ficha técnica creada correctamente');
    } catch (err) {
      console.error('Error creando ficha:', err);
      showError('No se pudo crear la ficha técnica');
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
          <aside className="w-20 bg-white border-r flex flex-col items-center py-8 gap-8">
          <UserIcon className="h-7 w-7 text-gray-400" />
          {user?.rol === 'admin' ? (
            <button onClick={() => setShowAddStudent(true)} className="bg-black rounded-full p-2 hover:bg-gray-800 transition">
              <PlusIcon className="h-6 w-6 text-white" />
            </button>
          ) : (
            <button className="bg-gray-200 rounded-full p-2 cursor-not-allowed" title="Solo administradores"> 
              <PlusIcon className="h-6 w-6 text-gray-400" />
            </button>
          )}
        </aside>
        {/* Main content */}
        <div className="flex-1 flex flex-col px-12 py-10">
          {!showProfile ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Team</h2>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-700">Club Regatas San Nicolás</span>
                  <img src="/vite.svg" alt="logo" className="h-8 w-8" />
                </div>
              </div>
              <div className="mb-8">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar alumno"
                  className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring focus:ring-green-200 bg-gray-100"
                />
              </div>
              {loading ? (
                <div className="text-center text-gray-500 py-8">Cargando alumnos...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filtered.map(s => (
                  <div
                    key={s.id}
                    className={`relative rounded-xl shadow flex items-center gap-4 px-6 py-5 cursor-pointer transition-all ${selected === s.id ? 'bg-black' : 'bg-white hover:bg-gray-100'}`}
                    onClick={() => handleOpenProfile(s.id)}
                  >
                    <Avatar name={`${s.nombre} ${s.apellido}`} size="48" round={true} />
                    <div>
                      <div className={`font-semibold text-lg ${selected === s.id ? 'text-white' : 'text-gray-900'}`}>{s.nombre} {s.apellido}</div>
                      <div className={`text-sm ${selected === s.id ? 'text-gray-200' : 'text-gray-500'}`}>{s.categoria}</div>
                    </div>
                    <div className="absolute top-4 right-4">
                      <button onClick={(e) => { e.stopPropagation(); setOpenMenuFor(openMenuFor === s.id ? null : s.id); }} className="p-1 rounded hover:bg-gray-100">
                        <EllipsisVerticalIcon className={`h-5 w-5 ${selected === s.id ? 'text-white' : 'text-gray-400'}`} />
                      </button>
                      {openMenuFor === s.id && (
                        <div className="mt-2 w-40 bg-white border rounded shadow-lg text-sm right-0 absolute">
                          <ul>
                            {user?.rol === 'admin' && (
                              <li>
                                <button onClick={(ev) => { ev.stopPropagation(); if (!window.confirm('¿Seguro que desea eliminar este alumno?')) { setOpenMenuFor(null); return; } handleDeleteStudent(s.id); setOpenMenuFor(null); }} className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600">Eliminar</button>
                              </li>
                            )}
                            <li>
                              <button onClick={(ev) => { ev.stopPropagation(); setOpenMenuFor(null); }} className="w-full text-left px-3 py-2 hover:bg-gray-100">Cancelar</button>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                  </div>
                )}
            </>
          ) : (
            <div className="max-w-3xl mx-auto">
              <button className="mb-6 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onClick={() => setShowProfile(false)}>Volver</button>
              {!selectedStudent ? (
                <div className="bg-white rounded-xl shadow p-8 mb-8 text-gray-700">Alumno no encontrado.</div>
              ) : (
                <div className="bg-white rounded-xl shadow p-8 mb-8 flex gap-8 items-center">
                  <Avatar name={`${selectedStudent.nombre} ${selectedStudent.apellido}`} size="80" round={true} />
                  <div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">{selectedStudent.nombre} {selectedStudent.apellido}</div>
                    <div className="text-gray-700 mb-1">DNI: {selectedStudent.dni}</div>
                    <div className="text-gray-700 mb-1">Edad: {selectedStudent.nacimiento}</div>
                    <div className="text-gray-700 mb-1">Categoría: {selectedStudent.categoria}</div>
                    <div className="text-gray-700 mb-1">Email: {selectedStudent.email}</div>
                    <div className="text-gray-700 mb-1">Domicilio: {selectedStudent.domicilio}</div>
                    <div className="text-gray-700 mb-1">Celular: {selectedStudent.celular}</div>
                  </div>
                </div>
              )}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Histórico de Fichas Técnicas</h3>
                {/* Gráfico de evolución de promedios */}
                {studentSheets.length > 0 && (
                  <div className="bg-white rounded-xl shadow p-6 mb-6">
                    <h4 className="text-lg font-bold mb-2 text-gray-700">Evolución de Promedios</h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={studentSheets.map((sheet) => {
                        const puntajes = [sheet.postura, sheet.remada, sheet.equilibrio, sheet.coordinacion, sheet.resistencia, sheet.velocidad];
                        return {
                          fecha: sheet.fecha,
                          promedio: (puntajes.reduce((a, b) => a + b, 0) / puntajes.length).toFixed(2),
                          postura: sheet.postura,
                          remada: sheet.remada,
                          equilibrio: sheet.equilibrio,
                          coordinacion: sheet.coordinacion,
                          resistencia: sheet.resistencia,
                          velocidad: sheet.velocidad,
                        };
                      })}>
                        <XAxis dataKey="fecha" stroke="#888" fontSize={12} />
                        <YAxis domain={[0, 10]} stroke="#888" fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="promedio" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} name="Promedio" />
                        <Line type="monotone" dataKey="postura" stroke="#6366f1" strokeWidth={2} dot={false} name="Postura" />
                        <Line type="monotone" dataKey="remada" stroke="#f59e42" strokeWidth={2} dot={false} name="Remada" />
                        <Line type="monotone" dataKey="equilibrio" stroke="#06b6d4" strokeWidth={2} dot={false} name="Equilibrio" />
                        <Line type="monotone" dataKey="coordinacion" stroke="#eab308" strokeWidth={2} dot={false} name="Coordinación" />
                        <Line type="monotone" dataKey="resistencia" stroke="#ef4444" strokeWidth={2} dot={false} name="Resistencia" />
                        <Line type="monotone" dataKey="velocidad" stroke="#10b981" strokeWidth={2} dot={false} name="Velocidad" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="space-y-6">
                  {studentSheets.length === 0 ? (
                    <div className="text-gray-500">No hay fichas técnicas registradas.</div>
                  ) : (
                    studentSheets.map((sheet, idx) => {
                      const puntajes = [sheet.postura, sheet.remada, sheet.equilibrio, sheet.coordinacion, sheet.resistencia, sheet.velocidad];
                      const promedio = (puntajes.reduce((a, b) => a + b, 0) / puntajes.length).toFixed(1);
                      return (
                        <div key={idx} className="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-4 border-l-4" style={{ borderColor: promedio >= 8 ? '#22c55e' : promedio >= 6 ? '#facc15' : '#ef4444' }}>
                          <div className="flex gap-6 items-center mb-2">
                            <span className="font-bold text-gray-700 text-lg">{sheet.fecha}</span>
                            <span className="text-gray-500">Entrenador: <span className="font-semibold text-gray-700">{sheet.entrenador}</span></span>
                            <span className={`ml-auto px-3 py-1 rounded-full text-white font-bold text-sm ${promedio >= 8 ? 'bg-green-600' : promedio >= 6 ? 'bg-yellow-500' : 'bg-red-500'}`}>Promedio: {promedio}</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${sheet.postura >= 8 ? 'bg-green-100 text-green-700' : sheet.postura >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>Postura: {sheet.postura}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${sheet.remada >= 8 ? 'bg-green-100 text-green-700' : sheet.remada >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>Remada: {sheet.remada}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${sheet.equilibrio >= 8 ? 'bg-green-100 text-green-700' : sheet.equilibrio >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>Equilibrio: {sheet.equilibrio}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${sheet.coordinacion >= 8 ? 'bg-green-100 text-green-700' : sheet.coordinacion >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>Coordinación: {sheet.coordinacion}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${sheet.resistencia >= 8 ? 'bg-green-100 text-green-700' : sheet.resistencia >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>Resistencia: {sheet.resistencia}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${sheet.velocidad >= 8 ? 'bg-green-100 text-green-700' : sheet.velocidad >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>Velocidad: {sheet.velocidad}</span>
                            </div>
                          </div>
                          <div className="text-gray-700 mt-2"><span className="font-semibold">Observaciones:</span> {sheet.observaciones}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Agregar Ficha Técnica</h3>
                <form onSubmit={handleAddSheet} className="bg-white rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                    required
                    className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
                  />
                  <input
                    value={form.entrenador}
                    onChange={e => setForm(f => ({ ...f, entrenador: e.target.value }))}
                    placeholder="Entrenador responsable"
                    required
                    className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
                  />
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.postura}
                    onChange={e => setForm(f => ({ ...f, postura: Number(e.target.value) }))}
                    placeholder="Postura (1-10)"
                    required
                    className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
                  />
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.remada}
                    onChange={e => setForm(f => ({ ...f, remada: Number(e.target.value) }))}
                    placeholder="Remada (1-10)"
                    required
                    className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
                  />
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.equilibrio}
                    onChange={e => setForm(f => ({ ...f, equilibrio: Number(e.target.value) }))}
                    placeholder="Equilibrio (1-10)"
                    required
                    className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
                  />
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.coordinacion}
                    onChange={e => setForm(f => ({ ...f, coordinacion: Number(e.target.value) }))}
                    placeholder="Coordinación (1-10)"
                    required
                    className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
                  />
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.resistencia}
                    onChange={e => setForm(f => ({ ...f, resistencia: Number(e.target.value) }))}
                    placeholder="Resistencia (1-10)"
                    required
                    className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
                  />
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.velocidad}
                    onChange={e => setForm(f => ({ ...f, velocidad: Number(e.target.value) }))}
                    placeholder="Velocidad (1-10)"
                    required
                    className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
                  />
                  <textarea
                    value={form.observaciones}
                    onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                    placeholder="Observaciones"
                    className="border rounded px-3 py-2 focus:outline-none focus:ring w-full col-span-1 md:col-span-3"
                  />
                  <button type="submit" className="bg-green-700 text-white rounded px-4 py-2 hover:bg-green-800 transition col-span-1 md:col-span-3">Guardar ficha</button>
                </form>
              </div>
            </div>
          )}
        </div>
        <button className="fixed bottom-8 right-8 bg-black rounded-full p-4 shadow-lg hover:bg-gray-800 transition z-50">
          <EllipsisVerticalIcon className="h-6 w-6 text-white" />
        </button>
          <AddStudentModal open={showAddStudent} onClose={() => setShowAddStudent(false)} onCreated={(created) => {
            // Normalizar id y agregar al listado
            const normalized = { id: created._id || created.id || created.dni, ...created };
            setStudents(prev => [normalized, ...prev]);
            setShowAddStudent(false);
          }} />
      </div>
    </ProtectedRoute>
  );
}
