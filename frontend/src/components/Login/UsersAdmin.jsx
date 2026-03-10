import React, { useEffect, useState } from 'react';
import { fetchUsers, createUser, updateUser, UserRoles } from '../../models/User';
import { useAuth } from '../../context/useAuth';
import { showError, showSuccess } from '../../utils/toast';

export default function UsersAdmin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [mainQuery, setMainQuery] = useState('');
  const [alumnosQuery, setAlumnosQuery] = useState('');
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', documento: '', rol: UserRoles.ENTRENADOR, password: '' });
  const [editId, setEditId] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  useEffect(() => {
    if (user?.rol === UserRoles.ADMIN) {
      fetchUsers(user).then(setUsers);
    }
  }, [user]);

  if (!user || user.rol !== UserRoles.ADMIN) {
    return <div>No tienes acceso a esta sección.</div>;
  }

  const handleChange = e => {
    const { name, value } = e.target;
    const newValue = (name === 'nombre' || name === 'apellido') ? (value || '').toString().toUpperCase() : value;
    setForm({ ...form, [name]: newValue });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editId) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        const updated = await updateUser(editId, payload, user);
        setUsers(users.map(u => u._id === editId ? updated : u));
        setEditId(null);
        showSuccess('Usuario actualizado correctamente.');
      } else {
        const created = await createUser(form, user);
        setUsers([...users, created]);
        showSuccess('Usuario creado correctamente.');
      }
      setForm({ nombre: '', apellido: '', email: '', documento: '', rol: UserRoles.ENTRENADOR, password: '' });
      setIsUserModalOpen(false);
    } catch (err) {
      showError(err?.message || 'No se pudo guardar el usuario.');
    }
  };

  const handleEdit = user => {
    setEditId(user._id);
    // Do not prefill password when editing
    setForm({ nombre: (user.nombre || '').toString().toUpperCase(), apellido: (user.apellido || '').toString().toUpperCase(), email: user.email, documento: user.documento || '', rol: user.rol, password: '' });
    setIsUserModalOpen(true);
  };

  const handleCreate = () => {
    setEditId(null);
    setForm({ nombre: '', apellido: '', email: '', documento: '', rol: UserRoles.ENTRENADOR, password: '' });
    setIsUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
    setEditId(null);
    setForm({ nombre: '', apellido: '', email: '', documento: '', rol: UserRoles.ENTRENADOR, password: '' });
  };

  const norm = (s) => (s || '').toString().trim().toLowerCase();

  // group + sort
  const groupMainRoles = [UserRoles.ADMIN, UserRoles.SUBCOMISION, UserRoles.ENTRENADOR, UserRoles.MANTENIMIENTO];
  const mainAll = (users || []).filter(u => groupMainRoles.includes(u.rol)).sort((a,b) => {
    const na = `${norm(a.nombre)} ${norm(a.apellido)}`.trim();
    const nb = `${norm(b.nombre)} ${norm(b.apellido)}`.trim();
    return na.localeCompare(nb);
  });
  const alumnosAll = (users || []).filter(u => String(u.rol) === String(UserRoles.ALUMNOS)).sort((a,b) => {
    const na = `${norm(a.nombre)} ${norm(a.apellido)}`.trim();
    const nb = `${norm(b.nombre)} ${norm(b.apellido)}`.trim();
    return na.localeCompare(nb);
  });

  // per-panel filtering
  const mainUsers = mainAll.filter(u => {
    if (!mainQuery) return true;
    const q = norm(mainQuery);
    const hay = [u.nombre, u.apellido, u.email, u.documento, u.rol].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  });
  const alumnos = alumnosAll.filter(u => {
    if (!alumnosQuery) return true;
    const q = norm(alumnosQuery);
    const hay = [u.nombre, u.apellido, u.email, u.documento, u.rol].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  });

  return (
    <div className="p-8 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Administrar Usuarios</h2>
        <button type="button" onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700">
          Crear usuario
        </button>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Admin / Subcomisión / Profesores / Mantenimiento</h3>
            <input placeholder="Buscar en este grupo" value={mainQuery} onChange={(e) => setMainQuery(e.target.value)} className="px-3 py-1 border rounded w-56" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Apellido</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mainUsers.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleEdit(u)}>
                    <td className="px-4 py-2 text-sm text-gray-900">{u.nombre}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{u.apellido}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{u.email}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{u.rol}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Alumnos</h3>
            <input placeholder="Buscar en Alumnos" value={alumnosQuery} onChange={(e) => setAlumnosQuery(e.target.value)} className="px-3 py-1 border rounded w-56" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Apellido</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {alumnos.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleEdit(u)}>
                    <td className="px-4 py-2 text-sm text-gray-900">{u.nombre}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{u.apellido}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{u.email}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{u.documento || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 modal-overlay p-2 sm:p-4 flex items-start sm:items-center justify-center overflow-y-auto" onClick={handleCloseUserModal}>
          <div className="modal-panel relative z-10 w-full max-w-4xl bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 max-h-[94vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 tracking-wide">{editId ? 'Modificar usuario' : 'Crear usuario'}</h3>
              <button onClick={handleCloseUserModal} className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100">Cerrar</button>
            </div>
            <div className="p-3 sm:p-4">
            <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-center bg-white border border-slate-200 rounded-xl shadow-sm p-3 sm:p-4">
              <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" required className="px-3 py-2 border border-slate-300 rounded-lg w-40 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" />
              <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" required className="px-3 py-2 border border-slate-300 rounded-lg w-40 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" />
              <input name="email" value={form.email} onChange={handleChange} placeholder="Email" required type="email" className="px-3 py-2 border border-slate-300 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" />
              <input name="documento" value={form.documento} onChange={handleChange} placeholder="Documento" className="px-3 py-2 border border-slate-300 rounded-lg w-40 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" />
              <input name="password" value={form.password} onChange={handleChange} placeholder={editId ? 'Nueva contrasena (opcional)' : 'Contrasena'} type="password" className="px-3 py-2 border border-slate-300 rounded-lg w-40 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500" required={!editId} />

              <select name="rol" value={form.rol} onChange={handleChange} required className="px-3 py-2 border border-slate-300 rounded-lg w-40 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500">
                <option value={UserRoles.ADMIN}>Admin</option>
                <option value={UserRoles.ENTRENADOR}>Entrenador</option>
                <option value={UserRoles.MANTENIMIENTO}>Mantenimiento</option>
                <option value={UserRoles.ALUMNOS}>Alumnos</option>
                <option value={UserRoles.SUBCOMISION}>Subcomision</option>
              </select>
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">{editId ? 'Actualizar' : 'Crear'} usuario</button>
              <button type="button" className="px-4 py-2 bg-white border border-slate-300 text-slate-800 rounded-lg hover:bg-slate-100" onClick={handleCloseUserModal}>Cancelar</button>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}