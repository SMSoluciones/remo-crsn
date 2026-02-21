import { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { showError, showSuccess } from '../../utils/toast';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchAllSheets, createSheet } from '../../models/TechnicalSheet';
import { fetchStudents } from '../../models/Student';
import { fetchTrainers } from '../../models/User';
import { API_BASE_URL } from '../../utils/apiConfig';
import BeatLoader from 'react-spinners/BeatLoader';

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
  const [form, setForm] = useState({ studentId: '', entrenadorId: '', fecha: '', observaciones: '', prueba: '', peso: '', categoria: '', picoWatts: '', promedioFinalWatts: '', tiempoFinal: '', rpm: '', parcial500: '', parcial1000: '', parcial1500: '', parcial2000: '' });
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    let mounted = true;
    setLoading(true);

  const effectiveUser = user || getStoredUser();
  const role = String(effectiveUser?.rol || '').trim().toLowerCase();

    async function loadData() {
      try {
        const shouldLoadSheets = !!(effectiveUser && ['admin', 'entrenador'].includes(role));
        const [studentsData, trainersData, sheetsDataOrNull] = await Promise.all([
          fetchStudents().then(sd => (sd || []).map(s => ({ _id: s._id, id: s._id, nombre: s.nombre, apellido: s.apellido, dni: s.dni }))).catch(err => { console.error('Error cargando alumnos:', err); showError('No se pudieron cargar los alumnos.'); return []; }),
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
    const role = String(effectiveUser?.rol || '').trim().toLowerCase();
    if (!effectiveUser || !['admin', 'entrenador'].includes(role)) {
      setReloading(false);
      showError('No hay usuario autenticado con permisos para recargar fichas');
      return;
    }
    
    try {
        const [studentsData, trainersData, sheetsData] = await Promise.all([
        fetchStudents().then(sd => (sd || []).map(s => ({ _id: s._id, id: s._id, nombre: s.nombre, apellido: s.apellido, dni: s.dni }))).catch(() => []),
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
      // parse numeric fields
      if (payload.peso) payload.peso = Number(payload.peso);
      if (payload.picoWatts) payload.picoWatts = Number(payload.picoWatts);
      if (payload.promedioFinalWatts) payload.promedioFinalWatts = Number(payload.promedioFinalWatts);
      if (payload.rpm) payload.rpm = Number(payload.rpm);
      // include entrenador if missing
      if (!payload.entrenadorId && user) payload.entrenadorId = user._id || user.id;
      // build tests array according to selected prueba
      const tests = [];
      const p = String(payload.prueba || '').trim();
      if (p === '100') {
        if (payload.promedioFinalWatts) payload.promedioFinalWatts = Number(payload.promedioFinalWatts);
        if (payload.picoWatts) payload.picoWatts = Number(payload.picoWatts);
        tests.push({ distance: 100, tiempo: payload.tiempoFinal || '', promedioWatts: payload.promedioFinalWatts || undefined, picoWatts: payload.picoWatts || undefined });
      } else if (p === '500') {
        if (payload.promedioFinalWatts) payload.promedioFinalWatts = Number(payload.promedioFinalWatts);
        if (payload.rpm) payload.rpm = Number(payload.rpm);
        tests.push({ distance: 500, tiempo: payload.tiempoFinal || '', promedioWatts: payload.promedioFinalWatts || undefined, rpm: payload.rpm || undefined });
      } else if (p === '2000') {
        if (payload.promedioFinalWatts) payload.promedioFinalWatts = Number(payload.promedioFinalWatts);
        if (payload.rpm) payload.rpm = Number(payload.rpm);
        tests.push({ distance: 2000, tiempo: payload.tiempoFinal || '', promedioWatts: payload.promedioFinalWatts || undefined, rpm: payload.rpm || undefined, parcial500: payload.parcial500 || undefined, parcial1000: payload.parcial1000 || undefined, parcial1500: payload.parcial1500 || undefined, parcial2000: payload.parcial2000 || undefined });
      }
      if (tests.length) payload.tests = tests;

  const created = await createSheet(payload, user);
  setSheets(prev => [created, ...prev]);
  setForm({ studentId: '', entrenadorId: '', fecha: '', observaciones: '', prueba: '', peso: '', categoria: '', picoWatts: '', promedioFinalWatts: '', tiempoFinal: '', rpm: '', parcial500: '', parcial1000: '', parcial1500: '', parcial2000: '' });
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

  const paginatedSheets = filteredSheets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredSheets.length / itemsPerPage);

  const parseTimeToSeconds = (t) => {
    if (!t && t !== 0) return undefined;
    try {
      const s = String(t).trim();
      if (!s) return undefined;
      // formats: MM:SS.s, M:SS, SS.s
      const parts = s.split(':').map(p => p.trim());
      if (parts.length === 1) {
        return Number(parts[0]) || undefined;
      }
      const minutes = Number(parts[0]) || 0;
      const sec = Number(parts[1]) || 0;
      return minutes * 60 + sec;
    } catch {
      return undefined;
    }
  };

  const secondsToTime = (sec) => {
    if (sec === undefined || sec === null || Number.isNaN(sec)) return '';
    const minutes = Math.floor(sec / 60);
    const seconds = (sec - minutes * 60).toFixed(1);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const chartData = (sheets || []).map(s => {
    const base = { fecha: new Date(s.fecha).toLocaleDateString() };
    (s.tests || []).forEach(t => {
      const secs = parseTimeToSeconds(t.tiempo || t.tiempoFinal || '');
      if (secs !== undefined) base[`t${t.distance}`] = secs;
    });
    return base;
  });

  return (
    <div className="bg-gray-50 min-h-screen px-4 sm:px-8 py-6 sm:py-8 max-w-xs sm:max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <ChartBarIcon className="h-7 w-7 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-800">Fichas Técnicas</h2>
      </div>
      {user && ['admin', 'entrenador'].includes((user.rol || '').toLowerCase()) && (
        <div className="flex flex-col sm:flex-row items-center gap-2 mb-4 w-full">
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
          >
            {showForm ? 'Cancelar' : 'Nueva Ficha Técnica'}
          </button>
          <button
            onClick={handleReload}
            className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition flex items-center gap-2 justify-center"
            title="Forzar recarga de fichas"
          >
            {reloading ? (
                <div className="flex items-center gap-2"><BeatLoader size={6} color="#6B7280" /><span className="text-sm text-gray-700">Recargando...</span></div>
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
          <select value={form.prueba} onChange={e => setForm(f => ({ ...f, prueba: e.target.value }))} className="border rounded px-3 py-2 w-full">
            <option value="">Seleccione prueba</option>
            <option value="100">100 metros</option>
            <option value="500">500 metros</option>
            <option value="2000">2000 metros</option>
          </select>
          <input value={form.peso} onChange={e => setForm(f => ({ ...f, peso: e.target.value }))} placeholder="Peso (kg)" className="border rounded px-3 py-2 w-full" />
          <input value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} placeholder="Categoría" className="border rounded px-3 py-2 w-full" />

          {/* Campos condicionales según prueba */}
          {form.prueba === '100' && (
            <>
              <input value={form.picoWatts} onChange={e => setForm(f => ({ ...f, picoWatts: e.target.value }))} placeholder="Pico Watts" className="border rounded px-3 py-2 w-full" />
              <input value={form.promedioFinalWatts} onChange={e => setForm(f => ({ ...f, promedioFinalWatts: e.target.value }))} placeholder="Promedio final Watts" className="border rounded px-3 py-2 w-full" />
              <input value={form.tiempoFinal} onChange={e => setForm(f => ({ ...f, tiempoFinal: e.target.value }))} placeholder="Tiempo final (MM:SS.s)" className="border rounded px-3 py-2 w-full" />
            </>
          )}
          {form.prueba === '500' && (
            <>
              <input value={form.rpm} onChange={e => setForm(f => ({ ...f, rpm: e.target.value }))} placeholder="RPM" className="border rounded px-3 py-2 w-full" />
              <input value={form.promedioFinalWatts} onChange={e => setForm(f => ({ ...f, promedioFinalWatts: e.target.value }))} placeholder="Promedio final Watts" className="border rounded px-3 py-2 w-full" />
              <input value={form.tiempoFinal} onChange={e => setForm(f => ({ ...f, tiempoFinal: e.target.value }))} placeholder="Tiempo final (MM:SS.s)" className="border rounded px-3 py-2 w-full" />
            </>
          )}
          {form.prueba === '2000' && (
            <>
              <input value={form.rpm} onChange={e => setForm(f => ({ ...f, rpm: e.target.value }))} placeholder="RPM" className="border rounded px-3 py-2 w-full" />
              <input value={form.promedioFinalWatts} onChange={e => setForm(f => ({ ...f, promedioFinalWatts: e.target.value }))} placeholder="Promedio final Watts" className="border rounded px-3 py-2 w-full" />
              <input value={form.tiempoFinal} onChange={e => setForm(f => ({ ...f, tiempoFinal: e.target.value }))} placeholder="Tiempo final (MM:SS.s)" className="border rounded px-3 py-2 w-full" />
              <input value={form.parcial500} onChange={e => setForm(f => ({ ...f, parcial500: e.target.value }))} placeholder="Parcial 500 (MM:SS.s)" className="border rounded px-3 py-2 w-full" />
              <input value={form.parcial1000} onChange={e => setForm(f => ({ ...f, parcial1000: e.target.value }))} placeholder="Parcial 1000 (MM:SS.s)" className="border rounded px-3 py-2 w-full" />
              <input value={form.parcial1500} onChange={e => setForm(f => ({ ...f, parcial1500: e.target.value }))} placeholder="Parcial 1500 (MM:SS.s)" className="border rounded px-3 py-2 w-full" />
              <input value={form.parcial2000} onChange={e => setForm(f => ({ ...f, parcial2000: e.target.value }))} placeholder="Parcial 2000 (MM:SS.s)" className="border rounded px-3 py-2 w-full" />
            </>
          )}
          
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
        <div className="flex items-center justify-center py-8"><BeatLoader color="#1E40AF" /></div>
      ) : (
  <div className="mb-8">
        {/* Mobile: cards */}
        <div className="space-y-4 sm:hidden">
          {paginatedSheets.map(s => (
            <div key={s._id || s.id} className="bg-white rounded-xl shadow p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-base text-gray-800">{s.studentResolved || (s.studentId && (s.studentId.nombre ? `${s.studentId.nombre} ${s.studentId.apellido}` : s.studentId)) || s.student || ''}</div>
                  <div className="text-sm text-gray-600">{s.entrenadorResolved || s.entrenador || ''}</div>
                  <div className="text-sm text-gray-500 mt-2">{new Date(s.fecha).toLocaleDateString()}</div>
                  {(s.tests || []).length ? (
                    <div className="mt-2">
                      {(s.tests || []).map((t, idx) => (
                        <div key={idx} className="inline-block mr-2">
                          <span className={
                            `inline-block px-2 py-1 rounded text-sm ` +
                            (t.distance === 100 ? 'bg-yellow-100 text-yellow-800' : t.distance === 500 ? 'bg-orange-100 text-orange-800' : t.distance === 2000 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')
                          }>{t.distance}m: {t.tiempo || t.tiempoFinal || '-'}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="text-right">
                  <button onClick={() => handleDeleteSheet(s._id || s.id)} className="text-red-600 text-sm">Eliminar</button>
                </div>
              </div>
              
              {s.observaciones && <div className="mt-3 text-sm text-gray-600">{s.observaciones}</div>}
            </div>
          ))}
        </div>

        {/* Desktop: table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full bg-white rounded-xl shadow">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-2 px-4 text-left">Alumno</th>
                <th className="py-2 px-4 text-left">Entrenador</th>
                <th className="py-2 px-4 text-left">Fecha</th>
                
                <th className="py-2 px-4 text-left">Tiempo final</th>
                <th className="py-2 px-4 text-left">Observaciones</th>
                <th className="py-2 px-4 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSheets.map(s => (
                <tr key={s._id || s.id} className="border-b">
                  <td className="py-2 px-4">{s.studentResolved || (s.studentId && (s.studentId.nombre ? `${s.studentId.nombre} ${s.studentId.apellido}` : s.studentId)) || s.student || ''}</td>
                  <td className="py-2 px-4">{s.entrenadorResolved || s.entrenador || (s.entrenadorId && s.entrenadorId.nombre) || ''}</td>
                  <td className="py-2 px-4">{new Date(s.fecha).toLocaleDateString()}</td>
                  <td className="py-2 px-4">
                    {(s.tests || []).length ? (
                      (s.tests || []).map((t, idx) => (
                        <div key={idx} className="mb-1">
                          <span className={
                            `inline-block px-2 py-1 rounded text-sm ` +
                            (t.distance === 100 ? 'bg-yellow-100 text-yellow-800' : t.distance === 500 ? 'bg-orange-100 text-orange-800' : t.distance === 2000 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')
                          }>{t.distance}m: {t.tiempo || t.tiempoFinal || '-'}</span>
                        </div>
                      ))
                    ) : '-'}
                  </td>
                  
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
      </div>
      )}

  <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition disabled:opacity-50"
        >
          Anterior
        </button>
        <span>Página {currentPage} de {totalPages}</span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Evolución Técnica</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis tickFormatter={(v) => secondsToTime(v)} />
            <Tooltip formatter={(value, name) => [secondsToTime(value), name]} />
            <Legend />
            <Line type="monotone" dataKey="t100" name="100m" stroke="#FACC15" dot={{ r: 4 }} strokeWidth={2} />
            <Line type="monotone" dataKey="t500" name="500m" stroke="#FB923C" dot={{ r: 4 }} strokeWidth={2} />
            <Line type="monotone" dataKey="t2000" name="2000m" stroke="#10B981" dot={{ r: 4 }} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
