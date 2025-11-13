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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onRequestClose}
      />
      <div
        className="relative z-10 bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[85vh] overflow-y-auto p-4"
        data-aos="fade-up"
      >
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h3 className="text-lg font-semibold">Administración de Usuarios</h3>
          <button onClick={onRequestClose} className="text-gray-500 hover:text-gray-700">Cerrar</button>
        </div>
        <UsersAdmin />
      </div>
    </div>
  );
}
