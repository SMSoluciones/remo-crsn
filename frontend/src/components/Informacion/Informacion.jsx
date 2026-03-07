import React, { useState } from 'react';

export default function Informacion() {
  const [active, setActive] = useState('Reglamentaciones');

  const items = [
    'Reglamentaciones',
    'Zonas de Remo Autorizado',
    'Inscripciones',
    'Inscripciones a Eventos Internos'
  ];

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex flex-row items-center gap-2">
          {items.map(label => (
            <button
              key={label}
              onClick={() => setActive(label)}
              className={`text-sm px-3 py-1 rounded ${active === label ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-2">{active}</h2>
        <p className="text-sm text-gray-600">Contenido de <strong>{active}</strong> (aquí puedes agregar la información correspondiente).</p>
      </div>
    </div>
  );
}
