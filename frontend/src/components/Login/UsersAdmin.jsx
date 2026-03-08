import React, { useEffect, useState } from 'react';
import { fetchUsers, createUser, updateUser, deleteUser, UserRoles } from '../../models/User';
import ChangePasswordModal from './ChangePasswordModal.jsx';
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
  const [menuOpen, setMenuOpen] = useState(null);
  const [changeUser, setChangeUser] = useState(null);
  const [showChangeModal, setShowChangeModal] = useState(false);

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

  const handleDelete = async id => {
    await deleteUser(id, user);
    setUsers(users.filter(u => u._id !== id));
    setMenuOpen(null);
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
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mainUsers.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleEdit(u)}>
                    <td className="px-4 py-2 text-sm text-gray-900">{u.nombre}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{u.apellido}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{u.email}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{u.rol}</td>
                    <td className="px-4 py-2 text-sm text-right relative" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === u._id ? null : u._id); }} className="text-gray-500 hover:text-gray-700">⋮</button>
                      {menuOpen === u._id && (
                        <div className="absolute right-4 bottom-full mb-2 w-44 bg-white border rounded shadow-lg z-20">
                          <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); handleEdit(u); setMenuOpen(null); }}>Editar</button>
                          <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); setChangeUser(u); setShowChangeModal(true); setMenuOpen(null); }}>Cambiar contraseña</button>
                          <button className="block w-full text-left px-4 py-2 text-sm text-gray-400 cursor-not-allowed" disabled>Desactivar</button>
                          <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); handleDelete(u._id); }}>Eliminar</button>
                        </div>
                      )}
                    </td>
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
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {alumnos.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleEdit(u)}>
                    <td className="px-4 py-2 text-sm text-gray-900">{u.nombre}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{u.apellido}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{u.email}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{u.documento || '—'}</td>
                    <td className="px-4 py-2 text-sm text-right relative" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === u._id ? null : u._id); }} className="text-gray-500 hover:text-gray-700">⋮</button>
                      {menuOpen === u._id && (
                        <div className="absolute right-4 bottom-full mb-2 w-44 bg-white border rounded shadow-lg z-20">
                          <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); handleEdit(u); setMenuOpen(null); }}>Editar</button>
                          <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); setChangeUser(u); setShowChangeModal(true); setMenuOpen(null); }}>Cambiar contraseña</button>
                          <button className="block w-full text-left px-4 py-2 text-sm text-gray-400 cursor-not-allowed" disabled>Desactivar</button>
                          <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); handleDelete(u._id); }}>Eliminar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={handleCloseUserModal} />
          <div className="relative z-10 bg-white rounded-xl shadow-xl w-full max-w-4xl p-6">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-lg font-semibold">{editId ? 'Modificar Usuario' : 'Crear Usuario'}</h3>
              <button onClick={handleCloseUserModal} className="text-gray-500 hover:text-gray-700">Cerrar</button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-center">
              <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" required className="px-3 py-2 border rounded w-40" />
              <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" required className="px-3 py-2 border rounded w-40" />
              <input name="email" value={form.email} onChange={handleChange} placeholder="Email" required type="email" className="px-3 py-2 border rounded w-56" />
              <input name="documento" value={form.documento} onChange={handleChange} placeholder="Documento" className="px-3 py-2 border rounded w-40" />
              <input name="password" value={form.password} onChange={handleChange} placeholder={editId ? 'Nueva contraseña (opcional)' : 'Contraseña'} type="password" className="px-3 py-2 border rounded w-40" required={!editId} />

              <select name="rol" value={form.rol} onChange={handleChange} required className="px-3 py-2 border rounded w-40">
                <option value={UserRoles.ADMIN}>Admin</option>
                <option value={UserRoles.ENTRENADOR}>Entrenador</option>
                <option value={UserRoles.MANTENIMIENTO}>Mantenimiento</option>
                <option value={UserRoles.ALUMNOS}>Alumnos</option>
                <option value={UserRoles.SUBCOMISION}>Subcomision</option>
              </select>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-medium">{editId ? 'Actualizar' : 'Crear'} usuario</button>
              <button type="button" className="px-4 py-2 bg-gray-200 text-gray-800 rounded" onClick={handleCloseUserModal}>Cancelar</button>
            </form>
          </div>
        </div>
      )}
      <ChangePasswordModal open={showChangeModal} onClose={() => { setShowChangeModal(false); setChangeUser(null); }} user={changeUser} />
    </div>
  );
}