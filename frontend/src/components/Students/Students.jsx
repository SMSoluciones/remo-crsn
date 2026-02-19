import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '../ProtectedRoute';
import { useAuth } from '../../context/useAuth';
import { showError, showSuccess } from '../../utils/toast';
import { fetchStudents, deleteStudent } from '../../models/Student';
import { fetchSheetsByStudent } from '../../models/TechnicalSheet';
import Avatar from 'react-avatar';
import BeatLoader from 'react-spinners/BeatLoader';
import { EllipsisVerticalIcon, UserIcon, PlusIcon } from '@heroicons/react/24/outline';
import AddStudentModal from './AddStudentModal';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const role = String(user?.rol || '').trim().toLowerCase();
  const [selected, setSelected] = useState('s1');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [openMenuFor, setOpenMenuFor] = useState(null);
  const [sheets, setSheets] = useState({}); // { studentId: [fichas...] }
  const [form, setForm] = useState({ fecha: '', entrenador: '', postura: 5, remada: 5, equilibrio: 5, coordinacion: 5, resistencia: 5, velocidad: 5, observaciones: '' });
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [openingByEmail, setOpeningByEmail] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

  // Lista de categorías disponibles (únicas)
  const categories = Array.from(new Set(students.map(s => s.categoria).filter(Boolean)));

  // Contadores por estado
  const activeCount = students.filter(s => (String(s.estado || '').toUpperCase() === 'ACTIVO')).length;
  const inactiveCount = students.filter(s => (String(s.estado || '').toUpperCase() === 'INACTIVO')).length;
  // Roles que pueden ver alumnos INACTIVOS
  const canViewInactive = ['entrenador', 'mantenimiento', 'subcomision', 'admin'].includes(role);

  // Filtrado por nombre, categoría y estado
  const filtered = students.filter(s => {
    const matchesName = (`${s.nombre} ${s.apellido}`.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = !categoryFilter || s.categoria === categoryFilter;
    const isInactive = String(s.estado || '').toUpperCase() === 'INACTIVO';
    // Ocultar alumnos inactivos a roles no autorizados
    if (isInactive && !canViewInactive) return false;
    // Si se seleccionó un filtro de estado, exigir coincidencia exacta (evita ambigüedades en responsive)
    let matchesEstado = true;
    if (estadoFilter) {
      const ef = String(estadoFilter).toUpperCase();
      matchesEstado = String(s.estado || '').toUpperCase() === ef;
    }
    return matchesName && matchesCategory && matchesEstado;
  });

  useEffect(() => {
    // Close open menus when clicking outside
    const handleDocClick = (e) => {
      try {
        if (!openMenuFor) return;
        const withinMenu = e.target.closest && (e.target.closest(`[data-menu-owner="${openMenuFor}"]`) || e.target.closest(`[data-menu-button="${openMenuFor}"]`));
        if (!withinMenu) setOpenMenuFor(null);
      } catch (err) {
        console.warn('Error handling document click for menu closing:', err);
      }
    };
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, [openMenuFor]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchStudents()
      .then(data => {
        if (!mounted) return;
        // API might return items with _id — normalize to id and guard non-array responses
        const normalized = Array.isArray(data) ? data.map(s => ({ ...s, id: s._id || s.id || s.dni })) : [];
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

  // Si se solicitó abrir un perfil (desde el botón Mi Perfil), marcar state para ocultar la lista
  useEffect(() => {
    try {
      const keyEmail = localStorage.getItem('open_student_email');
      const keyDoc = localStorage.getItem('open_student_documento');
      if (keyEmail || keyDoc) setOpeningByEmail(true);
    } catch {
      // ignore
    }
  }, []);

  const selectedStudent = students.find(s => s.id === selected);
  const studentSheets = sheets[selected] || [];
  const paginatedSheets = studentSheets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Abrir perfil
  const handleOpenProfile = useCallback(async (id) => {
    // Permitir acceso si:
    // - el usuario es admin
    // - el usuario es entrenador
    // - o el email del usuario logueado coincide con el email del estudiante (puede ver su propia ficha)
    const student = students.find(s => s.id === id);
    const isAdminOrCoach = role === 'admin' || role === 'entrenador';
    // Normalizar y comparar trimming + lowercase para evitar fallos por espacios o mayúsculas
    const userEmail = user && user.email ? String(user.email).trim().toLowerCase() : null;
    const studentEmail = student && student.email ? String(student.email).trim().toLowerCase() : null;
    const isSameEmail = userEmail && studentEmail && userEmail === studentEmail;
    if (!user || (!isAdminOrCoach && !isSameEmail)) {
      showError('No tienes permisos para ver el perfil del alumno.');
      return;
    }

    try {
      const data = await fetchSheetsByStudent(id, user);
      // Asegurar que almacenamos siempre un array
      setSheets(prev => ({ ...prev, [id]: Array.isArray(data) ? data : [] }));
      setSelected(id);
      setShowProfile(true);
    } catch (err) {
      console.error('Error fetching sheets for student', err);
      showError('No se pudieron cargar las fichas del alumno.');
    }
  }, [students, role, user]);

  // Si existe la key `open_student_email` en localStorage (pulsada desde la Sidebar),
  // buscar el alumno con ese email y abrir su ficha automáticamente.
  useEffect(() => {
    try {
      const keyEmail = localStorage.getItem('open_student_email');
      const keyDoc = localStorage.getItem('open_student_documento');
      if (!keyEmail && !keyDoc) return;
      if (keyDoc) {
        const target = String(keyDoc).trim();
        const found = students.find(s => (s.dni && String(s.dni).trim() === target) || (s.documento && String(s.documento).trim() === target));
        localStorage.removeItem('open_student_documento');
        if (found) {
          handleOpenProfile(found.id);
          setOpeningByEmail(false);
          return;
        }
        setOpeningByEmail(false);
        return;
      }
      const target = String(keyEmail).trim().toLowerCase();
      const found = students.find(s => s.email && String(s.email).trim().toLowerCase() === target);
      // limpiar la key para evitar reaperturas
      localStorage.removeItem('open_student_email');
      if (found) {
        handleOpenProfile(found.id);
        setOpeningByEmail(false);
      }
      else {
        setOpeningByEmail(false);
      }
    } catch {
      // ignore
    }
  }, [students, user, handleOpenProfile]);

  // Registrar una función global que el sidebar/app puede invocar directamente
  // para abrir el perfil del alumno relacionado con un email.
  useEffect(() => {
    window.appOpenStudentProfile = (rawId) => {
      try {
        if (!rawId) return;
        const raw = String(rawId).trim();
        // si ya tenemos la lista de students, abrir directamente (buscar por email o por documento/dni)
        if (students && students.length > 0) {
          const byEmail = students.find(s => s.email && String(s.email).trim().toLowerCase() === raw.toLowerCase());
          if (byEmail) {
            handleOpenProfile(byEmail.id);
            return;
          }
          const byDoc = students.find(s => (s.dni && String(s.dni).trim() === raw) || (s.documento && String(s.documento).trim() === raw));
          if (byDoc) {
            handleOpenProfile(byDoc.id);
            return;
          }
        }
        // si no está la lista aún, marcar pending y show loading
        window.pendingOpenStudentEmail = raw;
        setOpeningByEmail(true);
      } catch {
        // ignore
      }
    };
    return () => { window.appOpenStudentProfile = undefined; window.pendingOpenStudentEmail = undefined; };
  }, [students, handleOpenProfile]);

  // Si hubo una solicitud pendiente (appOpenStudentProfile llamada antes de que carguen students), procesarla
  useEffect(() => {
    try {
      const pending = window.pendingOpenStudentEmail;
      if (!pending) return;
      const found = students.find(s => (s.email && String(s.email).trim().toLowerCase() === String(pending).toLowerCase()) || (s.dni && String(s.dni).trim() === String(pending)) || (s.documento && String(s.documento).trim() === String(pending)));
      if (found) {
        handleOpenProfile(found.id);
        delete window.pendingOpenStudentEmail;
        setOpeningByEmail(false);
      }
    } catch {
      // ignore
    }
  }, [students, handleOpenProfile]);

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
    if (!user || !(role === 'admin' || role === 'entrenador')) {
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

  // Allow 'alumnos' to access the students view so they can see active students and their own profile.

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar: avatares para filtrar por estado */}
        <aside className="hidden sm:flex w-24 bg-white border-r flex-col items-center py-6 gap-4">
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={(e) => { e.stopPropagation(); setEstadoFilter(prev => prev === 'ACTIVO' ? '' : 'ACTIVO'); }}
              title="Activos"
              className="flex flex-col items-center gap-1 focus:outline-none"
            >
              <div className={`relative w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 ${estadoFilter === 'ACTIVO' ? 'ring-2 ring-green-400' : ''}`}>
                <UserIcon className={`h-6 w-6 ${estadoFilter === 'ACTIVO' ? 'text-green-700' : 'text-gray-500'}`} />
                {activeCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-green-600 rounded-full">
                    {activeCount}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-700">Activos</span>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); if (!canViewInactive) { showError('No tienes permisos para ver alumnos inactivos'); return; } setEstadoFilter(prev => prev === 'INACTIVO' ? '' : 'INACTIVO'); }}
              title={canViewInactive ? 'Inactivos' : 'No autorizado'}
              className={`flex flex-col items-center gap-1 focus:outline-none ${!canViewInactive ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div className={`relative w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 ${estadoFilter === 'INACTIVO' ? 'ring-2 ring-red-400' : ''}`}>
                <UserIcon className={`h-6 w-6 ${estadoFilter === 'INACTIVO' ? 'text-red-700' : 'text-gray-500'}`} />
                {inactiveCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {inactiveCount}
                  </span>
                )}
                {/* tachado: línea sobre el icono */}
                <div className="absolute left-0 right-0 top-1/2" style={{ height: 2, background: '#333', transform: 'rotate(-20deg)' }} />
              </div>
              <span className="text-xs text-gray-700">Inactivos</span>
            </button>

            {(role === 'admin' || role === 'entrenador') ? (
              <button onClick={() => setShowAddStudent(true)} className="bg-black rounded-full p-2 hover:bg-gray-800 transition mt-2">
                <PlusIcon className="h-6 w-6 text-white" />
              </button>
            ) : (
              <button className="bg-gray-200 rounded-full p-2 cursor-not-allowed mt-2" title="Solo administradores o entrenadores"> 
                <PlusIcon className="h-6 w-6 text-gray-400" />
              </button>
            )}
          </div>
        </aside>
        {/* Main content */}
        <div className="flex-1 flex flex-col px-4 sm:px-12 py-6 sm:py-10 max-w-xs sm:max-w-6xl mx-auto">
          {!showProfile ? (
            openingByEmail ? (
              <div className="flex items-center justify-center w-full py-20 text-gray-600">
                  <BeatLoader color="#16a34a" loading={true} size={12} />
                </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">Equipo</h2>
                  <div className="flex items-center gap-4">
                    <span className="hidden sm:inline-block font-semibold text-gray-700">Club Regatas San Nicolás - REMO</span>
                    <img src="/icon.svg" alt="logo" className="h-8 w-8" />
                  </div>
                </div>
                <div className="mb-8 flex flex-col sm:flex-row items-center gap-4">
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar alumno"
                    className="w-full sm:max-w-md px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring focus:ring-green-200 bg-gray-100"
                  />
                  <div className="w-full sm:w-auto">
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border rounded px-3 py-2 bg-white w-full sm:w-auto">
                      <option value="">Todas las categorías</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  {/* Botón "Nuevo Alumno" visible en móvil debajo de los filtros */}
                  <div className="w-full sm:hidden">
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-3 mb-2 sm:hidden">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEstadoFilter(prev => prev === 'ACTIVO' ? '' : 'ACTIVO'); }}
                          title="Activos"
                          className="flex items-center gap-2 focus:outline-none"
                        >
                          <div className={`relative w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 ${estadoFilter === 'ACTIVO' ? 'ring-2 ring-green-400' : ''}`}>
                            <UserIcon className={`h-5 w-5 ${estadoFilter === 'ACTIVO' ? 'text-green-700' : 'text-gray-500'}`} />
                            {activeCount > 0 && (
                              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1 text-xs font-bold leading-none text-white bg-green-600 rounded-full">
                                {activeCount}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-700">Activos</span>
                        </button>

                        <button
                          onClick={(e) => { e.stopPropagation(); if (!canViewInactive) { showError('No tienes permisos para ver alumnos inactivos'); return; } setEstadoFilter(prev => prev === 'INACTIVO' ? '' : 'INACTIVO'); }}
                          title={canViewInactive ? 'Inactivos' : 'No autorizado'}
                          className="flex items-center gap-2 focus:outline-none"
                        >
                          <div className={`relative w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 ${estadoFilter === 'INACTIVO' ? 'ring-2 ring-red-400' : ''} ${!canViewInactive ? 'opacity-40' : ''}`}>
                            <UserIcon className={`h-5 w-5 ${estadoFilter === 'INACTIVO' ? 'text-red-700' : 'text-gray-500'}`} />
                            {inactiveCount > 0 && (
                              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                                {inactiveCount}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-700">Inactivos</span>
                        </button>
                      </div>
                      {(role === 'admin' || role === 'entrenador') ? (
                        <button onClick={() => setShowAddStudent(true)} className="w-full bg-black text-white rounded px-4 py-2">Nuevo alumno</button>
                      ) : (
                        <button className="w-full bg-gray-200 text-gray-500 rounded px-4 py-2 cursor-not-allowed" title="Solo administradores o entrenadores">Nuevo alumno</button>
                      )}
                    </div>
                  </div>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-8"><BeatLoader color="#1E40AF" /></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filtered.map(s => (
                        <div
                          key={s.id}
                          className={`relative rounded-xl shadow flex items-center gap-4 px-4 py-4 sm:px-6 sm:py-5 cursor-pointer transition-all bg-white hover:bg-blue-600 group ${openMenuFor === s.id ? 'z-20' : ''}`}
                          onClick={() => handleOpenProfile(s.id)}
                        >
                          <Avatar name={`${s.nombre} ${s.apellido}`} size={48} round={true} />
                          <div>
                            <div className="font-semibold text-base sm:text-lg text-gray-900 group-hover:text-white">{s.nombre} {s.apellido}</div>
                            <div className="text-sm text-gray-500 group-hover:text-white">{s.categoria}</div>
                          </div>
                          <div className="absolute top-4 right-4">
                            <button data-menu-button={s.id} onClick={(e) => { e.stopPropagation(); setOpenMenuFor(openMenuFor === s.id ? null : s.id); }} className="p-1 rounded">
                              <EllipsisVerticalIcon className="h-5 w-5 text-gray-400 group-hover:text-white" />
                            </button>
                            {openMenuFor === s.id && (
                              <div data-menu-owner={s.id} className="mt-2 w-40 bg-white border rounded shadow-lg text-sm right-0 absolute z-50">
                                <ul>
                                  {role === 'admin' && (
                                    <li>
                                      <button onClick={(ev) => { ev.stopPropagation(); setEditingStudent(s); setShowAddStudent(true); setOpenMenuFor(null); }} className="w-full text-left px-3 py-2 hover:bg-gray-100">Editar</button>
                                    </li>
                                  )}
                                  {role === 'admin' && (
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
            )
          ) : (
            <div className="max-w-7xl mx-auto">
              <button className="mb-6 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onClick={() => setShowProfile(false)}>Volver</button>
              {!selectedStudent ? (
                <div className="bg-white rounded-xl shadow p-8 mb-8 text-gray-700">Alumno no encontrado.</div>
              ) : (
                <div className="bg-white rounded-xl shadow p-8 mb-8 flex flex-col items-center gap-6">
                  <Avatar name={`${selectedStudent.nombre} ${selectedStudent.apellido}`} size="100" round={true} />
                  <div className="text-center max-w-2xl">
                    <div className="text-3xl font-bold text-gray-900 mb-4">{selectedStudent.nombre} {selectedStudent.apellido}</div>
                    <div className="text-gray-700 mb-2">N° Socio: {selectedStudent.socioN || '—'}</div>
                    <div className="text-gray-700 mb-2">Tipo: {selectedStudent.tipo || '—'}</div>
                    <div className="text-gray-700 mb-2">DNI: {selectedStudent.dni}</div>
                    <div className="text-gray-700 mb-2">Nacimiento: {selectedStudent.nacimiento ? (new Date(selectedStudent.nacimiento)).toLocaleDateString() : '—'}</div>
                    <div className="text-gray-700 mb-2">Categoría: {selectedStudent.categoria}</div>
                    <div className="text-gray-700 mb-2">Ciudad: {selectedStudent.ciudad || '—'}</div>
                    <div className="text-gray-700 mb-2">Estado: {selectedStudent.estado || '—'}</div>
                    <div className="text-gray-700 mb-2">Email: {selectedStudent.email}</div>
                    <div className="text-gray-700 mb-2">Domicilio: {selectedStudent.domicilio}</div>
                    <div className="text-gray-700 mb-2">Celular: {selectedStudent.celular}</div>
                    <div className="text-gray-700 mb-2">Beca: {selectedStudent.beca ? 'SI' : 'NO'}</div>
                    <div className="text-gray-700 mb-2">Competitivo: {selectedStudent.competitivo ? 'SI' : 'NO'}</div>
                    <div className="text-gray-700 mb-2">Federado: {selectedStudent.federado ? 'SI' : 'NO'}</div>
                  </div>
                </div>
              )}
              <div className="mb-8">
                <h3 className="text-2xl font-semibold mb-6 text-gray-800">Histórico de Fichas Técnicas</h3>
                {/* Gráfico de evolución de promedios */}
                {studentSheets.length > 0 && (
                  <div className="bg-white rounded-xl shadow p-10 mb-8">
                    <h4 className="text-xl font-bold mb-4 text-gray-700">Evolución de Promedios</h4>
                    <ResponsiveContainer width="100%" height={300}>
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
                        <XAxis dataKey="fecha" stroke="#888" fontSize={14} />
                        <YAxis domain={[0, 10]} stroke="#888" fontSize={14} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="promedio" stroke="#22c55e" strokeWidth={3} dot={{ r: 5 }} name="Promedio" />
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
                <div className="space-y-8">
                  {studentSheets.length === 0 ? (
                    <div className="text-gray-500">No hay fichas técnicas registradas.</div>
                  ) : (
                    paginatedSheets.map((sheet, idx) => {
                      const puntajes = [sheet.postura, sheet.remada, sheet.equilibrio, sheet.coordinacion, sheet.resistencia, sheet.velocidad].map(p => Number(p) || 0);
                      const promedio = (puntajes.reduce((a, b) => a + b, 0) / puntajes.length).toFixed(1);
                      const fechaFormateada = new Date(sheet.fecha).toLocaleDateString('es-ES');
                        return (
                        <div key={sheet._id || sheet.id || idx} className="bg-white rounded-xl shadow-lg p-8 flex flex-col gap-6 border-l-4" style={{ borderColor: promedio >= 8 ? '#22c55e' : promedio >= 6 ? '#facc15' : '#ef4444' }}>
                          <div className="flex gap-8 items-center mb-4">
                            <span className="font-bold text-gray-700 text-xl">{fechaFormateada}</span>
                            <span className="text-gray-500">Entrenador: <span className="font-semibold text-gray-700">{sheet.entrenador}</span></span>
                            <span className={`ml-auto px-4 py-2 rounded-full text-white font-bold text-lg ${promedio >= 8 ? 'bg-green-600' : promedio >= 6 ? 'bg-yellow-500' : 'bg-red-500'}`}>Promedio: {promedio}</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-2 rounded text-sm font-bold ${sheet.postura >= 8 ? 'bg-green-100 text-green-700' : sheet.postura >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>Postura: {sheet.postura}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-2 rounded text-sm font-bold ${sheet.remada >= 8 ? 'bg-green-100 text-green-700' : sheet.remada >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>Remada: {sheet.remada}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-2 rounded text-sm font-bold ${sheet.equilibrio >= 8 ? 'bg-green-100 text-green-700' : sheet.equilibrio >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>Equilibrio: {sheet.equilibrio}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-2 rounded text-sm font-bold ${sheet.coordinacion >= 8 ? 'bg-green-100 text-green-700' : sheet.coordinacion >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>Coordinación: {sheet.coordinacion}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-2 rounded text-sm font-bold ${sheet.resistencia >= 8 ? 'bg-green-100 text-green-700' : sheet.resistencia >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>Resistencia: {sheet.resistencia}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-2 rounded text-sm font-bold ${sheet.velocidad >= 8 ? 'bg-green-100 text-green-700' : sheet.velocidad >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>Velocidad: {sheet.velocidad}</span>
                            </div>
                          </div>
                          <div className="text-gray-700 mt-4"><span className="font-semibold">Observaciones:</span> {sheet.observaciones}</div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="flex justify-center mt-6">
                  <button
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 mx-2"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Anterior
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 mx-2"
                    disabled={currentPage * itemsPerPage >= studentSheets.length}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
              {(role === 'entrenador' || role === 'admin') ? (
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
                    <button type="submit" className="bg-green-700 text-white rounded px-4 py-2 hover:bg-green-800 transition col-span-1 md:col-span-3">Guardar ficha</button>
                  </form>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
      <AddStudentModal
        open={showAddStudent}
        onClose={() => { setShowAddStudent(false); setEditingStudent(null); }}
        initialData={editingStudent}
        onCreated={(created) => {
          // Normalizar id y agregar al listado
          const normalized = { ...created, id: created._id || created.id || created.dni };
          setStudents(prev => [normalized, ...prev]);
          setShowAddStudent(false);
        }}
        onUpdated={(updated) => {
          // replace the student in the list
          const id = updated._id || updated.id || updated.dni;
          setStudents(prev => prev.map(s => ((s._id || s.id || s.dni) === String(id) ? ({ ...s, ...updated, id: id }) : s)));
          setShowAddStudent(false);
          setEditingStudent(null);
        }}
      />
    </ProtectedRoute>
  );
}
