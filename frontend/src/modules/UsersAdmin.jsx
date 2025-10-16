import React, { useEffect, useState } from 'react';
import { fetchUsers, createUser, updateUser, deleteUser, UserRoles } from '../models/User';
import { useAuth } from '../context/useAuth';

export default function UsersAdmin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', rol: UserRoles.ENTRENADOR });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    if (user?.rol === UserRoles.ADMIN) {
      fetchUsers().then(setUsers);
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
      const updated = await updateUser(editId, form);
      setUsers(users.map(u => u._id === editId ? updated : u));
      setEditId(null);
    } else {
      const created = await createUser(form);
      setUsers([...users, created]);
    }
    setForm({ nombre: '', apellido: '', email: '', rol: UserRoles.ENTRENADOR });
  };

  const handleEdit = user => {
    setEditId(user._id);
    setForm({ nombre: user.nombre, apellido: user.apellido, email: user.email, rol: user.rol });
  };

  const handleDelete = async id => {
    await deleteUser(id);
    setUsers(users.filter(u => u._id !== id));
  };

  return (
    <div>
      <h2>Administrar Usuarios</h2>
      <form onSubmit={handleSubmit}>
        <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" required />
        <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" required />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" required type="email" />
        <select name="rol" value={form.rol} onChange={handleChange} required>
          <option value={UserRoles.ADMIN}>Admin</option>
          <option value={UserRoles.ENTRENADOR}>Entrenador</option>
          <option value={UserRoles.MANTENIMIENTO}>Mantenimiento</option>
        </select>
        <button type="submit">{editId ? 'Actualizar' : 'Crear'} usuario</button>
        {editId && <button type="button" onClick={() => { setEditId(null); setForm({ nombre: '', apellido: '', email: '', rol: UserRoles.ENTRENADOR }); }}>Cancelar</button>}
      </form>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td>{u.nombre}</td>
              <td>{u.apellido}</td>
              <td>{u.email}</td>
              <td>{u.rol}</td>
              <td>
                <button onClick={() => handleEdit(u)}>Editar</button>
                <button onClick={() => handleDelete(u._id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
