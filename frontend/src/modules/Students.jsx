
import { useState } from 'react';
import ProtectedRoute from './ProtectedRoute';
import Avatar from 'react-avatar';
import { EllipsisVerticalIcon, UserIcon, PlusIcon } from '@heroicons/react/24/outline';

const mockStudents = [
  { id: 's1', nombre: 'Juan Ignacio', apellido: 'Principiano', domicilio: 'Almafuerte 381', nacimiento: '18/03/2013', dni: '53037855', celular: '3363009654', email: 'marianafelip84@hotmail.com', categoria: 'Escuelita' },
  { id: 's2', nombre: 'Cecilia', apellido: 'Lafalce', domicilio: 'Mitre 224   1 B', nacimiento: '30/09/1962', dni: '16049645', celular: '3364334028', email: 'cecilia_laf@hotmail.com', categoria: 'Adulto - Master' },
  { id: 's3', nombre: 'Edgar Martin', apellido: 'Ramirez', domicilio: 'Geronimo costa 179 bis', nacimiento: '30/01/2007', dni: '47620206', celular: '3364632952', email: 'zuleerica@gmail.com', categoria: 'Promocional' },
  { id: 's4', nombre: 'Stella Maris', apellido: 'Nasif', domicilio: 'José Ingenieros 176', nacimiento: '24/10/1960', dni: '14115381', celular: '3364 626162', email: 'Stellamna241060@gmail.com', categoria: 'Adulto - Master' },
  { id: 's5', nombre: 'Sebastian', apellido: 'Muñoz', domicilio: 'Rioja 66', nacimiento: '15/01/1990', dni: '35070283', celular: '3364205059', email: 'smunoz.id@gmail.com', categoria: 'Adulto - Master' },
  { id: 's6', nombre: 'Eliana', apellido: 'Borasi', domicilio: 'Italia 68', nacimiento: '25/01/1990', dni: '35070347', celular: '3364299379', email: 'eliborasi@gmail.com', categoria: 'Adulto - Master' },
  { id: 's7', nombre: 'Mateo', apellido: 'Schifino', domicilio: 'Don bosco 1134', nacimiento: '19/01/2012', dni: '52021998', celular: '154282370', email: 'schifinoeris@gmail.com', categoria: 'Promocional' },
  { id: 's8', nombre: 'Facundo', apellido: 'Vignoles', domicilio: 'Brown 229', nacimiento: '10/12/1975', dni: '24714974', celular: '3364290623', email: 'fvignoles@gmail.com', categoria: 'Adulto - Master' },
  { id: 's9', nombre: 'Román', apellido: 'Principe', domicilio: '25 de Mayo 549', nacimiento: '20/10/2009', dni: '49854262', celular: '3364185100', email: 'claudiprincipiano@gmail.com', categoria: 'Promocional' },
  { id: 's10', nombre: 'Ian Luca', apellido: 'Chomicz', domicilio: 'Mitre 115', nacimiento: '9/10/2013', dni: '53445258', celular: '3364340129', email: 'marganijorgelina@gmail.com', categoria: 'Escuelita' },
  { id: 's11', nombre: 'Nicolás', apellido: 'Bogado', domicilio: 'Balcarce 1872', nacimiento: '22/07/2004', dni: '45987825', celular: '3364187600', email: 'bogado.nico17@gmail.com', categoria: 'Promocional' },
  { id: 's12', nombre: 'Valentin', apellido: 'Colacilli', domicilio: 'Cernadas 317', nacimiento: '30/12/2010', dni: '50535755', celular: '3364381993', email: 'Eciminari@yahoo.com.ar', categoria: 'Promocional' },
  { id: 's13', nombre: 'Fernando', apellido: 'Villegas', domicilio: 'Liniers 1443', nacimiento: '23/05/1975', dni: '24642140', celular: '3402502099', email: 'Fernando.villegas.1975@gmail.com', categoria: 'Adulto - Master' },
  { id: 's14', nombre: 'Germán Andrés', apellido: 'Veloz', domicilio: 'De la Nación 1684', nacimiento: '17/08/1982', dni: '29559662', celular: '3364258321', email: 'germanveloz158@gmail.com', categoria: 'Adulto - Master' },
  { id: 's15', nombre: 'Genaro', apellido: 'Auligine spadaro', domicilio: 'España 562', nacimiento: '22/07/2012', dni: '52676503', celular: '3364305970', email: 'spadaroalexa7@gmail.com', categoria: 'Promocional' },
  { id: 's16', nombre: 'Pamela', apellido: 'Borgetto', domicilio: 'Nación 1684', nacimiento: '17/03/1989', dni: '33109488', celular: '3364256283', email: 'Pborgetto@gmail.com', categoria: 'Adulto - Master' },
  { id: 's17', nombre: 'Thiago Bautista', apellido: 'Giuggia', domicilio: 'Alvear 810 barrio primavera', nacimiento: '27/01/2010', dni: '49902670', celular: '3364674433', email: 'cattalingabriela59@gmail.com', categoria: 'Escuelita' },
  { id: 's18', nombre: 'Aley', apellido: 'Mendoza', domicilio: 'Grupo 5 casa 48', nacimiento: '20/11/2010', dni: '50402937', celular: '3364317662', email: 'aleylaramendoza@gmail.com', categoria: 'Promocional' },
  { id: 's19', nombre: 'Nancy Delia', apellido: 'Picabea', domicilio: 'Av Savio 540', nacimiento: '6/11/1961', dni: '14545636', celular: '3364 336111', email: 'nancypicabea@gmail.com', categoria: 'Adulto - Master' },
  { id: 's20', nombre: 'Agustin', apellido: 'Zeballos', domicilio: 'Publica 3 1680', nacimiento: '18/05/1999', dni: '41782738', celular: '3364601011', email: 'agusszeballos@gmail.com', categoria: 'Adulto - Master' },
  { id: 's21', nombre: 'Luis Alberto', apellido: 'Muñoz', domicilio: 'Damaso valdez 597', nacimiento: '28/09/1958', dni: '12519962', celular: '3364513512', email: 'luisalbertomz@gmail.com', categoria: 'Adulto - Master' },
  { id: 's22', nombre: 'IARA VICTORIA', apellido: 'RODRIGUEZ', domicilio: 'Bolivia 308', nacimiento: '30/10/2008', dni: '48943714', celular: '3364661462', email: 'almalexiara@gmail.com', categoria: 'Promocional' },
  { id: 's23', nombre: 'Javier Eduardo', apellido: 'Stelzer', domicilio: 'Juan B. Justo 280', nacimiento: '31/12/1983', dni: '30683417', celular: '3364518399', email: 'abogadostelzer@hotmail.com', categoria: 'Adulto - Master' },
  { id: 's24', nombre: 'Emiliano', apellido: 'Alegre', domicilio: 'FOREST 1932', nacimiento: '5/02/2010', dni: '49902631', celular: '3364391845', email: 'luovni@gmail.com', categoria: 'Promocional' },
  { id: 's25', nombre: 'Ciro', apellido: 'Rodriguez', domicilio: 'San martín 537 dto.1', nacimiento: '22/12/2015', dni: '55191797', celular: '3364661480', email: 'Miriamvictoria55amado@gmail.com', categoria: 'Escuelita' },
];

