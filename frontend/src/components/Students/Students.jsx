import { useState, useEffect, useCallback } from 'react';
import { fireThemedSwal } from '../../utils/swalTheme';
import ProtectedRoute from '../ProtectedRoute';
import { useAuth } from '../../context/useAuth';
import { showError, showSuccess } from '../../utils/toast';
import { fetchStudents, deleteStudent, updateStudent, downloadStudentsExcel } from '../../models/Student';
import { fetchBoats } from '../../models/Boat';
import { fetchSheetsByStudent } from '../../models/TechnicalSheet';
import Avatar from 'react-avatar';
import { EllipsisVerticalIcon, UserIcon, PlusIcon, Squares2X2Icon, Bars3Icon } from '@heroicons/react/24/outline';
import AddStudentModal from './AddStudentModal';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import LoadingSpinner from '../common/LoadingSpinner';

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
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [openingByEmail, setOpeningByEmail] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [estadoSavingById, setEstadoSavingById] = useState({});
  const [boatsCatalog, setBoatsCatalog] = useState([]);
  const [selectedBoatToAdd, setSelectedBoatToAdd] = useState('');
  const [selectedLevelToAdd, setSelectedLevelToAdd] = useState('');
  const [savingAllowedBoats, setSavingAllowedBoats] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [sheetTestFilter, setSheetTestFilter] = useState('');
  const [studentsViewMode, setStudentsViewMode] = useState('grid');
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
  const totalStudentsCount = students.length;
  const filteredStudentsCount = filtered.length;

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

  useEffect(() => {
    let mounted = true;
    fetchBoats()
      .then((list) => {
        if (!mounted) return;
        const normalized = Array.isArray(list)
          ? list.map((boat) => ({ ...boat, id: boat._id || boat.id }))
          : [];
        setBoatsCatalog(normalized);
      })
      .catch((err) => {
        console.error('Error cargando botes:', err);
      });
    return () => { mounted = false; };
  }, []);

  // Si se solicitó abrir un perfil (desde el botón Mi Perfil), marcar state para ocultar la lista
  useEffect(() => {
    try {
      const openMyProfile = localStorage.getItem('open_my_profile');
      const keyEmail = localStorage.getItem('open_student_email');
      const keyDoc = localStorage.getItem('open_student_documento');
      const keyFullName = localStorage.getItem('open_student_fullname');
      if (openMyProfile || keyEmail || keyDoc || keyFullName) setOpeningByEmail(true);
    } catch {
      // ignore
    }
  }, []);

  const findOwnStudent = useCallback((list) => {
    const normalize = (value) => String(value || '').trim().toLowerCase();
    const arr = Array.isArray(list) ? list : [];
    const userDoc = String(user?.documento || user?.dni || '').trim();
    const userEmail = normalize(user?.email);
    const userFullName = `${normalize(user?.nombre)} ${normalize(user?.apellido)}`.trim();

    const byDoc = arr.find((s) => {
      const studentDoc = String(s?.documento || s?.dni || '').trim();
      return !!userDoc && !!studentDoc && studentDoc === userDoc;
    });
    if (byDoc) return byDoc;

    const byEmail = arr.find((s) => {
      const studentEmail = normalize(s?.email);
      return !!userEmail && !!studentEmail && studentEmail === userEmail;
    });
    if (byEmail) return byEmail;

    const byName = arr.find((s) => `${normalize(s?.nombre)} ${normalize(s?.apellido)}`.trim() === userFullName);
    return byName || null;
  }, [user]);

  const selectedStudent = students.find(s => s.id === selected);
  const selectedStudentBoatIds = Array.isArray(selectedStudent?.botesHabilitados)
    ? selectedStudent.botesHabilitados.map((boatId) => String(boatId))
    : [];
  const selectedStudentBoatIdSet = new Set(selectedStudentBoatIds);
  const selectedStudentBoats = selectedStudentBoatIds.map((boatId) => {
    const found = boatsCatalog.find((boat) => String(boat.id || boat._id) === boatId);
    return found || { id: boatId, nombre: `Bote ${boatId.slice(-5)}`, estado: 'desconocido' };
  });
  const availableBoatsToAdd = boatsCatalog.filter((boat) => {
    const boatId = String(boat.id || boat._id);
    const isAlreadyAdded = selectedStudentBoatIdSet.has(boatId);
    const isActive = String(boat.estado || '').toLowerCase() === 'activo';
    return !isAlreadyAdded && isActive;
  });
  const availableLevelsToAdd = Array.from(
    new Set(
      availableBoatsToAdd
        .map((boat) => String(boat?.nivelDif || '').trim())
        .filter(Boolean)
    )
  ).sort((a, b) => Number(a) - Number(b));
  const studentSheets = sheets[selected] || [];

  const parseTimeToSeconds = (value) => {
    if (value === undefined || value === null) return undefined;
    const text = String(value).trim();
    if (!text) return undefined;
    const parts = text.split(':').map((part) => part.trim());
    if (parts.length === 1) {
      const seconds = Number(parts[0]);
      return Number.isFinite(seconds) ? seconds : undefined;
    }
    const minutes = Number(parts[0]);
    const seconds = Number(parts[1]);
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return undefined;
    return minutes * 60 + seconds;
  };

  const getTrainerName = (sheet) => {
    if (sheet?.entrenador) return sheet.entrenador;
    if (sheet?.entrenadorId && typeof sheet.entrenadorId === 'object') {
      const fullName = `${sheet.entrenadorId.nombre || ''} ${sheet.entrenadorId.apellido || ''}`.trim();
      if (fullName) return fullName;
      if (sheet.entrenadorId.email) return sheet.entrenadorId.email;
    }
    return 'Sin entrenador';
  };

  const getMainTest = (sheet) => {
    if (Array.isArray(sheet?.tests) && sheet.tests.length > 0) return sheet.tests[0];
    return null;
  };

  const getSheetTime = (sheet) => {
    const test = getMainTest(sheet);
    return test?.tiempo || sheet?.tiempoFinal || '';
  };

  const getSheetDistance = (sheet) => {
    const test = getMainTest(sheet);
    const explicit = String(sheet?.prueba || '').trim();
    if (test?.distance) return `${test.distance}m`;
    if (explicit) return `${explicit}m`;
    return 'Sin prueba';
  };

  const getSheetDistanceValue = (sheet) => {
    const test = getMainTest(sheet);
    if (test?.distance !== undefined && test?.distance !== null) return String(test.distance).trim();
    return String(sheet?.prueba || '').trim();
  };

  const availableSheetTests = Array.from(
    new Set(studentSheets.map((sheet) => getSheetDistanceValue(sheet)).filter(Boolean))
  ).sort((a, b) => Number(a) - Number(b));

  const filteredStudentSheets = studentSheets.filter((sheet) => {
    if (!sheetTestFilter) return true;
    return getSheetDistanceValue(sheet) === sheetTestFilter;
  });

  const paginatedSheets = filteredStudentSheets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const chartData = filteredStudentSheets.map((sheet) => {
    const base = { fecha: new Date(sheet.fecha).toLocaleDateString('es-ES') };
    const tests = Array.isArray(sheet.tests) ? sheet.tests : [];
    tests.forEach((test) => {
      const seconds = parseTimeToSeconds(test?.tiempo || test?.tiempoFinal);
      if (Number.isFinite(seconds) && test?.distance) base[`t${test.distance}`] = seconds;
    });
    return base;
  });

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
    const userDoc = user && (user.documento || user.dni) ? String(user.documento || user.dni).trim() : null;
    const studentDoc = student && (student.documento || student.dni) ? String(student.documento || student.dni).trim() : null;
    const isSameDocumento = userDoc && studentDoc && userDoc === studentDoc;
    if (!user || (!isAdminOrCoach && !isSameEmail && !isSameDocumento)) {
      showError('No tienes permisos para ver el perfil del alumno.');
      return;
    }

    try {
      setSelected(id);
      setSheetTestFilter('');
      setShowProfile(true);
      setProfileLoading(true);
      const data = await fetchSheetsByStudent(id, user);
      // Asegurar que almacenamos siempre un array
      setSheets(prev => ({ ...prev, [id]: Array.isArray(data) ? data : [] }));
    } catch (err) {
      console.error('Error fetching sheets for student', err);
      showError('No se pudieron cargar las fichas del alumno.');
    } finally {
      setProfileLoading(false);
    }
  }, [students, role, user]);

  useEffect(() => {
    window.appOpenMyProfileModal = () => {
      try {
        const foundOwn = findOwnStudent(students);
        if (foundOwn) {
          handleOpenProfile(foundOwn.id);
          setOpeningByEmail(false);
          return;
        }
        localStorage.setItem('open_my_profile', '1');
        setOpeningByEmail(true);
      } catch {
        localStorage.setItem('open_my_profile', '1');
        setOpeningByEmail(true);
      }
    };

    return () => {
      window.appOpenMyProfileModal = undefined;
    };
  }, [students, findOwnStudent, handleOpenProfile]);

  // Si existe la key `open_student_email` en localStorage (pulsada desde la Sidebar),
  // buscar el alumno con ese email y abrir su ficha automáticamente.
  useEffect(() => {
    try {
      const openMyProfile = localStorage.getItem('open_my_profile');
      if (openMyProfile) {
        if (loading) return;
        const foundOwn = findOwnStudent(students);
        localStorage.removeItem('open_my_profile');
        if (foundOwn) {
          handleOpenProfile(foundOwn.id);
          setOpeningByEmail(false);
          return;
        }
        setOpeningByEmail(false);
        showError('No se encontró tu perfil de alumno.');
        return;
      }

      const keyEmail = localStorage.getItem('open_student_email');
      const keyDoc = localStorage.getItem('open_student_documento');
      const keyFullName = localStorage.getItem('open_student_fullname');
      if (!keyEmail && !keyDoc && !keyFullName) return;
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
      if (keyFullName) {
        const target = String(keyFullName).trim().toLowerCase();
        const found = students.find((s) => `${String(s.nombre || '').trim()} ${String(s.apellido || '').trim()}`.toLowerCase() === target);
        localStorage.removeItem('open_student_fullname');
        if (found) {
          handleOpenProfile(found.id);
          setOpeningByEmail(false);
          return;
        }
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
  }, [students, user, handleOpenProfile, findOwnStudent, loading]);

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
          const byName = students.find(s => `${String(s.nombre || '').trim()} ${String(s.apellido || '').trim()}`.toLowerCase() === raw.toLowerCase());
          if (byName) {
            handleOpenProfile(byName.id);
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
      const found = students.find(s => (s.email && String(s.email).trim().toLowerCase() === String(pending).toLowerCase()) || (s.dni && String(s.dni).trim() === String(pending)) || (s.documento && String(s.documento).trim() === String(pending)) || (`${String(s.nombre || '').trim()} ${String(s.apellido || '').trim()}`.toLowerCase() === String(pending).toLowerCase()));
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

  const handleDeleteStudentWithConfirm = async (id) => {
    const result = await fireThemedSwal({
      title: 'Eliminar alumno?',
      text: 'Esta accion no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    await handleDeleteStudent(id);
  };

  const canChangeEstado = role === 'admin' || role === 'subcomision' || role === 'entrenador';
  const canManageAllowedBoats = role === 'admin' || role === 'entrenador';

  useEffect(() => {
    setSelectedBoatToAdd('');
    setSelectedLevelToAdd('');
  }, [selected]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selected, sheetTestFilter]);

  const saveAllowedBoats = async (student, nextBoatIds) => {
    const studentId = student?.id || student?._id;
    if (!studentId) return;

    try {
      setSavingAllowedBoats(true);
      const updated = await updateStudent(studentId, { botesHabilitados: nextBoatIds });
      const normalizedUpdated = {
        ...student,
        ...updated,
        id: updated?._id || updated?.id || studentId,
        botesHabilitados: Array.isArray(updated?.botesHabilitados) ? updated.botesHabilitados : nextBoatIds,
      };
      setStudents((prev) => prev.map((s) => ((s.id || s._id) === studentId ? normalizedUpdated : s)));
      return true;
    } catch (err) {
      console.error('Error guardando botes habilitados:', err);
      showError('No se pudo actualizar la lista de botes habilitados.');
      return false;
    } finally {
      setSavingAllowedBoats(false);
    }
  };

  const handleAddAllowedBoat = async () => {
    if (!selectedStudent || !selectedBoatToAdd) return;
    if (!canManageAllowedBoats) {
      showError('No tienes permisos para modificar botes habilitados.');
      return;
    }
    const currentIds = Array.isArray(selectedStudent.botesHabilitados)
      ? selectedStudent.botesHabilitados.map((boatId) => String(boatId))
      : [];
    if (currentIds.includes(String(selectedBoatToAdd))) return;

    const nextIds = [...currentIds, String(selectedBoatToAdd)];
    const ok = await saveAllowedBoats(selectedStudent, nextIds);
    if (ok) {
      setSelectedBoatToAdd('');
      showSuccess('Bote habilitado correctamente.');
    }
  };

  const handleRemoveAllowedBoat = async (boatId) => {
    if (!selectedStudent) return;
    if (!canManageAllowedBoats) {
      showError('No tienes permisos para modificar botes habilitados.');
      return;
    }
    const currentIds = Array.isArray(selectedStudent.botesHabilitados)
      ? selectedStudent.botesHabilitados.map((item) => String(item))
      : [];
    const nextIds = currentIds.filter((item) => item !== String(boatId));
    const ok = await saveAllowedBoats(selectedStudent, nextIds);
    if (ok) showSuccess('Bote removido de habilitados.');
  };

  const handleClearAllowedBoats = async () => {
    if (!selectedStudent) return;
    if (!canManageAllowedBoats) {
      showError('No tienes permisos para modificar botes habilitados.');
      return;
    }

    const currentIds = Array.isArray(selectedStudent.botesHabilitados)
      ? selectedStudent.botesHabilitados.map((item) => String(item))
      : [];

    if (currentIds.length === 0) {
      showError('El alumno no tiene botes habilitados para borrar.');
      return;
    }

    const result = await fireThemedSwal({
      title: 'Borrar botes habilitados?',
      text: 'Se eliminaran todos los botes habilitados de este alumno.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, borrar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });
    const confirmed = result.isConfirmed;
    if (!confirmed) return;

    const ok = await saveAllowedBoats(selectedStudent, []);
    if (ok) showSuccess('Se borraron todos los botes habilitados del alumno.');
  };

  const handleAddAllowedBoatLevel = async () => {
    if (!selectedStudent || !selectedLevelToAdd) return;
    if (!canManageAllowedBoats) {
      showError('No tienes permisos para modificar botes habilitados.');
      return;
    }

    const targetLevel = String(selectedLevelToAdd).trim();
    const currentIds = Array.isArray(selectedStudent.botesHabilitados)
      ? selectedStudent.botesHabilitados.map((boatId) => String(boatId))
      : [];

    const idsFromLevel = boatsCatalog
      .filter((boat) => String(boat?.estado || '').toLowerCase() === 'activo')
      .filter((boat) => String(boat?.nivelDif || '').trim() === targetLevel)
      .map((boat) => String(boat.id || boat._id))
      .filter(Boolean)
      .filter((boatId) => !currentIds.includes(boatId));

    if (idsFromLevel.length === 0) {
      showError(`No hay botes activos disponibles para el nivel ${targetLevel}.`);
      return;
    }

    const nextIds = Array.from(new Set([...currentIds, ...idsFromLevel]));
    const ok = await saveAllowedBoats(selectedStudent, nextIds);
    if (ok) {
      setSelectedLevelToAdd('');
      showSuccess(`Nivel ${targetLevel} asignado con ${idsFromLevel.length} bote(s).`);
    }
  };

  const handleEstadoChange = async (student, newEstado) => {
    if (!canChangeEstado) {
      showError('No tienes permisos para cambiar el estado.');
      return;
    }

    const normalizedEstado = String(newEstado || '').toUpperCase();
    if (normalizedEstado !== 'ACTIVO' && normalizedEstado !== 'INACTIVO') return;

    const studentId = student?.id || student?._id;
    if (!studentId) return;

    try {
      setEstadoSavingById(prev => ({ ...prev, [studentId]: true }));
      const updated = await updateStudent(studentId, { estado: normalizedEstado });
      const merged = { ...student, ...updated, id: updated?._id || updated?.id || studentId, estado: normalizedEstado };

      setStudents(prev => prev.map(s => ((s.id || s._id) === studentId ? merged : s)));
      showSuccess(`Estado actualizado a ${normalizedEstado}.`);
    } catch (err) {
      console.error('Error actualizando estado del alumno:', err);
      showError('No se pudo actualizar el estado del alumno.');
    } finally {
      setEstadoSavingById(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const handleDownloadExcel = async () => {
    const filteredIds = filtered
      .map((student) => String(student.id || student._id || '').trim())
      .filter(Boolean);

    if (filteredIds.length === 0) {
      showError('No hay alumnos para exportar con los filtros actuales.');
      return;
    }

    try {
      setDownloadingExcel(true);
      const { blob, filename } = await downloadStudentsExcel(filteredIds);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSuccess(`Excel descargado con ${filteredIds.length} alumno(s).`);
    } catch (err) {
      console.error('Error descargando excel de alumnos:', err);
      showError('No se pudo descargar el Excel de alumnos.');
    } finally {
      setDownloadingExcel(false);
    }
  };

  // Allow 'alumnos' to access the students view so they can see active students and their own profile.

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-100">
        {/* Sidebar: avatares para filtrar por estado */}
        <aside className="hidden sm:flex w-24 bg-white/95 border-r border-slate-200 flex-col items-center py-6 gap-4 shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={(e) => { e.stopPropagation(); setEstadoFilter(prev => prev === 'ACTIVO' ? '' : 'ACTIVO'); }}
              title="Activos"
              className="flex flex-col items-center gap-1 focus:outline-none rounded-xl px-2 py-2 hover:bg-slate-50 transition"
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
              className={`flex flex-col items-center gap-1 focus:outline-none rounded-xl px-2 py-2 hover:bg-slate-50 transition ${!canViewInactive ? 'opacity-40 cursor-not-allowed' : ''}`}
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
              <button onClick={() => setShowAddStudent(true)} className="bg-slate-900 rounded-full p-2 hover:bg-slate-700 transition mt-2 shadow">
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
        <div className="flex-1 flex flex-col px-4 sm:px-10 py-6 sm:py-8 w-full max-w-7xl mx-auto">
          {!showProfile ? (
            openingByEmail ? (
              <div className="flex items-center justify-center w-full py-20 text-gray-600">
                  <LoadingSpinner message="" className="py-0" size={12} />
                </div>
            ) : (
              <>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-3xl font-bold text-slate-900">Equipo</h2>
                    <div className="flex items-center gap-4">
                    <span className="hidden sm:inline-block font-semibold text-slate-700">Club Regatas San Nicolás - REMO</span>
                    <img src="/icon.svg" alt="logo" className="h-8 w-8" />
                  </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold">Total: {totalStudentsCount}</span>
                    <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">Mostrando: {filteredStudentsCount}</span>
                    <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-semibold">Activos: {activeCount}</span>
                    <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-semibold">Inactivos: {inactiveCount}</span>
                  </div>
                </div>
                <div className="mb-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4">
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar alumno"
                    className="w-full sm:max-w-md px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 bg-white"
                  />
                  <div className="w-full sm:w-auto">
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2.5 bg-white w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500">
                      <option value="">Todas las categorías</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleDownloadExcel}
                      disabled={downloadingExcel}
                      className="w-full sm:w-auto px-4 py-2 rounded bg-emerald-700 text-white hover:bg-emerald-800 disabled:bg-gray-300 disabled:text-gray-500"
                    >
                      {downloadingExcel ? 'Descargando...' : 'Descargar Excel'}
                    </button>
                  </div>
                  <div className="hidden sm:block w-full sm:w-auto">
                    <div className="inline-flex w-full sm:w-auto rounded-lg border border-slate-300 bg-white p-1">
                      <button
                        type="button"
                        onClick={() => setStudentsViewMode('grid')}
                        className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-sm transition w-1/2 sm:w-auto ${studentsViewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        <Squares2X2Icon className="h-4 w-4" /> Cuadros
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentsViewMode('list')}
                        className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-sm transition w-1/2 sm:w-auto ${studentsViewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        <Bars3Icon className="h-4 w-4" /> Lista
                      </button>
                    </div>
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
                  <LoadingSpinner message="" className="py-8" />
                ) : (
                  <div className={studentsViewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5' : 'flex flex-col gap-3'}>
                    {filtered.length === 0 && (
                      <div className="col-span-full bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 shadow-sm">
                        No hay alumnos que coincidan con los filtros seleccionados.
                      </div>
                    )}
                    {filtered.map(s => (
                        <div
                          key={s.id}
                          className={`relative rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 px-4 py-4 sm:px-5 sm:py-4 cursor-pointer transition-all bg-white ${studentsViewMode === 'grid' ? 'hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 group' : 'hover:bg-slate-50'} ${openMenuFor === s.id ? 'z-20' : ''}`}
                          onClick={() => handleOpenProfile(s.id)}
                        >
                          <Avatar name={`${s.nombre} ${s.apellido}`} size={48} round={true} />
                          <div className="min-w-0 flex-1">
                            <div className={`font-semibold text-base sm:text-lg truncate ${studentsViewMode === 'grid' ? 'text-slate-900' : 'text-slate-900'}`}>{s.nombre} {s.apellido}</div>
                            <div className="text-sm text-slate-500">{s.categoria}</div>
                            {studentsViewMode === 'list' && (
                              <div className="text-xs text-slate-400 mt-0.5">DNI: {s.dni || '—'}</div>
                            )}
                          </div>
                          <div className="absolute top-4 right-4">
                            <button data-menu-button={s.id} onClick={(e) => { e.stopPropagation(); setOpenMenuFor(openMenuFor === s.id ? null : s.id); }} className="p-1 rounded">
                              <EllipsisVerticalIcon className="h-5 w-5 text-slate-400 hover:text-slate-600" />
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
                                      <button onClick={async (ev) => { ev.stopPropagation(); await handleDeleteStudentWithConfirm(s.id); setOpenMenuFor(null); }} className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600">Eliminar</button>
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
            <div className="fixed inset-0 z-50 modal-overlay p-2 sm:p-4 flex items-start sm:items-center justify-center overflow-y-auto" onClick={() => setShowProfile(false)}>
              <div className="modal-panel relative z-10 bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] overflow-y-auto p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6 bg-white border border-slate-200 rounded-xl px-4 py-3">
                <h3 className="text-xl font-semibold text-slate-800">Perfil del alumno</h3>
                <button className="px-4 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-100 text-slate-700" onClick={() => setShowProfile(false)}>Cerrar</button>
              </div>
              {profileLoading && (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner message="" className="py-0" size={10} />
                </div>
              )}
              {!selectedStudent ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 mb-8 text-gray-700">Alumno no encontrado.</div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 mb-8 flex flex-col items-center gap-6">
                  <Avatar name={`${selectedStudent.nombre} ${selectedStudent.apellido}`} size="100" round={true} />
                  <div className="text-center max-w-2xl">
                    <div className="text-3xl font-bold text-gray-900 mb-4">{selectedStudent.nombre} {selectedStudent.apellido}</div>
                    <div className="text-gray-700 mb-2">N° Socio: {selectedStudent.socioN || '—'}</div>
                    <div className="text-gray-700 mb-2">Tipo: {selectedStudent.tipo || '—'}</div>
                    <div className="text-gray-700 mb-2">DNI: {selectedStudent.dni}</div>
                    <div className="text-gray-700 mb-2">Nacimiento: {selectedStudent.nacimiento ? (new Date(selectedStudent.nacimiento)).toLocaleDateString() : '—'}</div>
                    <div className="text-gray-700 mb-2">Categoría: {selectedStudent.categoria}</div>
                    <div className="text-gray-700 mb-2">Ciudad: {selectedStudent.ciudad || '—'}</div>
                    <div className="text-gray-700 mb-2">Email: {selectedStudent.email}</div>
                    <div className="text-gray-700 mb-2">Domicilio: {selectedStudent.domicilio}</div>
                    <div className="text-gray-700 mb-2">Celular: {selectedStudent.celular}</div>
                    <div className="text-gray-700 mb-2">Beca: {selectedStudent.beca ? 'SI' : 'NO'}</div>
                    <div className="text-gray-700 mb-2">Competitivo: {selectedStudent.competitivo ? 'SI' : 'NO'}</div>
                    <div className="text-gray-700 mb-2">Federado: {selectedStudent.federado ? 'SI' : 'NO'}</div>
                    <div className="text-gray-700 mb-2 flex items-center justify-center gap-2">
                      <span>Estado:</span>
                      {canChangeEstado ? (
                        <select
                          value={String(selectedStudent.estado || 'ACTIVO').toUpperCase()}
                          onChange={(e) => handleEstadoChange(selectedStudent, e.target.value)}
                          disabled={!!estadoSavingById[selectedStudent.id]}
                          className="border border-slate-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 disabled:bg-gray-100 disabled:text-gray-500"
                        >
                          <option value="ACTIVO">ACTIVO</option>
                          <option value="INACTIVO">INACTIVO</option>
                        </select>
                      ) : (
                        <span>{selectedStudent.estado || '—'}</span>
                      )}
                      {String(selectedStudent.estado || 'ACTIVO').toUpperCase() === 'INACTIVO' ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white" aria-label="Inactivo">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white" aria-label="Activo">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {selectedStudent && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">Botes habilitados para este alumno</h3>
                    {canManageAllowedBoats && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedBoatToAdd}
                            onChange={(e) => setSelectedBoatToAdd(e.target.value)}
                            disabled={savingAllowedBoats}
                            className="border border-slate-300 rounded-lg px-3 py-2 bg-white min-w-[220px] focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 disabled:bg-gray-100"
                          >
                            <option value="">Seleccionar bote activo</option>
                            {availableBoatsToAdd.map((boat) => (
                              <option key={boat.id || boat._id} value={boat.id || boat._id}>
                                {boat.nombre} ({boat.tipo})
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleAddAllowedBoat}
                            disabled={!selectedBoatToAdd || savingAllowedBoats}
                            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-500"
                          >
                            Agregar bote
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={selectedLevelToAdd}
                            onChange={(e) => setSelectedLevelToAdd(e.target.value)}
                            disabled={savingAllowedBoats}
                            className="border border-slate-300 rounded-lg px-3 py-2 bg-white min-w-[180px] focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 disabled:bg-gray-100"
                          >
                            <option value="">Seleccionar nivel</option>
                            {availableLevelsToAdd.map((level) => (
                              <option key={level} value={level}>Nivel {level}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleAddAllowedBoatLevel}
                            disabled={!selectedLevelToAdd || savingAllowedBoats}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
                          >
                            Agregar nivel
                          </button>
                        </div>

                        <div className="flex items-center gap-2 sm:ml-auto">
                          <button
                            type="button"
                            onClick={handleClearAllowedBoats}
                            disabled={savingAllowedBoats || selectedStudentBoats.length === 0}
                            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500"
                          >
                            Borrar todos
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedStudentBoats.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay botes habilitados para este alumno.</p>
                  ) : (
                    <ul className="space-y-2">
                      {selectedStudentBoats.map((boat) => (
                        <li key={boat.id || boat._id} className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
                          <div className="text-sm text-gray-800">
                            <span className="font-semibold">{boat.nombre || 'Bote'}</span>
                            <span className="ml-2 text-gray-500 uppercase text-xs">{boat.tipo || '—'}</span>
                          </div>
                          {canManageAllowedBoats && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAllowedBoat(boat.id || boat._id)}
                              disabled={savingAllowedBoats}
                              className="text-sm px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:bg-gray-200 disabled:text-gray-500"
                            >
                              Quitar
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <h3 className="text-2xl font-semibold text-gray-800">Histórico de Fichas Técnicas</h3>
                  <select
                    value={sheetTestFilter}
                    onChange={(e) => setSheetTestFilter(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 w-full sm:w-auto"
                  >
                    <option value="">Todas las pruebas</option>
                    {availableSheetTests.map((testValue) => (
                      <option key={testValue} value={testValue}>{testValue}m</option>
                    ))}
                  </select>
                </div>
                {/* Gráfico con métricas vigentes de las fichas técnicas */}
                {filteredStudentSheets.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 mb-8">
                    <h4 className="text-xl font-bold mb-4 text-gray-700">Evolución de tiempos por prueba</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <XAxis dataKey="fecha" stroke="#888" fontSize={14} />
                        <YAxis stroke="#888" fontSize={14} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="t100" stroke="#f59e0b" strokeWidth={2} dot={false} name="100m" />
                        <Line type="monotone" dataKey="t500" stroke="#06b6d4" strokeWidth={2} dot={false} name="500m" />
                        <Line type="monotone" dataKey="t2000" stroke="#22c55e" strokeWidth={2} dot={false} name="2000m" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="space-y-8">
                  {filteredStudentSheets.length === 0 ? (
                    <div className="text-gray-500">No hay fichas técnicas registradas.</div>
                  ) : (
                    paginatedSheets.map((sheet, idx) => {
                      const fechaFormateada = new Date(sheet.fecha).toLocaleDateString('es-ES');
                      const tests = Array.isArray(sheet.tests) ? sheet.tests : [];
                      const mainTest = getMainTest(sheet);
                      const trainerName = getTrainerName(sheet);
                      const distanceLabel = getSheetDistance(sheet);
                      const hasWeight = sheet.peso !== undefined && sheet.peso !== null && String(sheet.peso).trim() !== '';
                      const hasCategory = !!String(sheet.categoria || '').trim();
                      const hasPicoWatts = Number.isFinite(Number(sheet.picoWatts));
                      const hasAvgWatts = Number.isFinite(Number(sheet.promedioFinalWatts || mainTest?.promedioWatts));
                      const hasRpm = Number.isFinite(Number(sheet.rpm || mainTest?.rpm));
                      const hasMainTime = !!String(getSheetTime(sheet) || '').trim();
                        return (
                        <div key={sheet._id || sheet.id || idx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex flex-col gap-6 border-l-4" style={{ borderColor: '#0ea5e9' }}>
                          <div className="flex flex-wrap gap-4 sm:gap-8 items-center mb-2">
                            <span className="font-bold text-gray-700 text-xl">{fechaFormateada}</span>
                            <span className="text-gray-500">Entrenador: <span className="font-semibold text-gray-700">{trainerName}</span></span>
                            <span className="ml-auto px-4 py-2 rounded-full text-white font-bold text-sm sm:text-base bg-sky-600">Prueba: {distanceLabel}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {hasWeight && (
                              <span className="px-3 py-2 rounded text-sm font-semibold bg-slate-100 text-slate-700">Peso: {sheet.peso} kg</span>
                            )}
                            {hasCategory && (
                              <span className="px-3 py-2 rounded text-sm font-semibold bg-slate-100 text-slate-700">Categoría prueba: {sheet.categoria}</span>
                            )}
                            {hasPicoWatts && (
                              <span className="px-3 py-2 rounded text-sm font-semibold bg-amber-50 text-amber-700">Pico watts: {sheet.picoWatts}</span>
                            )}
                            {hasAvgWatts && (
                              <span className="px-3 py-2 rounded text-sm font-semibold bg-cyan-50 text-cyan-700">Promedio watts: {sheet.promedioFinalWatts || mainTest?.promedioWatts}</span>
                            )}
                            {hasRpm && (
                              <span className="px-3 py-2 rounded text-sm font-semibold bg-emerald-50 text-emerald-700">RPM: {sheet.rpm || mainTest?.rpm}</span>
                            )}
                            {hasMainTime && (
                              <span className="px-3 py-2 rounded text-sm font-semibold bg-indigo-50 text-indigo-700">Tiempo final: {getSheetTime(sheet)}</span>
                            )}
                          </div>

                          {tests.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {tests.map((test, testIdx) => (
                                <div key={`${sheet._id || sheet.id || idx}-test-${testIdx}`} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                                  <div className="font-semibold text-slate-700 mb-2">Test {test.distance ? `${test.distance}m` : testIdx + 1}</div>
                                  <div className="text-sm text-slate-600">Tiempo: {test.tiempo || test.tiempoFinal || '—'}</div>
                                  {test.promedioWatts !== undefined && test.promedioWatts !== null && <div className="text-sm text-slate-600">Promedio watts: {test.promedioWatts}</div>}
                                  {test.rpm !== undefined && test.rpm !== null && <div className="text-sm text-slate-600">RPM: {test.rpm}</div>}
                                  {test.parcial500 && <div className="text-sm text-slate-600">Parcial 500: {test.parcial500}</div>}
                                  {test.parcial1000 && <div className="text-sm text-slate-600">Parcial 1000: {test.parcial1000}</div>}
                                  {test.parcial1500 && <div className="text-sm text-slate-600">Parcial 1500: {test.parcial1500}</div>}
                                  {test.parcial2000 && <div className="text-sm text-slate-600">Parcial 2000: {test.parcial2000}</div>}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="text-gray-700 mt-1"><span className="font-semibold">Observaciones:</span> {sheet.observaciones || 'Sin observaciones.'}</div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="flex justify-center mt-6">
                  <button
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 mx-2"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Anterior
                  </button>
                  <button
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 mx-2"
                    disabled={currentPage * itemsPerPage >= filteredStudentSheets.length}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
              </div>
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
