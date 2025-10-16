import React, { useEffect, useState } from 'react';
import { fetchUsers, createUser, updateUser, deleteUser, UserRoles } from '../models/User';
import { useAuth } from '../context/useAuth';

export default function UsersAdmin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', rol: UserRoles.ENTRENADOR });
  const [editId, setEditId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);

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
    setMenuOpen(null);
  };

  // Estilos modernos para la tabla y menú
  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  };
  const thStyle = {
    background: '#f7f7f7',
    padding: '12px',
    fontWeight: 600,
    color: '#333',
    borderBottom: '1px solid #eee',
    textAlign: 'left',
  };
  const tdStyle = {
    padding: '12px',
    borderBottom: '1px solid #eee',
    color: '#444',
    verticalAlign: 'middle',
    background: '#fff',
  };
  const menuBtnStyle = {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px 8px',
  };
  const menuStyle = {
    position: 'absolute',
    right: 0,
    top: '100%',
    background: '#fff',
    border: '1px solid #eee',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    zIndex: 10,
    minWidth: '140px',
  };
  const menuItemStyle = {
    display: 'block',
    width: '100%',
    padding: '10px 16px',
    border: 'none',
    background: 'none',
    textAlign: 'left',
    color: '#333',
    fontSize: '15px',
    cursor: 'pointer',
  };

  return (
    <div style={{ padding: '32px', background: '#f9f9f9', borderRadius: '16px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px', color: '#222' }}>Administrar Usuarios</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" required style={{ padding: '8px', borderRadius: 6, border: '1px solid #ddd', minWidth: 120 }} />
        <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" required style={{ padding: '8px', borderRadius: 6, border: '1px solid #ddd', minWidth: 120 }} />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" required type="email" style={{ padding: '8px', borderRadius: 6, border: '1px solid #ddd', minWidth: 180 }} />
        <select name="rol" value={form.rol} onChange={handleChange} required style={{ padding: '8px', borderRadius: 6, border: '1px solid #ddd', minWidth: 140 }}>
          <option value={UserRoles.ADMIN}>Admin</option>
          <option value={UserRoles.ENTRENADOR}>Entrenador</option>
          <option value={UserRoles.MANTENIMIENTO}>Mantenimiento</option>
        </select>
        <button type="submit" style={{ padding: '8px 18px', borderRadius: 6, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 600 }}>{editId ? 'Actualizar' : 'Crear'} usuario</button>
        {editId && <button type="button" style={{ padding: '8px 18px', borderRadius: 6, background: '#eee', color: '#333', border: 'none', fontWeight: 600 }} onClick={() => { setEditId(null); setForm({ nombre: '', apellido: '', email: '', rol: UserRoles.ENTRENADOR }); }}>Cancelar</button>}
      </form>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Apellido</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Rol</th>
              <th style={thStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} style={{ background: menuOpen === u._id ? '#f5f7fa' : '#fff' }}>
                <td style={tdStyle}>{u.nombre}</td>
                <td style={tdStyle}>{u.apellido}</td>
                <td style={tdStyle}>{u.email}</td>
                <td style={tdStyle}>{u.rol}</td>
                <td style={{ ...tdStyle, position: 'relative' }}>
                  <button onClick={() => setMenuOpen(menuOpen === u._id ? null : u._id)} style={menuBtnStyle}>⋮</button>
                  {menuOpen === u._id && (
                    <div style={menuStyle}>
                      {/* Opciones preparadas para futuras funcionalidades */}
                      <button style={menuItemStyle} onClick={() => { handleEdit(u); setMenuOpen(null); }}>Editar</button>
                      <button style={menuItemStyle} disabled>Desactivar</button>
                      <button style={{ ...menuItemStyle, color: '#d32f2f' }} onClick={() => handleDelete(u._id)}>Eliminar</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}