export default function Students() {

  const [students, setStudents] = useState(mockStudents);
  const [selected, setSelected] = useState('s1');
  const [search, setSearch] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [sheets, setSheets] = useState({}); // { studentId: [fichas...] }
  const [form, setForm] = useState({ fecha: '', entrenador: '', postura: 5, remada: 5, equilibrio: 5, coordinacion: 5, resistencia: 5, velocidad: 5, observaciones: '' });

  // Filtrado por nombre
  const filtered = students.filter(s =>
    (`${s.nombre} ${s.apellido}`.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedStudent = students.find(s => s.id === selected);
  const studentSheets = sheets[selected] || [];

  // Abrir perfil
  const handleOpenProfile = (id) => {
    setSelected(id);
    setShowProfile(true);
  };

  // Agregar ficha técnica
  const handleAddSheet = (e) => {
    e.preventDefault();
    setSheets(prev => ({
      ...prev,
      [selected]: [...(prev[selected] || []), { ...form, fecha: form.fecha || new Date().toISOString().slice(0,10) }]
    }));
    setForm({ fecha: '', entrenador: '', postura: 5, remada: 5, equilibrio: 5, coordinacion: 5, resistencia: 5, velocidad: 5, observaciones: '' });
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'entrenador']}>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="w-20 bg-white border-r flex flex-col items-center py-8 gap-8">
          <UserIcon className="h-7 w-7 text-gray-400" />
          <button className="bg-black rounded-full p-2 hover:bg-gray-800 transition">
            <PlusIcon className="h-6 w-6 text-white" />
          </button>
        </aside>
        {/* Main content */}
        <div className="flex-1 flex flex-col px-12 py-10">
          {!showProfile ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Team</h2>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-700">Club Regatas San Nicolás</span>
                  <img src="/vite.svg" alt="logo" className="h-8 w-8" />
                </div>
              </div>
              <div className="mb-8">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar alumno"
                  className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring focus:ring-green-200 bg-gray-100"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filtered.map(s => (
                  <div
                    key={s.id}
                    className={`relative rounded-xl shadow flex items-center gap-4 px-6 py-5 cursor-pointer transition-all ${selected === s.id ? 'bg-black' : 'bg-white hover:bg-gray-100'}`}
                    onClick={() => handleOpenProfile(s.id)}
                  >
                    <Avatar name={`${s.nombre} ${s.apellido}`} size="48" round={true} />
                    <div>
                      <div className={`font-semibold text-lg ${selected === s.id ? 'text-white' : 'text-gray-900'}`}>{s.nombre} {s.apellido}</div>
                      <div className={`text-sm ${selected === s.id ? 'text-gray-200' : 'text-gray-500'}`}>{s.categoria}</div>
                    </div>
                    <button className="absolute top-4 right-4"><EllipsisVerticalIcon className={`h-5 w-5 ${selected === s.id ? 'text-white' : 'text-gray-400'}`} /></button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="max-w-3xl mx-auto">
              <button className="mb-6 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onClick={() => setShowProfile(false)}>Volver</button>
              <div className="bg-white rounded-xl shadow p-8 mb-8 flex gap-8 items-center">
                <Avatar name={`${selectedStudent.nombre} ${selectedStudent.apellido}`} size="80" round={true} />
                <div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">{selectedStudent.nombre} {selectedStudent.apellido}</div>
                  <div className="text-gray-700 mb-1">DNI: {selectedStudent.dni}</div>
                  <div className="text-gray-700 mb-1">Edad: {selectedStudent.nacimiento}</div>
                  <div className="text-gray-700 mb-1">Categoría: {selectedStudent.categoria}</div>
                  <div className="text-gray-700 mb-1">Email: {selectedStudent.email}</div>
                  <div className="text-gray-700 mb-1">Domicilio: {selectedStudent.domicilio}</div>
                  <div className="text-gray-700 mb-1">Celular: {selectedStudent.celular}</div>
                </div>
              </div>
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Histórico de Fichas Técnicas</h3>
                {/* Gráfico de evolución de promedios */}
                {studentSheets.length > 0 && (
                  <div className="bg-white rounded-xl shadow p-6 mb-6">
                    <h4 className="text-lg font-bold mb-2 text-gray-700">Evolución de Promedios</h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={studentSheets.map((sheet, idx) => {
                        const puntajes = [sheet.postura, sheet.remada, sheet.equilibrio, sheet.coordinacion, sheet.resistencia, sheet.velocidad];
                        return {
                          fecha: sheet.fecha,
                          promedio: (puntajes.reduce((a, b) => a + b, 0) / puntajes.length).toFixed(2),
                          postura: sheet.postura,
                          remada: sheet.remada,
                          equilibrio: sheet.equilibrio,
                          coordinacion: sheet.coordinacion,
                          resistencia: sheet.resistencia,
                          velocidad: sheet.velocidad,
                        };
                      })}>
                        <XAxis dataKey="fecha" stroke="#888" fontSize={12} />
                        <YAxis domain={[0, 10]} stroke="#888" fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="promedio" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} name="Promedio" />
                        <Line type="monotone" dataKey="postura" stroke="#6366f1" strokeWidth={2} dot={false} name="Postura" />
                        <Line type="monotone" dataKey="remada" stroke="#f59e42" strokeWidth={2} dot={false} name="Remada" />
                        <Line type="monotone" dataKey="equilibrio" stroke="#06b6d4" strokeWidth={2} dot={false} name="Equilibrio" />
                        <Line type="monotone" dataKey="coordinacion" stroke="#eab308" strokeWidth={2} dot={false} name="Coordinación" />
                        <Line type="monotone" dataKey="resistencia" stroke="#ef4444" strokeWidth={2} dot={false} name="Resistencia" />
                        <Line type="monotone" dataKey="velocidad" stroke="#10b981" strokeWidth={2} dot={false} name="Velocidad" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="space-y-6">
                  {studentSheets.length === 0 ? (
                    <div className="text-gray-500">No hay fichas técnicas registradas.</div>
                  ) : (
                    studentSheets.map((sheet, idx) => {
                      const puntajes = [sheet.postura, sheet.remada, sheet.equilibrio, sheet.coordinacion, sheet.resistencia, sheet.velocidad];
                      const promedio = (puntajes.reduce((a, b) => a + b, 0) / puntajes.length).toFixed(1);
                      return (
                        <div key={idx} className="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-4 border-l-4" style={{ borderColor: promedio >= 8 ? '#22c55e' : promedio >= 6 ? '#facc15' : '#ef4444' }}>
                          <div className="flex gap-6 items-center mb-2">
                            <span className="font-bold text-gray-700 text-lg">{sheet.fecha}</span>
                            <span className="text-gray-500">Entrenador: <span className="font-semibold text-gray-700">{sheet.entrenador}</span></span>
                            <span className={`ml-auto px-3 py-1 rounded-full text-white font-bold text-sm ${promedio >= 8 ? 'bg-green-600' : promedio >= 6 ? 'bg-yellow-500' : 'bg-red-500'}`}>Promedio: {promedio}</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${sheet.postura >= 8 ? 'bg-green-100 text-green-700' : sheet.postura >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>Postura: {sheet.postura}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${sheet.remada >= 8 ? 'bg-green-100 text-green-700' : sheet.remada >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>Remada: {sheet.remada}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${sheet.equilibrio >= 8 ? 'bg-green-100 text-green-700' : sheet.equilibrio >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>Equilibrio: {sheet.equilibrio}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${sheet.coordinacion >= 8 ? 'bg-green-100 text-green-700' : sheet.coordinacion >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>Coordinación: {sheet.coordinacion}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${sheet.resistencia >= 8 ? 'bg-green-100 text-green-700' : sheet.resistencia >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>Resistencia: {sheet.resistencia}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${sheet.velocidad >= 8 ? 'bg-green-100 text-green-700' : sheet.velocidad >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>Velocidad: {sheet.velocidad}</span>
                            </div>
                          </div>
                          <div className="text-gray-700 mt-2"><span className="font-semibold">Observaciones:</span> {sheet.observaciones}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Agregar Ficha Técnica</h3>
                <form onSubmit={handleAddSheet} className="bg-white rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                    required
                    className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
                  />
                  <input
                    value={form.entrenador}
                    onChange={e => setForm(f => ({ ...f, entrenador: e.target.value }))}
                    placeholder="Entrenador responsable"
                    required
                    className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
                  />
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.postura}
                    onChange={e => setForm(f => ({ ...f, postura: Number(e.target.value) }))}
                    placeholder="Postura (1-10)"
                    required
                    className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
                  />
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.remada}
                    onChange={e => setForm(f => ({ ...f, remada: Number(e.target.value) }))}
                    placeholder="Remada (1-10)"
                    required
                    className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
                  />
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.equilibrio}
                    onChange={e => setForm(f => ({ ...f, equilibrio: Number(e.target.value) }))}
                    placeholder="Equilibrio (1-10)"
                    required
                    className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
                  />
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.coordinacion}
                    onChange={e => setForm(f => ({ ...f, coordinacion: Number(e.target.value) }))}
                    placeholder="Coordinación (1-10)"
                    required
                    className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
                  />
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.resistencia}
                    onChange={e => setForm(f => ({ ...f, resistencia: Number(e.target.value) }))}
                    placeholder="Resistencia (1-10)"
                    required
                    className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
                  />
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.velocidad}
                    onChange={e => setForm(f => ({ ...f, velocidad: Number(e.target.value) }))}
                    placeholder="Velocidad (1-10)"
                    required
                    className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
                  />
                  <textarea
                    value={form.observaciones}
                    onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                    placeholder="Observaciones"
                    className="border rounded px-3 py-2 focus:outline-none focus:ring w-full col-span-1 md:col-span-3"
                  />
                  <button type="submit" className="bg-green-700 text-white rounded px-4 py-2 hover:bg-green-800 transition col-span-1 md:col-span-3">Guardar ficha</button>
                </form>
              </div>
            </div>
          )}
        </div>
        <button className="fixed bottom-8 right-8 bg-black rounded-full p-4 shadow-lg hover:bg-gray-800 transition z-50">
          <EllipsisVerticalIcon className="h-6 w-6 text-white" />
        </button>
      </div>
    </ProtectedRoute>
  );
}
