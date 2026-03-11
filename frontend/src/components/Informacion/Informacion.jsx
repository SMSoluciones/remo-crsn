import React, { useState, useEffect } from 'react';

export default function Informacion() {
  const [active, setActive] = useState('Reglamentaciones');
  const [mobileSelected, setMobileSelected] = useState(null);

  // Clear mobile selection when switching to desktop size to avoid duplicated content
  useEffect(() => {
    const handleResize = () => {
      try {
        if (window.innerWidth >= 640) {
          setMobileSelected(null);
        }
      } catch (e) {
        console.warn(e);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const items = [
    'Autoridades',
    'Reglamentaciones',
    'Zonas de Remo Autorizado',
    'Inscripciones',
    'Inscripciones a Eventos Internos'
  ];

  // Datos estáticos para Autoridades (únicos para móvil y escritorio)
  const profesores = [
    'Emilio Desantis (Head Coach)',
    'Dolores Amaya (Head Coach)',
    'Ignacio Daniel Bianchi (Coach Adultos)',
    'Gonzalo Brant (Coach Juveniles)'
  ];
  const subcomision = [
    'Pamela Borgetto (Presidente)',
    'Marcelo Brenna (Vicepresidente)',
    'Luis Espindola (Tesorero)',
    'Gaston Olmos (Secretario)',
    'Sebastian Muñoz (Vocal-Coordinador)',
    'German Veloz (Vocal)',
    'Magdalena Gallo (Vocal)'
  ];

  return (
    <div className="p-4 sm:p-6 w-full max-w-6xl mx-auto mt-2">
      <div className="mb-4">
        {/* Mobile: mostrar todas las secciones apiladas como botones que abren la sección */}
        <div className="block sm:hidden space-y-4">
          {!mobileSelected ? (
            items.map(label => (
              <button key={label} onClick={() => { setMobileSelected(label); setActive(label); }} className="w-full text-left bg-white rounded shadow p-4">
                <h3 className="text-md font-semibold mb-2">{label}</h3>
                <p className="text-sm text-gray-600">Pulsa para ver <strong>{label}</strong></p>
              </button>
            ))
          ) : (
            <div className="bg-white rounded shadow p-4">
              <button onClick={() => setMobileSelected(null)} className="mb-4 text-sm text-blue-600 hover:underline">&larr; Atrás</button>
              <h3 className="text-md font-semibold mb-2">{mobileSelected}</h3>
              {mobileSelected === 'Autoridades' ? (
                <div>
                  <h4 className="font-medium mt-2">Profesores</h4>
                  <ul className="text-sm text-gray-600 list-disc list-inside mb-3">
                    {profesores.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                  <h4 className="font-medium mt-2">Subcomisión</h4>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {subcomision.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-gray-600">Contenido de <strong>{mobileSelected}</strong> (aquí puedes agregar la información correspondiente).</p>
              )}
            </div>
          )}
        </div>

        {/* Desktop / tablet: pestañas (pills) */}
        <div className="hidden sm:flex" role="tablist" aria-label="Secciones">
          <div className="flex gap-2 overflow-x-auto whitespace-nowrap px-2 sm:px-0 flex-nowrap sm:flex-wrap pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
            {items.map(label => (
              <button
                key={label}
                role="tab"
                aria-selected={active === label}
                tabIndex={0}
                onClick={() => setActive(label)}
                className={`inline-flex flex-shrink-0 min-w-max text-sm px-3 py-2 rounded-full ${active === label ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido principal: mostrar sólo en pantallas >= sm para evitar duplicados en móvil */}
      <div className="hidden sm:block">
        <div className="bg-white rounded shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-2">{active}</h2>
          {active === 'Autoridades' ? (
            <div>
              <h4 className="font-medium mt-2">Profesores</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside mb-3">
                {profesores.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
              <h4 className="font-medium mt-2">Subcomisión</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside">
                {subcomision.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-600">Contenido de <strong>{active}</strong> (aquí puedes agregar la información correspondiente).</p>
          )}
        </div>
      </div>
    </div>
  );
}
