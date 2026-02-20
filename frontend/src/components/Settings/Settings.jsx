import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../utils/apiConfig';
import { showSuccess, showError } from '../../utils/toast';
import { useAuth } from '../../context/useAuth';
import { updateMyProfile, updateStudent } from '../../models/Student';
import { updateMyProfile as updateMyUserProfile } from '../../models/User';
import ChangePasswordModal from '../Login/ChangePasswordModal';

export default function Settings() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState({ nombre: '', email: '', direccion: '', telefono: '' });
  const [changePwdOpen, setChangePwdOpen] = useState(false);

  useEffect(() => {
    // cargar ajustes desde localStorage si existen
    try {
      const saved = JSON.parse(localStorage.getItem('student_contact') || '{}');
      if (saved.profile) setProfile(prev => ({ ...prev, ...saved.profile }));
    } catch (err) {
      console.error('Error loading settings from localStorage', err);
    }
    // precargar datos de perfil del usuario
    if (user) {
      setProfile(prev => ({ ...prev, nombre: `${user.nombre || ''} ${user.apellido || ''}`, email: user.email || '' }));
    }
  }, [user]);

  const handleSave = async () => {
    try {
      const payload = { profile };
      localStorage.setItem('student_contact', JSON.stringify(payload));

      // If the current user is a student, try to persist the contact info to backend
      try {
        const identifier = user?.documento || user?.dni || user?.email || profile.email;
        if (identifier) {
          const data = {};
          if (profile.email) data.email = profile.email;
          if (profile.telefono) data.celular = profile.telefono;
          if (profile.direccion) data.domicilio = profile.direccion;
          if (Object.keys(data).length > 0) {
            // First update the user model (authenticated)
            try {
              if (user) {
                const updatedUser = await updateMyUserProfile(data, user).catch(() => null);
                if (updatedUser) {
                  // update auth context so UI reflects new email immediately
                  try { login(updatedUser); } catch (e) { console.warn('Error updating auth context after profile update', e); }
                }
              }
            } catch (err) {
              console.warn('Error updating user profile (non-fatal):', err);
            }
            // Also attempt to update student record for backward compatibility
            try {
              // Try the existing update by identifier endpoint first
              await updateMyProfile(data, identifier);
            } catch (err) {
              console.warn('Error updating student profile by identifier:', err);
              // Workaround for environments where /by-identifier route is caught by /:id (deployed servers):
              // fetch all students and update by _id when we find a matching email/dni.
              try {
                const res = await fetch(`${API_BASE_URL}/api/students`);
                if (res.ok) {
                  const students = await res.json();
                  const idNorm = (identifier || '').toString().trim().toLowerCase();
                  // diagnostic log
                  console.debug('Workaround: buscando alumno por identificador', { identifier: idNorm, total: students.length });
                  const found = students.find(s => {
                    const email = (s.email || '').toString().trim().toLowerCase();
                    const dni = (s.dni || '').toString().trim().toLowerCase();
                    const doc = (s.documento || '').toString().trim().toLowerCase();
                    return email === idNorm || dni === idNorm || doc === idNorm;
                  });
                  if (found && (found._id || found.id)) {
                    const idToUse = found._id || found.id;
                    console.debug('Workaround: alumno encontrado', { id: idToUse, email: found.email, dni: found.dni });
                    await updateStudent(idToUse, data);
                  } else {
                    console.warn('Alumno no encontrado en lista local al intentar workaround', { identifier: idNorm });
                    // also list first few students emails for debugging
                    try {
                      console.debug('First 10 students (emails/dni):', students.slice(0, 10).map(s => ({ email: s.email, dni: s.dni })));
                    } catch (e) { /* ignore */ }
                  }
                } else {
                  console.warn('No se pudo obtener lista de alumnos para workaround');
                }
              } catch (err2) {
                console.warn('Error en workaround para actualizar alumno por id:', err2);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Error intentando guardar en backend', err);
      }

      showSuccess('Información de contacto guardada');
    } catch (err) {
      console.error('Error guardando información de contacto', err);
      showError('No se pudo guardar la información de contacto');
    }
  };

  const handleReset = () => {
    setProfile({ nombre: user ? `${user.nombre || ''} ${user.apellido || ''}` : '', email: user?.email || '', direccion: '', telefono: '' });
    showSuccess('Información restaurada');
  };

  // Password change handled by shared ChangePasswordModal

  return (
    <div className="bg-white rounded-xl shadow p-8 text-gray-700 max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">Configuración</h2>

      <section className="mb-6">
      <section className="mb-6">
        <h3 className="font-semibold mb-2">Perfil</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
              <div className="text-gray-600 font-bold">{(profile.nombre || '').split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase() || '—'}</div>
            </div>
            <div className="flex flex-col">
              <input value={profile.nombre || ''} placeholder="Nombre" className="border rounded px-3 py-2 bg-gray-100 text-gray-700 w-72" disabled />
            </div>
          </div>
        </div>
      </section>
      </section>

      <section className="mb-6">
        <h3 className="font-semibold mb-2">Contacto del alumno</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input value={profile.email || ''} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="Email" className="border rounded px-3 py-2" />
          <input value={profile.telefono || ''} onChange={e => setProfile(p => ({ ...p, telefono: e.target.value }))} placeholder="Teléfono" className="border rounded px-3 py-2" />
          <input value={profile.direccion || ''} onChange={e => setProfile(p => ({ ...p, direccion: e.target.value }))} placeholder="Dirección" className="border rounded px-3 py-2 col-span-1 sm:col-span-2" />
        </div>
      </section>

      <section className="mb-6">
        <h3 className="font-semibold mb-2">Seguridad</h3>
        <div className="flex gap-4">
          <button onClick={() => setChangePwdOpen(true)} className="bg-gray-100 px-4 py-2 rounded">Cambiar contraseña</button>
        </div>
      </section>

      <div className="flex gap-3 mt-4">
        <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded">Guardar</button>
        <button onClick={handleReset} className="bg-gray-200 px-4 py-2 rounded">Restaurar</button>
      </div>

      <ChangePasswordModal open={changePwdOpen} onClose={() => setChangePwdOpen(false)} user={user} />
    </div>
  );
}
