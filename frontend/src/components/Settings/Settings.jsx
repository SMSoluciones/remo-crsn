import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../utils/apiConfig';
import { showSuccess, showError } from '../../utils/toast';
import { useAuth } from '../../context/useAuth';
import { updateStudentByIdentifier, updateMyProfile } from '../../models/Student';

export default function Settings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ nombre: '', email: '', direccion: '', telefono: '' });
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [changing, setChanging] = useState(false);
  const [photoPreview, setPhotoPreview] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    // cargar ajustes desde localStorage si existen
    try {
      const saved = JSON.parse(localStorage.getItem('student_contact') || '{}');
      if (saved.profile) setProfile(prev => ({ ...prev, ...saved.profile }));
      if (saved.profile && saved.profile.photo) setPhotoPreview(saved.profile.photo);
    } catch (err) {
      console.error('Error loading settings from localStorage', err);
    }
    // precargar datos de perfil del usuario
    if (user) {
      setProfile(prev => ({ ...prev, nombre: `${user.nombre || ''} ${user.apellido || ''}`, email: user.email || '' }));
      if (user.avatar) setPhotoPreview(user.avatar);
    }
  }, [user]);

  const handleSave = async () => {
    try {
      const payload = { profile };
      localStorage.setItem('student_contact', JSON.stringify(payload));

      // If the current user is a student, try to persist the contact info to backend
      try {
        const identifier = user?.documento || user?.dni || user?.email;
        if (identifier) {
          const data = {};
          if (profile.email) data.email = profile.email;
          if (profile.telefono) data.celular = profile.telefono;
          if (profile.direccion) data.domicilio = profile.direccion;
          if (profile.photo) data.avatar = profile.photo;
          if (Object.keys(data).length > 0) {
            // prefer the authenticated-like endpoint
            try {
              const updated = await updateMyProfile(data, identifier);
              // if backend returned an avatar URL, update preview and local storage
              if (updated && updated.avatar) {
                setPhotoPreview(updated.avatar);
                setProfile(p => ({ ...p, photo: updated.avatar }));
                const payload2 = { profile: { ...profile, photo: updated.avatar } };
                localStorage.setItem('student_contact', JSON.stringify(payload2));
              }
            } catch (err) {
              console.warn('Error updating profile with updateMyProfile, trying fallback updateStudentByIdentifier...', err);
              updateStudentByIdentifier(identifier, data).catch(err2 => console.warn('No se pudo guardar en backend:', err2));
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
    setProfile({ nombre: user ? `${user.nombre || ''} ${user.apellido || ''}` : '', email: user?.email || '', direccion: '', telefono: '', photo: user?.avatar || '' });
    setPhotoPreview(user?.avatar || '');
    showSuccess('Información restaurada');
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setProfile(p => ({ ...p, photo: dataUrl }));
      setPhotoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async () => {
    if (!newPwd || newPwd.length < 6) {
      showError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPwd !== confirmPwd) {
      showError('Las contraseñas no coinciden');
      return;
    }
    setChanging(true);
    try {
      // prefer JWT authorization instead of sending identifier
      let token = null;
      try { const raw = localStorage.getItem('auth_user'); if (raw) token = JSON.parse(raw).token; } catch (err) {
        console.warn('Error reading auth token from localStorage', err);

      }
      if (!token) {
        showError('No autorizado para cambiar contraseña');
        setChanging(false);
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/users/change-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd })
      });
      const payload = await res.json();
      if (!res.ok) {
        showError(payload.error || 'No se pudo cambiar la contraseña');
        setChanging(false);
        return;
      }
      setChangePwdOpen(false);
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      showSuccess('Contraseña cambiada correctamente');
    } catch (err) {
      console.error('Error cambiando contraseña', err);
      showError('No se pudo cambiar la contraseña');
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-8 text-gray-700 max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">Configuración</h2>

      <section className="mb-6">
      <section className="mb-6">
        <h3 className="font-semibold mb-2">Perfil</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center gap-4">
            <div role="button" tabIndex={0} onClick={() => fileInputRef.current?.click()} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }} className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center cursor-pointer">
              {photoPreview ? (
                <img src={photoPreview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-600 font-bold">{(profile.nombre || '').split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase() || '—'}</div>
              )}
            </div>
            <div className="flex flex-col">
              <input value={profile.nombre || ''} placeholder="Nombre" className="border rounded px-3 py-2 bg-gray-100 text-gray-700 w-72" disabled />
              <label className="mt-2 text-sm text-gray-600">
                <span className="inline-block mr-2">Cambiar foto</span>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
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

      {changePwdOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setChangePwdOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Cambiar contraseña</h3>
            <div className="flex flex-col gap-3">
              <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} placeholder="Contraseña actual" className="border rounded px-3 py-2" />
              <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Nueva contraseña" className="border rounded px-3 py-2" />
              <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Confirmar nueva contraseña" className="border rounded px-3 py-2" />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setChangePwdOpen(false)} className="px-4 py-2 rounded bg-gray-200">Cancelar</button>
              <button onClick={handleChangePassword} disabled={changing} className="px-4 py-2 rounded bg-green-600 text-white">{changing ? 'Cambiando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
