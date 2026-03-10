import React, { useEffect } from 'react';
import UsersAdmin from './UsersAdmin.jsx';
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function UsersAdminModal({ isOpen, onRequestClose }) {
  useEffect(() => {
    AOS.init({ duration: 300, easing: 'ease-out', once: true });
  }, []);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 modal-overlay p-2 sm:p-4 flex items-start sm:items-center justify-center overflow-y-auto" onClick={onRequestClose}>
      <div
        className="modal-panel relative z-10 w-full max-w-5xl bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 max-h-[94vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 tracking-wide">Administracion de usuarios</h3>
          <button onClick={onRequestClose} className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100">Cerrar</button>
        </div>
        <div className="p-3 sm:p-4">
          <UsersAdmin />
        </div>
      </div>
    </div>
  );
}
