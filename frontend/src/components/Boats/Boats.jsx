import { useState, useEffect, useContext } from 'react';
import { BoatStatus, BoatTypes } from '../../models/Boat';
import ProtectedRoute from '../ProtectedRoute';
import { LifebuoyIcon, WrenchScrewdriverIcon, FunnelIcon, PlusIcon } from '@heroicons/react/24/outline';
import Avatar from 'react-avatar';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/apiConfig';
import { format } from 'date-fns';
import { AuthContext } from '../../context/AuthContext';
import AddBoatsModal from './AddBoatsModal';

export default function Boats() {
  const [boats, setBoats] = useState([]); // Asegurar que el estado inicial sea un array vacío
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState(BoatTypes[0]);
  const [estado, setEstado] = useState(BoatStatus.ACTIVO);
  const [showForm, setShowForm] = useState(false);
  const [showAddBoatModal, setShowAddBoatModal] = useState(false);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchBoats = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/boats`);
        if (Array.isArray(response.data)) {
          setBoats(response.data);
        } else {
          console.error('La respuesta del backend no es un array:', response.data);
        }
      } catch (error) {
        console.error('Error fetching boats:', error);
      }
    };

    fetchBoats();
  }, []);

  const handleAddBoat = (e) => {
    e.preventDefault();
    setBoats([...boats, {
      id: 'b' + (boats.length + 1),
      nombre,
      tipo,
      estado,
      fechaIngreso: new Date().toISOString().slice(0,10)
    }]);
    setNombre('');
    setTipo('');
    setEstado('');
    setShowForm(false);
  };

  const handleBoatAdded = (newBoat) => {
    setBoats((prevBoats) => [...prevBoats, newBoat]);
  };

  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const filteredBoats = boats.filter(b =>
    (!filterTipo || b.tipo === filterTipo) && (!filterEstado || b.estado === filterEstado)
  );

  // Mock paneles laterales
  const mockReports = [
    { id: 'r1', nombre: 'Bote 2', estado: 'mantenimiento', fecha: '2025-10-10', responsable: 'Carlos M.' },
    { id: 'r2', nombre: 'Bote 1', estado: 'activo', fecha: '2025-10-12', responsable: 'Ana L.' },
  ];

        return (
          <ProtectedRoute>
            <div className="bg-gray-50 min-h-screen p-8 flex flex-col md:flex-row gap-8" data-aos="fade-up">
              <div className="flex-1 flex flex-col gap-8">
                <div className="flex items-center gap-2 mb-2">
                  <LifebuoyIcon className="h-7 w-7 text-green-700" />
                  <h2 className="text-2xl font-bold text-gray-800">Gestión de Botes</h2>
                </div>
                <div className="flex gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <FunnelIcon className="h-5 w-5 text-gray-400" />
                    <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="border rounded px-2 py-1">
                      <option value="">Tipo</option>
                      {BoatTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <FunnelIcon className="h-5 w-5 text-gray-400" />
                    <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="border rounded px-2 py-1">
                      <option value="">Estado</option>
                      {Object.values(BoatStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {user && (user.rol === 'admin' || user.rol === 'profesor') && (
                    <button onClick={() => setShowAddBoatModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition">
                      <PlusIcon className="h-5 w-5" /> Nuevo Bote
                    </button>
                  )}
                </div>
                {showForm && (
                  <form onSubmit={handleAddBoat} className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4" data-aos="zoom-in">
                    <input
                      value={nombre}
                      onChange={e => setNombre(e.target.value)}
                      placeholder="Nombre"
                      required
                      className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
                    />
                    <select
                      value={tipo}
                      onChange={e => setTipo(e.target.value)}
                      className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
                      required
                    >
                      <option value="">Tipo</option>
                      {BoatTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select
                      value={estado}
                      onChange={e => setEstado(e.target.value)}
                      className="border rounded px-3 py-2 focus:outline-none focus:ring w-full"
                      required
                    >
                      <option value="">Estado</option>
                      {Object.values(BoatStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 transition">Guardar</button>
                  </form>
                )}
                <div className="overflow-x-auto" data-aos="fade-left">
                  <table className="min-w-full bg-white rounded-xl shadow">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="py-2 px-4 text-left">Nombre</th>
                        <th className="py-2 px-4 text-left">Tipo</th>
                        <th className="py-2 px-4 text-left flex items-center gap-1">
                          <WrenchScrewdriverIcon className="h-5 w-5 inline text-yellow-600" /> Estado
                        </th>
                        <th className="py-2 px-4 text-left">Fecha Ingreso</th>
                        <th className="py-2 px-4 text-left">Row</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBoats.map((b, index) => (
                        <tr key={b.id || index} className="border-b">
                          <td className="py-2 px-4 flex items-center gap-2">
                            <Avatar name={b.nombre} size="28" round={true} />
                            <span>{b.nombre}</span>
                          </td>
                          <td className="py-2 px-4">{b.tipo}</td>
                          <td className="py-2 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${b.estado === 'mantenimiento' ? 'bg-yellow-200 text-yellow-800' : b.estado === 'fuera_servicio' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>{b.estado}</span>
                          </td>
                          <td className="py-2 px-4">{format(new Date(b.fechaIngreso), 'dd-MM-yyyy')}</td>
                          <td className="px-4 py-2 border">{b.row}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="w-full md:w-80 flex flex-col gap-8">
                <div className="bg-white rounded-xl shadow p-6" data-aos="fade-right">
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">Últimos reportes</h3>
                  <ul className="space-y-3">
                    {mockReports.map(r => (
                      <li key={r.id} className="flex items-center gap-3">
                        <Avatar name={r.responsable} size="32" round={true} />
                        <span className="font-medium text-gray-800">{r.nombre}</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${r.estado === 'mantenimiento' ? 'bg-yellow-200 text-yellow-800' : r.estado === 'fuera_servicio' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>{r.estado}</span>
                        <span className="ml-auto text-gray-500">{r.fecha}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white rounded-xl shadow p-6" data-aos="fade-right">
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">Acciones rápidas</h3>
                  {user && (user.rol === 'admin' || user.rol === 'profesor') && (
                    <button onClick={() => setShowAddBoatModal(true)} className="w-full flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition mb-2">
                      <PlusIcon className="h-5 w-5" /> Nuevo Bote
                    </button>
                  )}
                  <button className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                    <WrenchScrewdriverIcon className="h-5 w-5" /> Reportar Falla
                  </button>
                </div>
              </div>
            </div>
            {showAddBoatModal && (
              <AddBoatsModal
                onClose={() => setShowAddBoatModal(false)}
                onBoatAdded={handleBoatAdded}
              />
            )}
          </ProtectedRoute>
        );
      }
