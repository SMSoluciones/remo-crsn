import { useState, useEffect, useContext } from 'react';
import { BoatStatus, BoatTypes, fetchBoats } from '../../models/Boat';
import ProtectedRoute from '../ProtectedRoute';
import { LifebuoyIcon, WrenchScrewdriverIcon, FunnelIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Avatar from 'react-avatar';
import { format } from 'date-fns';
import { AuthContext } from '../../context/AuthContext';
import AddBoatReportModal from './AddBoatReportModal';
import ManageReportsModal from './ManageReportsModal';
import ManageBoatsModal from './ManageBoatsModal';
import ManageOarsModal from './ManageOarsModal';
import ManageSeatsModal from './ManageSeatsModal';
import BoatTechnicalSheetModal from './BoatTechnicalSheetModal';
import Remar from '../Remar/Remar';
import { fetchBoatReports, deleteBoatReport } from '../../models/BoatReport';
import { fetchBoatUsages } from '../../models/BoatUsage';
import { fetchOars, OarStatus } from '../../models/Oar';
import { fetchSeats, SeatStatus } from '../../models/Seat';
import { showError, showSuccess } from '../../utils/toast';

export default function Boats() {
  const [activeTab, setActiveTab] = useState('botes');
  const [boats, setBoats] = useState([]); // Asegurar que el estado inicial sea un array vacío
  const [oars, setOars] = useState([]);
  const [seats, setSeats] = useState([]);
  const [showAddReportModal, setShowAddReportModal] = useState(false);
  const [showManageReportsModal, setShowManageReportsModal] = useState(false);
  const [showManageBoatsModal, setShowManageBoatsModal] = useState(false);
  const [showManageOarsModal, setShowManageOarsModal] = useState(false);
  const [showManageSeatsModal, setShowManageSeatsModal] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [showRemarModal, setShowRemarModal] = useState(false);
  const [remarBoatId, setRemarBoatId] = useState('');
  const [showTechnicalSheetModal, setShowTechnicalSheetModal] = useState(false);
  const [selectedBoat, setSelectedBoat] = useState(null);
  const [activeBoatLocks, setActiveBoatLocks] = useState({});
  const [filterOarTipo, setFilterOarTipo] = useState('');
  const [filterOarEstado, setFilterOarEstado] = useState('');
  const [filterSeatEstado, setFilterSeatEstado] = useState('');
  const { user } = useContext(AuthContext);
  const role = String(user?.rol || '').trim().toLowerCase();
  const canDeleteReports = ['admin', 'subcomision'].includes(role);
  const canManageFleetAssets = ['admin', 'mantenimiento', 'subcomision', 'entrenador', 'profesores'].includes(role);

  const loadActiveLocks = async () => {
    try {
      const usages = await fetchBoatUsages().catch(() => []);
      let arr = [];
      if (Array.isArray(usages)) arr = usages;
      else if (usages && Array.isArray(usages.data)) arr = usages.data;
      else if (usages && Array.isArray(usages.items)) arr = usages.items;
      else arr = [];
      const locks = {};
      const now = new Date();
      arr.forEach(u => {
        const boatId = (u.boatId || u.boat || (u.boat && u.boat._id) || null);
        if (!boatId) return;
        let endIso = u.estimatedReturn || u.estimated_return || u.estimatedReturnAt || null;
        if (!endIso) {
          const start = u.requestedAt || u.salida || u.createdAt || u.requested_at || null;
          const hours = (u.durationHours ?? u.hours ?? u.horas) || null;
          if (start && hours) {
            try {
              const d = new Date(start);
              if (!isNaN(d.getTime())) d.setHours(d.getHours() + Number(hours));
              endIso = d.toISOString();
            } catch (e) { console.log(`Error calculating end date for boat ${boatId}:`, e); }
          }
        }
        if (endIso) {
          try {
            const endDate = new Date(endIso);
            if (!isNaN(endDate.getTime()) && endDate > now) {
              locks[String(boatId)] = endDate.toISOString();
            }
          } catch (e) { console.log(`Error parsing end date for boat ${boatId}:`, e); }
        }
      });
      setActiveBoatLocks(locks);
    } catch (err) {
      console.error('Error cargando usos de botes:', err);
      setActiveBoatLocks({});
    }
  };

  const getBoatName = (boatRef) => {
    if (!boatRef) return 'Bote';
    if (typeof boatRef === 'object') return boatRef.nombre || boatRef.name || 'Bote';
    // boatRef is likely an id string - try to find in loaded boats
    const found = boats.find(b => (b._id === boatRef || b.id === boatRef));
    return found ? (found.nombre || found.name || 'Bote') : 'Bote';
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchBoats().catch(() => []);
        setBoats(Array.isArray(data) ? data : []);
      } catch {
        console.error('Error cargando botes:');
      }
    })();
    (async () => {
      try {
        const data = await fetchOars().catch(() => []);
        setOars(Array.isArray(data) ? data : []);
      } catch {
        console.error('Error cargando remos:');
      }
    })();
    (async () => {
      try {
        const data = await fetchSeats().catch(() => []);
        setSeats(Array.isArray(data) ? data : []);
      } catch {
        console.error('Error cargando asientos:');
      }
    })();
    // load active boat usages / locks
    loadActiveLocks();
    // load reports
    const loadReports = async () => {
      setReportsLoading(true);
      try {
        const data = await fetchBoatReports().catch(() => []);
        setReports(Array.isArray(data) ? data : []);
      } catch {
        console.error('Error fetching boat reports:');
        setReports([]);
      } finally {
        setReportsLoading(false);
      }
    };
    loadReports();
  }, []);

  const handleDeleteReport = async (id) => {
    if (!canDeleteReports) { showError('No tienes permisos para eliminar reportes'); return; }
    if (!window.confirm('¿Eliminar este reporte?')) return;
    try {
      await deleteBoatReport(id, user);
      const data = await fetchBoatReports().catch(() => []);
      setReports(Array.isArray(data) ? data : []);
      showSuccess('Reporte eliminado');
    } catch {
      console.error('Error eliminando reporte:');
      showError('No se pudo eliminar el reporte');
    }
  };

  const handleOpenTechnicalSheet = (boat) => {
    setSelectedBoat(boat);
    setShowTechnicalSheetModal(true);
  };

  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const filteredBoats = boats.filter(b =>
    (!filterTipo || b.tipo === filterTipo) && (!filterEstado || b.estado === filterEstado)
  );
  const filteredOars = oars.filter((oar) =>
    (!filterOarTipo || oar.tipo === filterOarTipo) && (!filterOarEstado || oar.estado === filterOarEstado)
  );
  const filteredSeats = seats.filter((seat) => !filterSeatEstado || seat.estado === filterSeatEstado);

  const activeBoatsCount = boats.filter((b) => b.estado === 'activo').length;
  const maintenanceBoatsCount = boats.filter((b) => b.estado === 'mantenimiento').length;
  const outOfServiceBoatsCount = boats.filter((b) => b.estado === 'fuera_servicio').length;
  const activeOarsCount = oars.filter((o) => o.estado === 'activo').length;
  const maintenanceOarsCount = oars.filter((o) => o.estado === 'mantenimiento').length;
  const outOfServiceOarsCount = oars.filter((o) => o.estado === 'fuera_servicio').length;
  const activeSeatsCount = seats.filter((s) => s.estado === 'activo').length;
  const maintenanceSeatsCount = seats.filter((s) => s.estado === 'mantenimiento').length;
  const outOfServiceSeatsCount = seats.filter((s) => s.estado === 'fuera_servicio').length;

  const statusLabel = (status) => {
    if (status === 'activo') return 'Activo';
    if (status === 'mantenimiento') return 'Mantenimiento';
    if (status === 'fuera_servicio') return 'Fuera de servicio';
    return status || 'Sin estado';
  };

  const statusClass = (status) => {
    if (status === 'mantenimiento') return 'bg-amber-100 text-amber-800 ring-amber-200';
    if (status === 'fuera_servicio') return 'bg-red-100 text-red-800 ring-red-200';
    return 'bg-emerald-100 text-emerald-800 ring-emerald-200';
  };

  // calcular los 5 reportes más recientes (por fechaReporte / createdAt / fecha)
  const toTime = (r) => {
    const d = r?.fechaReporte || r?.createdAt || r?.fecha || r?.created_at || null;
    const t = d ? new Date(d).getTime() : 0;
    return Number.isFinite(t) ? t : 0;
  };
  const latestReports = Array.isArray(reports) ? [...reports].sort((a, b) => toTime(b) - toTime(a)).slice(0, 3) : [];

  // panel de reportes cargados desde backend

        return (
          <ProtectedRoute>
            <div className="bg-gray-50 min-h-screen px-4 py-8 sm:px-10 sm:py-10 flex flex-col md:flex-row gap-8 w-full sm:max-w-7xl mx-auto" data-aos="fade-up">
              <div className="flex-1 flex flex-col gap-8">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                  <div className="mb-4 inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
                    <button type="button" onClick={() => setActiveTab('botes')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === 'botes' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>Gestion de Botes</button>
                    <button type="button" onClick={() => setActiveTab('remos')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === 'remos' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>Registro de Remos</button>
                    <button type="button" onClick={() => setActiveTab('asientos')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === 'asientos' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>Registro de Asientos</button>
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <LifebuoyIcon className="h-7 w-7 text-emerald-700" />
                        <h2 className="text-2xl font-bold text-slate-800">{activeTab === 'botes' ? 'Gestión de Botes' : activeTab === 'remos' ? 'Registro de Remos' : 'Registro de Asientos'}</h2>
                      </div>
                      <p className="text-sm text-slate-600">
                        {activeTab === 'botes'
                          ? 'Controla el estado de la flota y gestiona reportes de forma centralizada.'
                          : activeTab === 'remos'
                            ? 'Registra cada par de remo por tipo (hacha/cuchara), largo y estado.'
                            : 'Registra y controla el estado operativo de cada asiento.'}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full lg:w-auto lg:min-w-[360px]">
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-2 sm:px-3 py-2 text-center">
                        <div className="text-[11px] sm:text-xs uppercase tracking-wide text-emerald-700">Activos</div>
                        <div className="text-lg sm:text-xl font-bold text-emerald-800 leading-tight">{activeTab === 'botes' ? activeBoatsCount : activeTab === 'remos' ? activeOarsCount : activeSeatsCount}</div>
                      </div>
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-2 sm:px-3 py-2 text-center">
                        <div className="text-[11px] sm:text-xs uppercase tracking-wide text-amber-700">Manten.</div>
                        <div className="text-lg sm:text-xl font-bold text-amber-800 leading-tight">{activeTab === 'botes' ? maintenanceBoatsCount : activeTab === 'remos' ? maintenanceOarsCount : maintenanceSeatsCount}</div>
                      </div>
                      <div className="rounded-xl border border-red-200 bg-red-50 px-2 sm:px-3 py-2 text-center">
                        <div className="text-[11px] sm:text-xs uppercase tracking-wide text-red-700">Fuera serv.</div>
                        <div className="text-lg sm:text-xl font-bold text-red-800 leading-tight">{activeTab === 'botes' ? outOfServiceBoatsCount : activeTab === 'remos' ? outOfServiceOarsCount : outOfServiceSeatsCount}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-end">
                    {activeTab === 'botes' && (
                      <>
                        <div className="w-full sm:w-auto">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Tipo</label>
                          <div className="flex items-center gap-2">
                            <FunnelIcon className="h-5 w-5 text-slate-400" />
                            <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="w-full sm:w-40 border border-slate-300 rounded-lg px-3 py-2 bg-white">
                              <option value="">Tipo</option>
                              {BoatTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="w-full sm:w-auto">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Estado</label>
                          <div className="flex items-center gap-2">
                            <FunnelIcon className="h-5 w-5 text-slate-400" />
                            <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="w-full sm:w-44 border border-slate-300 rounded-lg px-3 py-2 bg-white">
                              <option value="">Estado</option>
                              {Object.values(BoatStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>
                      </>
                    )}

                    {activeTab === 'remos' && (
                      <>
                        <div className="w-full sm:w-auto">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Tipo</label>
                          <div className="flex items-center gap-2">
                            <FunnelIcon className="h-5 w-5 text-slate-400" />
                            <select value={filterOarTipo} onChange={e => setFilterOarTipo(e.target.value)} className="w-full sm:w-40 border border-slate-300 rounded-lg px-3 py-2 bg-white">
                              <option value="">Tipo</option>
                              <option value="hacha">hacha</option>
                              <option value="cuchara">cuchara</option>
                            </select>
                          </div>
                        </div>
                        <div className="w-full sm:w-auto">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Estado</label>
                          <div className="flex items-center gap-2">
                            <FunnelIcon className="h-5 w-5 text-slate-400" />
                            <select value={filterOarEstado} onChange={e => setFilterOarEstado(e.target.value)} className="w-full sm:w-44 border border-slate-300 rounded-lg px-3 py-2 bg-white">
                              <option value="">Estado</option>
                              {Object.values(OarStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>
                      </>
                    )}

                    {activeTab === 'asientos' && (
                      <div className="w-full sm:w-auto">
                        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Estado</label>
                        <div className="flex items-center gap-2">
                          <FunnelIcon className="h-5 w-5 text-slate-400" />
                          <select value={filterSeatEstado} onChange={e => setFilterSeatEstado(e.target.value)} className="w-full sm:w-44 border border-slate-300 rounded-lg px-3 py-2 bg-white">
                            <option value="">Estado</option>
                            {Object.values(SeatStatus).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterTipo('');
                          setFilterEstado('');
                          setFilterOarTipo('');
                          setFilterOarEstado('');
                          setFilterSeatEstado('');
                        }}
                        className="w-full sm:w-auto px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  </div>
                </div>

                {activeTab === 'botes' && (
                  <>
                    <div className="sm:hidden space-y-4" data-aos="fade-left">
                      {filteredBoats.map((b, index) => (
                        <button
                          type="button"
                          key={b.id || index}
                          onClick={() => handleOpenTechnicalSheet(b)}
                          className="w-full text-left bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-4 hover:border-emerald-300 hover:shadow transition"
                        >
                          <div className="flex items-start gap-4">
                            <Avatar name={b.nombre} size="40" round={true} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-lg leading-tight text-gray-900">{b.nombre}</div>
                                  <div className="text-sm text-gray-600 flex flex-wrap items-center gap-2 mt-1">
                                    <span className="capitalize">{b.tipo}</span>
                                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 whitespace-nowrap">{b.row !== undefined && b.row !== null ? `Remo ${b.row}` : 'Remo -'}</span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0 pt-0.5">
                                  <div className={`inline-block px-2 py-1 rounded-full ring-1 text-xs font-bold whitespace-nowrap ${statusClass(b.estado)}`}>{statusLabel(b.estado)}</div>
                                </div>
                              </div>
                              <div className="mt-2 text-sm text-gray-500">{format(new Date(b.fechaIngreso), 'dd-MM-yyyy')}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm" data-aos="fade-left">
                      <table className="min-w-full">
                        <thead className="bg-slate-100 border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4 text-left text-slate-700 font-semibold">Nombre</th>
                            <th className="py-3 px-4 text-left text-slate-700 font-semibold">Tipo</th>
                            <th className="py-3 px-4 text-left text-slate-700 font-semibold"><span className="inline-flex items-center gap-1"><WrenchScrewdriverIcon className="h-4 w-4 text-amber-600" /> Estado</span></th>
                            <th className="py-3 px-4 text-left text-slate-700 font-semibold">Fecha Ingreso</th>
                            <th className="py-3 px-4 text-left text-slate-700 font-semibold">Remos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBoats.map((b, index) => (
                            <tr key={b.id || index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleOpenTechnicalSheet(b)}>
                              <td className="py-3 px-4 flex items-center gap-2 font-medium text-slate-800"><Avatar name={b.nombre} size="28" round={true} /><span>{b.nombre}</span></td>
                              <td className="py-3 px-4 capitalize text-slate-700">{b.tipo}</td>
                              <td className="py-3 px-4"><span className={`px-2.5 py-1 rounded-full ring-1 text-xs font-bold ${statusClass(b.estado)}`}>{statusLabel(b.estado)}</span></td>
                              <td className="py-3 px-4 text-slate-700">{format(new Date(b.fechaIngreso), 'dd-MM-yyyy')}</td>
                              <td className="py-3 px-4 text-slate-700">{(b.row !== undefined && b.row !== null) ? b.row : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {activeTab === 'remos' && (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm" data-aos="fade-left">
                    <table className="min-w-full">
                      <thead className="bg-slate-100 border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4 text-left text-slate-700 font-semibold">Par de remo</th>
                          <th className="py-3 px-4 text-left text-slate-700 font-semibold">Tipo</th>
                          <th className="py-3 px-4 text-left text-slate-700 font-semibold">Largo (hacha)</th>
                          <th className="py-3 px-4 text-left text-slate-700 font-semibold">Estado</th>
                          <th className="py-3 px-4 text-left text-slate-700 font-semibold">Fecha ingreso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOars.map((o, index) => (
                          <tr key={o._id || index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-medium text-slate-800">{o.nombre}</td>
                            <td className="py-3 px-4 capitalize text-slate-700">{o.tipo}</td>
                            <td className="py-3 px-4 text-slate-700 capitalize">{o.tipo === 'hacha' ? (o.largoHacha || '-') : '-'}</td>
                            <td className="py-3 px-4"><span className={`px-2.5 py-1 rounded-full ring-1 text-xs font-bold ${statusClass(o.estado)}`}>{statusLabel(o.estado)}</span></td>
                            <td className="py-3 px-4 text-slate-700">{o.fechaIngreso ? format(new Date(o.fechaIngreso), 'dd-MM-yyyy') : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'asientos' && (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm" data-aos="fade-left">
                    <table className="min-w-full">
                      <thead className="bg-slate-100 border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4 text-left text-slate-700 font-semibold">Asiento</th>
                          <th className="py-3 px-4 text-left text-slate-700 font-semibold">Estado</th>
                          <th className="py-3 px-4 text-left text-slate-700 font-semibold">Fecha ingreso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSeats.map((s, index) => (
                          <tr key={s._id || index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-medium text-slate-800">{s.nombre}</td>
                            <td className="py-3 px-4"><span className={`px-2.5 py-1 rounded-full ring-1 text-xs font-bold ${statusClass(s.estado)}`}>{statusLabel(s.estado)}</span></td>
                            <td className="py-3 px-4 text-slate-700">{s.fechaIngreso ? format(new Date(s.fechaIngreso), 'dd-MM-yyyy') : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="w-full md:w-96 flex flex-col gap-8">
                {/* Mobile: cada reporte como tarjeta individual */}
                {activeTab === 'botes' && <div className="sm:hidden space-y-3">
                  <h3 className="text-lg font-semibold mb-2 text-gray-700">Últimos reportes</h3>
                  {reportsLoading ? (
                    <div className="text-sm text-gray-500">Cargando...</div>
                  ) : latestReports.length === 0 ? (
                    <div className="text-sm text-gray-500">No hay reportes</div>
                  ) : (
                    <>
                      {latestReports.map(r => {
                      const id = r._id || r.id;
                      const boatName = getBoatName(r.boatId);
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
                            {canDeleteReports && (
                              <button onClick={() => handleDeleteReport(id)} aria-label="Eliminar reporte" className="text-red-600 hover:text-red-800">
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    </>
                  )}
                </div>}

                {/* Desktop: card con la lista (mostrar en sm+) */}
                {activeTab === 'botes' && <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-sm p-6" data-aos="fade-right">
                  <h3 className="text-lg font-semibold mb-4 text-slate-800">Últimos reportes</h3>
                  <ul className="space-y-3">
                    {reportsLoading ? (
                      <li className="text-sm text-gray-500">Cargando...</li>
                    ) : latestReports.length === 0 ? (
                      <li className="text-sm text-gray-500">No hay reportes</li>
                    ) : (
                      latestReports.map(r => {
                        const id = r._id || r.id;
                        const boatName = getBoatName(r.boatId);
                        const fecha = r.fechaReporte ? new Date(r.fechaReporte).toLocaleDateString() : '';
                        return (
                          <li key={id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                            {r.fotoURL ? <img src={r.fotoURL} alt="foto" className="w-10 h-10 object-cover rounded" /> : <Avatar name={boatName} size="32" round={true} />}
                            <span className="font-medium text-slate-800">{boatName}</span>
                            <span className={`px-2 py-1 rounded-full ring-1 text-xs font-bold ${r.status === 'en_reparacion' ? 'bg-yellow-100 text-yellow-800 ring-yellow-200' : r.status === 'cerrado' ? 'bg-emerald-100 text-emerald-800 ring-emerald-200' : 'bg-red-100 text-red-800 ring-red-200'}`}>{r.status}</span>
                            <span className="ml-auto text-slate-500">{fecha}</span>
                            {canDeleteReports && (
                              <button onClick={() => handleDeleteReport(id)} aria-label="Eliminar reporte" className="ml-3 text-red-600 hover:text-red-800">
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            )}
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6" data-aos="fade-right">
                  <h3 className="text-lg font-semibold mb-4 text-slate-800">Acciones rápidas</h3>
                  {canManageFleetAssets && (
                    <button
                      onClick={() => {
                        if (activeTab === 'botes') setShowManageBoatsModal(true);
                        if (activeTab === 'remos') setShowManageOarsModal(true);
                        if (activeTab === 'asientos') setShowManageSeatsModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition mb-2 shadow-sm"
                    >
                      <PlusIcon className="h-5 w-5" /> {activeTab === 'botes' ? 'Administrar botes' : activeTab === 'remos' ? 'Administrar remos' : 'Administrar asientos'}
                    </button>
                  )}
                  {activeTab === 'botes' && <div className="flex flex-col gap-2">
                    <button onClick={() => setShowAddReportModal(true)} className="w-full flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm">
                      <WrenchScrewdriverIcon className="h-5 w-5" /> Reportar Falla
                    </button>
                    {canManageFleetAssets && (
                      <button onClick={() => setShowManageReportsModal(true)} className="w-full flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm">
                        <WrenchScrewdriverIcon className="h-5 w-5" /> Administrar reportes
                      </button>
                    )}
                  </div>}
                </div>
              </div>
            </div>
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
              {showManageReportsModal && (
                <ManageReportsModal
                  isOpen={showManageReportsModal}
                  onRequestClose={() => { setShowManageReportsModal(false); /* refresh */ (async () => { setReportsLoading(true); const data = await fetchBoatReports().catch(() => []); setReports(Array.isArray(data) ? data : []); setReportsLoading(false); })(); }}
                  boats={boats}
                  user={user}
                  onUpdated={async () => { const data = await fetchBoatReports().catch(() => []); setReports(Array.isArray(data) ? data : []); }}
                />
              )}
              {showManageBoatsModal && (
                <ManageBoatsModal
                  isOpen={showManageBoatsModal}
                  onRequestClose={() => { setShowManageBoatsModal(false); /* refresh */ (async () => { const data = await fetchBoats().catch(() => []); setBoats(Array.isArray(data) ? data : []); })(); }}
                  user={user}
                  onUpdated={async () => { const data = await fetchBoats().catch(() => []); setBoats(Array.isArray(data) ? data : []); }}
                />
              )}
              {showManageOarsModal && (
                <ManageOarsModal
                  isOpen={showManageOarsModal}
                  onRequestClose={() => { setShowManageOarsModal(false); (async () => { const data = await fetchOars().catch(() => []); setOars(Array.isArray(data) ? data : []); })(); }}
                  user={user}
                  onUpdated={async () => { const data = await fetchOars().catch(() => []); setOars(Array.isArray(data) ? data : []); }}
                />
              )}
              {showManageSeatsModal && (
                <ManageSeatsModal
                  isOpen={showManageSeatsModal}
                  onRequestClose={() => { setShowManageSeatsModal(false); (async () => { const data = await fetchSeats().catch(() => []); setSeats(Array.isArray(data) ? data : []); })(); }}
                  user={user}
                  onUpdated={async () => { const data = await fetchSeats().catch(() => []); setSeats(Array.isArray(data) ? data : []); }}
                />
              )}
              {showRemarModal && (
                <Remar
                  isOpen={showRemarModal}
                  onRequestClose={() => { setShowRemarModal(false); /* refresh locks after modal closes in case a usage was created */ loadActiveLocks(); setRemarBoatId(''); }}
                  boatsList={boats}
                  activeBoatLocks={activeBoatLocks}
                  initialSelectedBoatId={remarBoatId}
                  user={user}
                />
              )}
              {showTechnicalSheetModal && (
                <BoatTechnicalSheetModal
                  isOpen={showTechnicalSheetModal}
                  onRequestClose={() => { setShowTechnicalSheetModal(false); setSelectedBoat(null); }}
                  boat={selectedBoat}
                  reports={reports}
                />
              )}
          </ProtectedRoute>
        );
      }
