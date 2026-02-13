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
import AddBoatReportModal from './AddBoatReportModal';
import { fetchBoatReports, deleteBoatReport } from '../../models/BoatReport';
import { showError, showSuccess } from '../../utils/toast';

export default function Boats() {
  const [boats, setBoats] = useState([]); // Asegurar que el estado inicial sea un array vacío
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState(BoatTypes[0]);
  const [estado, setEstado] = useState(BoatStatus.ACTIVO);
  const [showForm, setShowForm] = useState(false);
  const [showAddBoatModal, setShowAddBoatModal] = useState(false);
  const [showAddReportModal, setShowAddReportModal] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const role = String(user?.rol || '').trim().toLowerCase();

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
    // load reports
    const loadReports = async () => {
      setReportsLoading(true);
      try {
        const data = await fetchBoatReports().catch(() => []);
        setReports(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching boat reports:', err);
        setReports([]);
      } finally {
        setReportsLoading(false);
      }
    };
    loadReports();
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

  const handleDeleteReport = async (id) => {
    const allowed = ['admin', 'mantenimiento'];
    if (!allowed.includes(role)) { showError('No tienes permisos para eliminar reportes'); return; }
    if (!window.confirm('¿Eliminar este reporte?')) return;
    try {
      await deleteBoatReport(id, user);
      const data = await fetchBoatReports().catch(() => []);
      setReports(Array.isArray(data) ? data : []);
      showSuccess('Reporte eliminado');
    } catch (err) {
      console.error('Error eliminando reporte:', err);
      showError('No se pudo eliminar el reporte');
    }
  };

  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const filteredBoats = boats.filter(b =>
    (!filterTipo || b.tipo === filterTipo) && (!filterEstado || b.estado === filterEstado)
  );

  // panel de reportes cargados desde backend

        return (
          <ProtectedRoute>
            <div className="bg-gray-50 min-h-screen px-2 py-6 sm:px-8 sm:py-8 flex flex-col md:flex-row gap-8 max-w-xs sm:max-w-6xl mx-auto" data-aos="fade-up">
              <div className="flex-1 flex flex-col gap-8">
                <div className="flex items-center gap-2 mb-2">
                  <LifebuoyIcon className="h-7 w-7 text-green-700" />
                  <h2 className="text-2xl font-bold text-gray-800">Gestión de Botes</h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 mb-4 items-start">
                  <div className="flex flex-wrap gap-4">
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
                  </div>
                  {user && (user.rol === 'admin' || user.rol === 'profesor') && (
                    <div className="w-full sm:w-auto sm:ml-auto">
                      <button onClick={() => setShowAddBoatModal(true)} className="w-full sm:w-auto flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition">
                        <PlusIcon className="h-5 w-5" /> Nuevo Bote
                      </button>
                    </div>
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
                {/* Mobile: cards list (show on <sm) */}
                <div className="sm:hidden space-y-4" data-aos="fade-left">
                  {filteredBoats.map((b, index) => (
                    <div key={b.id || index} className="bg-white rounded-xl shadow px-4 py-4">
                      <div className="flex items-center gap-4">
                        <Avatar name={b.nombre} size="40" round={true} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-lg">{b.nombre}</div>
                              <div className="text-sm text-gray-600">{b.tipo}</div>
                            </div>
                            <div className="text-right">
                              <div className={`inline-block px-2 py-1 rounded text-xs font-bold ${b.estado === 'mantenimiento' ? 'bg-yellow-200 text-yellow-800' : b.estado === 'fuera_servicio' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>{b.estado}</div>
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-500">{format(new Date(b.fechaIngreso), 'dd-MM-yyyy')}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: table (show on sm+) */}
                <div className="hidden sm:block overflow-x-auto" data-aos="fade-left">
                  <table className="min-w-full bg-white rounded-xl shadow">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="py-2 px-4 text-left">Nombre</th>
                        <th className="py-2 px-4 text-left">Tipo</th>
                        <th className="py-2 px-4 text-left flex items-center gap-1">
                          <WrenchScrewdriverIcon className="h-5 w-5 inline text-yellow-600" /> Estado
                        </th>
                        <th className="py-2 px-4 text-left">Fecha Ingreso</th>
                        <th className="py-2 px-4 text-left">Remo</th>
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
                {/* Mobile: cada reporte como tarjeta individual */}
                <div className="sm:hidden space-y-3">
                  <h3 className="text-lg font-semibold mb-2 text-gray-700">Últimos reportes</h3>
                  {reportsLoading ? (
                    <div className="text-sm text-gray-500">Cargando...</div>
                  ) : reports.length === 0 ? (
                    <div className="text-sm text-gray-500">No hay reportes</div>
                  ) : (
                    reports.map(r => {
                      const id = r._id || r.id;
                      const boatName = (r.boatId && (r.boatId.nombre || r.boatId.name)) || 'Bote';
                      const fecha = r.fechaReporte ? new Date(r.fechaReporte).toLocaleDateString() : '';
                      return (
                        <div key={id} className="bg-white rounded-xl shadow px-4 py-3 flex items-center gap-3">
                          {r.fotoURL ? <img src={r.fotoURL} alt="foto" className="w-12 h-12 object-cover rounded" /> : <Avatar name={boatName} size="36" round={true} />}
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{boatName}</div>
                            <div className="text-sm text-gray-500">{fecha}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`px-2 py-1 rounded text-xs font-bold ${r.status === 'en_reparacion' ? 'bg-yellow-200 text-yellow-800' : r.status === 'cerrado' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>{r.status}</div>
                            {['admin','mantenimiento'].includes(role) && (
                              <button onClick={() => handleDeleteReport(id)} className="text-xs text-red-600 hover:underline">Eliminar</button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Desktop: card con la lista (mostrar en sm+) */}
                <div className="hidden sm:block bg-white rounded-xl shadow p-6" data-aos="fade-right">
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">Últimos reportes</h3>
                  <ul className="space-y-3">
                    {reportsLoading ? (
                      <li className="text-sm text-gray-500">Cargando...</li>
                    ) : reports.length === 0 ? (
                      <li className="text-sm text-gray-500">No hay reportes</li>
                    ) : (
                      reports.map(r => {
                        const id = r._id || r.id;
                        const boatName = (r.boatId && (r.boatId.nombre || r.boatId.name)) || 'Bote';
                        const fecha = r.fechaReporte ? new Date(r.fechaReporte).toLocaleDateString() : '';
                        return (
                          <li key={id} className="flex items-center gap-3">
                            {r.fotoURL ? <img src={r.fotoURL} alt="foto" className="w-10 h-10 object-cover rounded" /> : <Avatar name={boatName} size="32" round={true} />}
                            <span className="font-medium text-gray-800">{boatName}</span>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${r.status === 'en_reparacion' ? 'bg-yellow-200 text-yellow-800' : r.status === 'cerrado' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>{r.status}</span>
                            <span className="ml-auto text-gray-500">{fecha}</span>
                            {['admin','mantenimiento'].includes(role) && (
                              <button onClick={() => handleDeleteReport(id)} className="ml-3 text-sm text-red-600 hover:underline">Eliminar</button>
                            )}
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>
                <div className="bg-white rounded-xl shadow p-6" data-aos="fade-right">
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">Acciones rápidas</h3>
                  {user && (user.rol === 'admin' || user.rol === 'profesor') && (
                    <button onClick={() => setShowAddBoatModal(true)} className="w-full flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition mb-2">
                      <PlusIcon className="h-5 w-5" /> Nuevo Bote
                    </button>
                  )}
                    <button onClick={() => setShowAddReportModal(true)} className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
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
              {showAddReportModal && (
                <AddBoatReportModal
                  isOpen={showAddReportModal}
                  onRequestClose={() => setShowAddReportModal(false)}
                  boats={boats}
                  onReportAdded={async () => {
                    // refresh reports after adding
                    try {
                      setReportsLoading(true);
                      const data = await fetchBoatReports().catch(() => []);
                      setReports(Array.isArray(data) ? data : []);
                      setReportsLoading(false);
                      showSuccess('Reporte agregado');
                    } catch {
                      setReportsLoading(false);
                    }
                  }}
                />
              )}
          </ProtectedRoute>
        );
      }
