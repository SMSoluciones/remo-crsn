import { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { showError, showSuccess } from '../../utils/toast';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchAllSheets, createSheet } from '../../models/TechnicalSheet';
import { fetchStudents } from '../../models/Student';
import { fetchTrainers } from '../../models/User';
import { API_BASE_URL } from '../../utils/apiConfig';

export default function TechnicalSheets() {
  const { user } = useAuth();
  const getStoredUser = () => {
    try {
      const raw = localStorage.getItem('auth_user');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };
  const [sheets, setSheets] = useState([]);
  const [students, setStudents] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ studentId: '', entrenadorId: '', fecha: '', postura: 5, remada: 5, equilibrio: 5, observaciones: '' });
  const [filter, setFilter] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);

  const effectiveUser = user || getStoredUser();
  const role = (effectiveUser?.rol || '').toLowerCase();

    async function loadData() {
      try {
        const shouldLoadSheets = !!(effectiveUser && ['admin', 'entrenador'].includes(role));
        const [studentsData, trainersData, sheetsDataOrNull] = await Promise.all([
          fetchStudents().then(sd => (sd || []).map(s => ({ id: s._id || s.id || s.dni, nombre: s.nombre, apellido: s.apellido, dni: s.dni }))).catch(err => { console.error('Error cargando alumnos:', err); showError('No se pudieron cargar los alumnos.'); return []; }),
          fetchTrainers().catch(err => { console.error('Error cargando entrenadores:', err); return []; }),
          shouldLoadSheets ? fetchAllSheets({ ...(effectiveUser || {}), rol: role }).catch(err => { console.error('Error cargando fichas:', err); return []; }) : Promise.resolve(null),
        ]);
        if (!mounted) return;
        setStudents(studentsData || []);
        setTrainers(trainersData || []);
        
  const sheetsData = sheetsDataOrNull || [];
  if (sheetsDataOrNull !== null) {
  const normalized = (sheetsData || []).map(s => {
          const studentFromSheet = s.studentId && (s.studentId.nombre || s.studentId.apellido) ? `${s.studentId.nombre || ''} ${s.studentId.apellido || ''}`.trim() : null;
          const trainerFromSheet = s.entrenadorId && (s.entrenadorId.nombre || s.entrenadorId.apellido) ? `${s.entrenadorId.nombre || ''} ${s.entrenadorId.apellido || ''}`.trim() : null;
          let studentResolved = studentFromSheet;
          if (!studentResolved && s.studentId) {
            const sId = s.studentId._id || s.studentId;
            const found = (studentsData || []).find(st => (st._id === sId) || (st.id === sId) || (st.dni === sId));
            if (found) studentResolved = `${found.nombre} ${found.apellido}`.trim();
          }
          let entrenadorResolved = trainerFromSheet;
          if (!entrenadorResolved && s.entrenadorId) {
            const tId = s.entrenadorId._id || s.entrenadorId;
            const foundT = (trainersData || []).find(t => (t._id === tId) || (t.id === tId) || (t.email === tId));
            if (foundT) entrenadorResolved = `${foundT.nombre} ${foundT.apellido}`.trim();
          }
          return { ...s, studentResolved, entrenadorResolved };
        });
  setSheets(normalized);
  }
      } finally {
        if (mounted) setLoading(false);
      }
    }

  loadData();

  return () => { mounted = false };
  }, [user]);

  const handleReload = async () => {
    setReloading(true);
    const effectiveUser = user || getStoredUser();
    const role = (effectiveUser?.rol || '').toLowerCase();
    if (!effectiveUser || !['admin', 'entrenador'].includes(role)) {
      setReloading(false);
      showError('No hay usuario autenticado con permisos para recargar fichas');
      return;
    }
    
    try {
      const [studentsData, trainersData, sheetsData] = await Promise.all([
        fetchStudents().then(sd => (sd || []).map(s => ({ id: s._id || s.id || s.dni, nombre: s.nombre, apellido: s.apellido, dni: s.dni }))).catch(() => []),
        fetchTrainers().catch(() => []),
        fetchAllSheets({ ...(effectiveUser || {}), rol: role }).catch(() => []),
      ]);
      setStudents(studentsData || []);
      setTrainers(trainersData || []);
      const normalized = (sheetsData || []).map(s => {
        const studentFromSheet = s.studentId && (s.studentId.nombre || s.studentId.apellido) ? `${s.studentId.nombre || ''} ${s.studentId.apellido || ''}`.trim() : null;
        const trainerFromSheet = s.entrenadorId && (s.entrenadorId.nombre || s.entrenadorId.apellido) ? `${s.entrenadorId.nombre || ''} ${s.entrenadorId.apellido || ''}`.trim() : null;
        let studentResolved = studentFromSheet;
        if (!studentResolved && s.studentId) {
          const sId = s.studentId._id || s.studentId;
          const found = (studentsData || []).find(st => (st._id === sId) || (st.id === sId) || (st.dni === sId));
          if (found) studentResolved = `${found.nombre} ${found.apellido}`.trim();
        }
        let entrenadorResolved = trainerFromSheet;
        if (!entrenadorResolved && s.entrenadorId) {
          const tId = s.entrenadorId._id || s.entrenadorId;
          const foundT = (trainersData || []).find(t => (t._id === tId) || (t.id === tId) || (t.email === tId));
          if (foundT) entrenadorResolved = `${foundT.nombre} ${foundT.apellido}`.trim();
        }
        return { ...s, studentResolved, entrenadorResolved };
      });
      setSheets(normalized);
  showSuccess(`Fichas recargadas: ${(sheetsData || []).length}`);
    } catch (err) {
      console.error('Error al recargar fichas:', err);
      showError('Error al recargar fichas');
    } finally {
      setReloading(false);
    }
  };

  const handleAddSheet = async (e) => {
    e.preventDefault();
    if (!user || !['admin', 'entrenador'].includes(user.rol)) {
      showError('No tiene permisos para agregar fichas técnicas');
      return;
    }
    if (!form.studentId) { showError('Seleccione un alumno'); return; }
    try {
      const payload = { ...form };
  if (!payload.entrenadorId && user) payload.entrenadorId = user._id || user.id;
  const created = await createSheet(payload, user);
  setSheets(prev => [created, ...prev]);
  setForm({ studentId: '', entrenadorId: '', fecha: '', postura: 5, remada: 5, equilibrio: 5, observaciones: '' });
      setShowForm(false);
      showSuccess('Ficha técnica creada');
    } catch (err) {
      console.error('Error creando ficha técnica:', err);
      showError('No se pudo crear la ficha técnica');
    }
  };

  const handleDeleteSheet = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta ficha técnica?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/technical-sheets/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || user?._id || '',
          'x-user-role': user?.rol || '',
        },
      });
      if (!res.ok) throw new Error('Error eliminando ficha técnica del servidor');

      setSheets(prev => prev.filter(sheet => sheet._id !== id));
      showSuccess('Ficha técnica eliminada');
    } catch (err) {
      console.error('Error eliminando ficha técnica:', err);
      showError('No se pudo eliminar la ficha técnica');
    }
  };

  const normalizedFilter = (filter || '').toString().trim();
  const filteredSheets = (normalizedFilter === '') ? sheets : sheets.filter(sheet => {
    const studentName = (sheet.studentId?.nombre || '').toString().toLowerCase();
    const studentLastName = (sheet.studentId?.apellido || '').toString().toLowerCase();
    let date = '';
    try {
      date = new Date(sheet.fecha).toLocaleDateString();
    } catch {
      date = '';
    }
    const f = normalizedFilter.toLowerCase();
    return (
      studentName.includes(f) ||
      studentLastName.includes(f) ||
      date.includes(f)
    );
  });

  

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="flex items-center gap-2 mb-6">
        <ChartBarIcon className="h-7 w-7 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-800">Fichas Técnicas</h2>
      </div>
      {user && ['admin', 'entrenador'].includes((user.rol || '').toLowerCase()) && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
          >
            {showForm ? 'Cancelar' : 'Nueva Ficha Técnica'}
          </button>
          <button
            onClick={handleReload}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition flex items-center gap-2"
            title="Forzar recarga de fichas"
          >
            {reloading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z"></path></svg>
                <span>Recargando...</span>
              </>
            ) : (
              'Recargar fichas'
            )}
          </button>
        </div>
      )}

      {showForm && (
  <form onSubmit={handleAddSheet} className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-7 gap-4">
          <select
            value={form.studentId}
            onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
            required
            className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
          >
            <option value="">Seleccione alumno</option>
            {students.map(s => (<option key={s.id} value={s.id}>{s.nombre} {s.apellido} ({s.dni})</option>))}
          </select>
          <select
            value={form.entrenadorId}
            onChange={e => setForm(f => ({ ...f, entrenadorId: e.target.value }))}
            required
            className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
          >
            <option value="">Seleccione entrenador</option>
            {trainers.map(t => (<option key={t._id || t.id} value={t._id || t.id}>{t.nombre} {t.apellido} ({t.email})</option>))}
          </select>
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

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre o fecha"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
        />
      </div>
      
      {loading ? (
        <div className="text-center text-gray-500 py-8">Cargando fichas y alumnos...</div>
  ) : (
  <div className="overflow-x-auto mb-8">
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
                <th className="py-2 px-4 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredSheets.map(s => (
                <tr key={s._id || s.id} className="border-b">
                  <td className="py-2 px-4">{s.studentResolved || (s.studentId && (s.studentId.nombre ? `${s.studentId.nombre} ${s.studentId.apellido}` : s.studentId)) || s.student || ''}</td>
                  <td className="py-2 px-4">{s.entrenadorResolved || s.entrenador || (s.entrenadorId && s.entrenadorId.nombre) || ''}</td>
                  <td className="py-2 px-4">{new Date(s.fecha).toLocaleDateString()}</td>
                  <td className="py-2 px-4">{s.postura}</td>
                  <td className="py-2 px-4">{s.remada}</td>
                  <td className="py-2 px-4">{s.equilibrio}</td>
                  <td className="py-2 px-4">{s.observaciones}</td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => handleDeleteSheet(s._id || s.id)}
                      className="text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

  <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Evolución Técnica</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sheets.map(s => ({ fecha: new Date(s.fecha).toLocaleDateString(), postura: s.postura, remada: s.remada, equilibrio: s.equilibrio }))}>
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
  );
}
