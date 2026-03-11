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
              // If the backend returns 400 for /by-identifier (older deploys), treat as expected
              if (err && err.status === 400) {
                console.debug('by-identifier update failed (may be older backend). Falling back to _id update.', err.body || err.message);
              } else {
                console.warn('Error updating student profile by identifier:', err);
              }
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
                    } catch (e) { console.warn('Error listando alumnos para debugging', e);}
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
    <div className="settings-page w-full max-w-5xl mx-auto text-slate-700 dark:text-slate-200">
      <div className="settings-surface bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-5 sm:p-7 mb-5">
        <h2 className="settings-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">Configuración</h2>
        <p className="settings-subtext text-sm text-slate-500 dark:text-slate-400 mt-1">Actualiza tu información de contacto y preferencias de seguridad.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <section className="settings-surface xl:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-5 sm:p-6">
          <h3 className="settings-heading font-semibold text-slate-900 dark:text-slate-100 mb-4">Perfil</h3>
          <div className="flex items-center gap-4">
            <div className="settings-avatar w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <div className="settings-heading text-slate-700 dark:text-slate-200 font-bold text-lg">{(profile.nombre || '').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || '—'}</div>
            </div>
            <div className="min-w-0">
              <p className="settings-subtext text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Nombre</p>
              <p className="settings-heading font-semibold text-slate-800 dark:text-slate-100 truncate">{profile.nombre || '—'}</p>
              <p className="settings-subtext text-sm text-slate-500 dark:text-slate-400 truncate">{profile.email || 'Sin email'}</p>
            </div>
          </div>
        </section>

        <section className="settings-surface xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-5 sm:p-6">
          <h3 className="settings-heading font-semibold text-slate-900 dark:text-slate-100 mb-4">Contacto del alumno</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="settings-subtext block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Email</label>
              <input value={profile.email || ''} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="Email" className="settings-input w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800" />
            </div>
            <div>
              <label className="settings-subtext block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Teléfono</label>
              <input value={profile.telefono || ''} onChange={e => setProfile(p => ({ ...p, telefono: e.target.value }))} placeholder="Teléfono" className="settings-input w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800" />
            </div>
            <div className="sm:col-span-2">
              <label className="settings-subtext block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Dirección</label>
              <input value={profile.direccion || ''} onChange={e => setProfile(p => ({ ...p, direccion: e.target.value }))} placeholder="Dirección" className="settings-input w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800" />
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-700 settings-divider">
            <h3 className="settings-heading font-semibold text-slate-900 dark:text-slate-100 mb-3">Seguridad</h3>
            <button onClick={() => setChangePwdOpen(true)} className="settings-btn-neutral inline-flex items-center px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cambiar contraseña</button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button onClick={handleSave} className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium">Guardar</button>
            <button onClick={handleReset} className="settings-btn-neutral px-5 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors font-medium">Restaurar</button>
          </div>
        </section>
      </div>

      <ChangePasswordModal open={changePwdOpen} onClose={() => setChangePwdOpen(false)} user={user} />
    </div>
  );
}
