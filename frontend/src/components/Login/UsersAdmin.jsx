import React, { useEffect, useState } from 'react';
import { fetchUsers, createUser, updateUser, deleteUser, UserRoles } from '../../models/User';
import ChangePasswordModal from './ChangePasswordModal.jsx';
import { useAuth } from '../../context/useAuth';

export default function UsersAdmin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', documento: '', rol: UserRoles.ENTRENADOR, password: '' });
  const [editId, setEditId] = useState(null);
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
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (editId) {
      // If password is empty, don't send it to the server (so it won't be overwritten)
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const updated = await updateUser(editId, payload, user);
      setUsers(users.map(u => u._id === editId ? updated : u));
      setEditId(null);
    } else {
      const created = await createUser(form, user);
      setUsers([...users, created]);
    }
    setForm({ nombre: '', apellido: '', email: '', documento: '', rol: UserRoles.ENTRENADOR, password: '' });
  };

  const handleEdit = user => {
    setEditId(user._id);
    // Do not prefill password when editing
    setForm({ nombre: user.nombre, apellido: user.apellido, email: user.email, documento: user.documento || '', rol: user.rol, password: '' });
  };

  const handleDelete = async id => {
    await deleteUser(id, user);
    setUsers(users.filter(u => u._id !== id));
    setMenuOpen(null);
  };

  return (
    <div className="p-8 bg-gray-50 rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Administrar Usuarios</h2>

      <form onSubmit={handleSubmit} className="mb-8 flex flex-wrap gap-3 items-center">
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
        {editId && <button type="button" className="px-4 py-2 bg-gray-200 text-gray-800 rounded" onClick={() => { setEditId(null); setForm({ nombre: '', apellido: '', email: '', rol: UserRoles.ENTRENADOR }); }}>Cancelar</button>}
      </form>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apellido</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(u => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.apellido}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.rol}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                  <button onClick={() => setMenuOpen(menuOpen === u._id ? null : u._id)} className="text-gray-500 hover:text-gray-700">⋮</button>
                  {menuOpen === u._id && (
                    <div className="absolute right-6 mt-2 w-40 bg-white border rounded shadow-lg z-20">
                      <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => { handleEdit(u); setMenuOpen(null); }}>Editar</button>
                      <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => { setChangeUser(u); setShowChangeModal(true); setMenuOpen(null); }}>Cambiar contraseña</button>
                      <button className="block w-full text-left px-4 py-2 text-sm text-gray-400 cursor-not-allowed" disabled>Desactivar</button>
                      <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100" onClick={() => handleDelete(u._id)}>Eliminar</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ChangePasswordModal open={showChangeModal} onClose={() => { setShowChangeModal(false); setChangeUser(null); }} user={changeUser} />
    </div>
  );
}