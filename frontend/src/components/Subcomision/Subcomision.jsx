import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  WalletIcon,
  TrashIcon,
  ChevronDownIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import ExcelJS from 'exceljs';
import ProtectedRoute from '../ProtectedRoute';
import { useAuth } from '../../context/useAuth';
import {
  addEventExpense,
  createEvent,
  deleteEvent,
  deleteEventExpense,
  fetchEvents,
  updateEvent,
} from '../../models/Event';
import { showError, showSuccess } from '../../utils/toast';

const sections = [
  { key: 'eventos', label: 'Eventos', icon: CalendarDaysIcon, description: 'Planificacion y seguimiento de eventos institucionales.' },
  { key: 'tareas', label: 'Tareas', icon: CheckCircleIcon, description: 'Organizacion de pendientes y responsables de subcomision.' },
  { key: 'reuniones', label: 'Reuniones', icon: UsersIcon, description: 'Agenda y registro de reuniones de trabajo.' },
  { key: 'reparaciones', label: 'Reparaciones', icon: WrenchScrewdriverIcon, description: 'Control de trabajos tecnicos y mantenimientos.' },
  { key: 'cartera', label: 'Cartera', icon: WalletIcon, description: 'Seguimiento economico y estado de fondos.' },
];

export default function Subcomision() {
  const EVENTS_PER_PAGE = 4;
  const [activeSection, setActiveSection] = useState('eventos');
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    lugar: '',
    elementosNecesarios: '',
    observacionesGenerales: '',
    encargado: '',
    totalEntrada: '',
  });
  const [expenseForms, setExpenseForms] = useState({});
  const [savingEvent, setSavingEvent] = useState(false);
  const [savingExpenseEventId, setSavingExpenseEventId] = useState('');
  const [deletingEventId, setDeletingEventId] = useState('');
  const [deletingExpenseId, setDeletingExpenseId] = useState('');
  const [expandedEventId, setExpandedEventId] = useState('');
  const [eventsPage, setEventsPage] = useState(1);
  const [exportingEventId, setExportingEventId] = useState('');
  const [showCreateEventForm, setShowCreateEventForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState('');
  const [editingEventForm, setEditingEventForm] = useState({
    title: '',
    date: '',
    lugar: '',
    elementosNecesarios: '',
    observacionesGenerales: '',
    encargado: '',
    totalEntrada: '',
  });
  const [savingEditEvent, setSavingEditEvent] = useState(false);

  const currentSection = useMemo(
    () => sections.find((section) => section.key === activeSection) || sections[0],
    [activeSection]
  );

  const loadEvents = async () => {
    setEventsLoading(true);
    try {
      const data = await fetchEvents();
      const arr = Array.isArray(data) ? data : [];
      const sorted = arr
        .slice()
        .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      setEvents(sorted);
    } catch (err) {
      console.error('Error cargando eventos de subcomision:', err);
      showError('No se pudieron cargar los eventos');
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'eventos') loadEvents();
  }, [activeSection]);

  const parseElementos = (rawValue) =>
    String(rawValue || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-AR');
  };

  const sanitizeFileName = (value) => String(value || 'evento').replace(/[^a-zA-Z0-9_-]/g, '_');

  const getEventTotal = (event) =>
    (Array.isArray(event?.gastos) ? event.gastos : []).reduce((acc, gasto) => acc + Number(gasto?.monto || 0), 0);

  const getEventTotalEntrada = (event) => Number(event?.totalEntrada || 0);

  const getEventRecaudacion = (event) => getEventTotalEntrada(event) - getEventTotal(event);

  const totalEventsPages = useMemo(
    () => Math.max(1, Math.ceil(events.length / EVENTS_PER_PAGE)),
    [events.length]
  );

  const paginatedEvents = useMemo(() => {
    const startIndex = (eventsPage - 1) * EVENTS_PER_PAGE;
    return events.slice(startIndex, startIndex + EVENTS_PER_PAGE);
  }, [events, eventsPage]);

  useEffect(() => {
    if (eventsPage > totalEventsPages) {
      setEventsPage(totalEventsPages);
    }
  }, [eventsPage, totalEventsPages]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!eventForm.title || !eventForm.date || !eventForm.lugar || !eventForm.encargado) {
      showError('Completa nombre, fecha, lugar y encargado del evento');
      return;
    }

    setSavingEvent(true);
    try {
      const payload = {
        title: eventForm.title.trim(),
        date: eventForm.date,
        lugar: eventForm.lugar.trim(),
        elementosNecesarios: parseElementos(eventForm.elementosNecesarios),
        observacionesGenerales: eventForm.observacionesGenerales.trim(),
        encargado: eventForm.encargado.trim(),
        totalEntrada: eventForm.totalEntrada === '' ? 0 : Number(eventForm.totalEntrada),
        description: eventForm.observacionesGenerales.trim(),
      };
      const created = await createEvent(payload, user);
      setEvents((prev) => [created, ...prev]);
      setEventsPage(1);
      setExpandedEventId(String(created?._id || created?.id || ''));
      setShowCreateEventForm(false);
      setEventForm({
        title: '',
        date: '',
        lugar: '',
        elementosNecesarios: '',
        observacionesGenerales: '',
        encargado: '',
        totalEntrada: '',
      });
      showSuccess('Evento registrado');
    } catch (err) {
      console.error('Error creando evento de subcomision:', err);
      showError('No se pudo registrar el evento');
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!eventId) return;
    if (!window.confirm('Eliminar este evento?')) return;
    try {
      setDeletingEventId(eventId);
      await deleteEvent(eventId, user);
      setEvents((prev) => prev.filter((event) => String(event._id || event.id) !== String(eventId)));
      if (String(expandedEventId) === String(eventId)) setExpandedEventId('');
      showSuccess('Evento eliminado');
    } catch (err) {
      console.error('Error eliminando evento:', err);
      showError('No se pudo eliminar el evento');
    } finally {
      setDeletingEventId('');
    }
  };

  const startEditingEvent = (event) => {
    const eventId = String(event?._id || event?.id || '');
    if (!eventId) return;
    setEditingEventId(eventId);
    setEditingEventForm({
      title: String(event?.title || '').trim(),
      date: event?.date ? new Date(event.date).toISOString().slice(0, 10) : '',
      lugar: String(event?.lugar || '').trim(),
      elementosNecesarios: Array.isArray(event?.elementosNecesarios)
        ? event.elementosNecesarios.join(', ')
        : '',
      observacionesGenerales: String(event?.observacionesGenerales || event?.description || '').trim(),
      encargado: String(event?.encargado || '').trim(),
      totalEntrada: Number(event?.totalEntrada || 0) > 0 ? String(Number(event.totalEntrada)) : '',
    });
  };

  const cancelEditingEvent = () => {
    setEditingEventId('');
    setEditingEventForm({
      title: '',
      date: '',
      lugar: '',
      elementosNecesarios: '',
      observacionesGenerales: '',
      encargado: '',
      totalEntrada: '',
    });
  };

  const saveEditingEvent = async (eventId) => {
    if (!editingEventForm.title || !editingEventForm.date || !editingEventForm.lugar || !editingEventForm.encargado) {
      showError('Completa nombre, fecha, lugar y encargado para guardar cambios');
      return;
    }

    try {
      setSavingEditEvent(true);
      const payload = {
        title: editingEventForm.title.trim(),
        date: editingEventForm.date,
        lugar: editingEventForm.lugar.trim(),
        elementosNecesarios: parseElementos(editingEventForm.elementosNecesarios),
        observacionesGenerales: editingEventForm.observacionesGenerales.trim(),
        encargado: editingEventForm.encargado.trim(),
        totalEntrada: editingEventForm.totalEntrada === '' ? 0 : Number(editingEventForm.totalEntrada),
        description: editingEventForm.observacionesGenerales.trim(),
      };
      const updated = await updateEvent(eventId, payload, user);
      setEvents((prev) => prev.map((event) => (String(event._id || event.id) === String(eventId) ? updated : event)));
      cancelEditingEvent();
      showSuccess('Evento actualizado');
    } catch (err) {
      console.error('Error actualizando evento:', err);
      showError('No se pudo actualizar el evento');
    } finally {
      setSavingEditEvent(false);
    }
  };

  const toggleEventDetails = (eventId) => {
    setExpandedEventId((prev) => (String(prev) === String(eventId) ? '' : String(eventId)));
  };

  const handleExpenseChange = (eventId, field, value) => {
    setExpenseForms((prev) => ({
      ...prev,
      [eventId]: {
        concepto: '',
        monto: '',
        fecha: '',
        detalle: '',
        ...(prev[eventId] || {}),
        [field]: value,
      },
    }));
  };

  const handleAddExpense = async (eventId) => {
    const form = expenseForms[eventId] || {};
    const concepto = String(form.concepto || '').trim();
    const monto = Number(form.monto);
    const fecha = form.fecha;
    const detalle = String(form.detalle || '').trim();

    if (!concepto) {
      showError('Ingresa el concepto del gasto');
      return;
    }
    if (!Number.isFinite(monto) || monto < 0) {
      showError('Ingresa un monto valido');
      return;
    }

    try {
      setSavingExpenseEventId(eventId);
      const updated = await addEventExpense(eventId, { concepto, monto, fecha, detalle }, user);
      setEvents((prev) => prev.map((event) => (String(event._id || event.id) === String(eventId) ? updated : event)));
      setExpenseForms((prev) => ({
        ...prev,
        [eventId]: { concepto: '', monto: '', fecha: '', detalle: '' },
      }));
      showSuccess('Gasto cargado en el evento');
    } catch (err) {
      console.error('Error agregando gasto:', err);
      showError('No se pudo cargar el gasto');
    } finally {
      setSavingExpenseEventId('');
    }
  };

  const handleDeleteExpense = async (eventId, expenseId) => {
    if (!window.confirm('Eliminar este gasto?')) return;
    try {
      setDeletingExpenseId(expenseId);
      const updated = await deleteEventExpense(eventId, expenseId, user);
      setEvents((prev) => prev.map((event) => (String(event._id || event.id) === String(eventId) ? updated : event)));
      showSuccess('Gasto eliminado');
    } catch (err) {
      console.error('Error eliminando gasto del evento:', err);
      showError('No se pudo eliminar el gasto');
    } finally {
      setDeletingExpenseId('');
    }
  };

  const renderCuentaExcel = async (event) => {
    const eventId = String(event?._id || event?.id || '');
    if (!eventId) return;

    try {
      setExportingEventId(eventId);

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Rendicion');

      sheet.columns = [
        { width: 34 },
        { width: 45 },
        { width: 62 },
        { width: 45 },
      ];

      const borderThin = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      const applyBorderRange = (fromRow, toRow, fromCol, toCol) => {
        for (let r = fromRow; r <= toRow; r += 1) {
          for (let c = fromCol; c <= toCol; c += 1) {
            sheet.getCell(r, c).border = borderThin;
          }
        }
      };

      sheet.mergeCells('A1:D1');
      sheet.getCell('A1').value = 'Subcomision de completar';
      sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getCell('A1').font = { bold: true, size: 18, color: { argb: 'FF8EB33F' } };
      sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1272B7' } };

      sheet.mergeCells('A2:D2');
      sheet.getCell('A2').value = 'PLANILLA DE RENDICION';
      sheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getCell('A2').font = { bold: true, size: 18, color: { argb: 'FF8EB33F' } };
      sheet.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1272B7' } };

      sheet.getCell('A3').value = 'Fecha';
      sheet.mergeCells('B3:D3');
      sheet.getCell('B3').value = formatDate(event.date) || formatDate(new Date());
      sheet.getCell('A3').font = { bold: true, size: 12 };

      sheet.getCell('A4').value = 'Motivo';
      sheet.mergeCells('B4:D4');
      sheet.getCell('B4').value = event.title || 'Evento';
      sheet.getCell('A4').font = { bold: true, size: 12 };

      sheet.mergeCells('A5:B5');
      sheet.getCell('A5').value = 'INGRESOS';
      sheet.getCell('A5').alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getCell('A5').font = { bold: true, size: 14 };

      sheet.mergeCells('C5:D5');
      sheet.getCell('C5').value = 'GASTOS';
      sheet.getCell('C5').alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getCell('C5').font = { bold: true, size: 14 };

      sheet.getCell('A5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8D8C8' } };
      sheet.getCell('C5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8D8C8' } };

      const gastos = Array.isArray(event.gastos) ? event.gastos : [];
      const maxRows = Math.max(10, gastos.length || 1);
      const startRow = 6;
      const totalEntrada = getEventTotalEntrada(event);
      const totalGasto = getEventTotal(event);
      const recaudacion = getEventRecaudacion(event);

      for (let i = 0; i < maxRows; i += 1) {
        const row = startRow + i;
        const gasto = gastos[i];

        sheet.getCell(row, 1).value = i === 0 ? 'Entradas' : '';
        sheet.getCell(row, 2).value = i === 0 ? totalEntrada : '';
        sheet.getCell(row, 3).value = gasto?.concepto || '';
        sheet.getCell(row, 4).value = typeof gasto?.monto === 'number' ? gasto.monto : '';

        sheet.getCell(row, 2).numFmt = '$ #,##0.00';
        sheet.getCell(row, 4).numFmt = '$ #,##0.00';
      }

      const totalsRow = startRow + maxRows + 1;
      const superavitRow = totalsRow + 1;
      const rendidoRow = totalsRow + 2;

      sheet.getCell(totalsRow, 1).value = 'TOTAL DE INGRESOS';
      sheet.getCell(totalsRow, 1).font = { bold: true, size: 14 };
      sheet.getCell(totalsRow, 2).value = totalEntrada;
      sheet.getCell(totalsRow, 2).numFmt = '$ #,##0.00';
      sheet.getCell(totalsRow, 2).font = { bold: true, size: 14 };

      sheet.getCell(totalsRow, 3).value = 'TOTAL DE GASTOS';
      sheet.getCell(totalsRow, 3).font = { bold: true, size: 14 };
      sheet.getCell(totalsRow, 4).value = totalGasto;
      sheet.getCell(totalsRow, 4).numFmt = '$ #,##0.00';
      sheet.getCell(totalsRow, 4).font = { bold: true, size: 14 };

      sheet.mergeCells(`A${superavitRow}:B${superavitRow}`);
      sheet.getCell(superavitRow, 1).value = 'SUPERAVIT/DEFICIT';
      sheet.getCell(superavitRow, 1).font = { bold: true, size: 14 };

      sheet.mergeCells(`C${superavitRow}:D${superavitRow}`);
      sheet.getCell(superavitRow, 3).value = `${recaudacion >= 0 ? 'Superavit' : 'Deficit'} ${formatMoney(Math.abs(recaudacion))}`;
      sheet.getCell(superavitRow, 3).font = { bold: true, size: 13 };
      sheet.getCell(superavitRow, 3).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: recaudacion >= 0 ? 'FFA9D18E' : 'FFF4B4B4' },
      };

      sheet.getCell(rendidoRow, 1).value = 'RENDIDO FECHA:';
      sheet.getCell(rendidoRow, 1).font = { bold: true, size: 12 };
      sheet.getCell(rendidoRow, 2).value = formatDate(new Date());
      sheet.getCell(rendidoRow, 2).font = { bold: true, size: 12 };

      applyBorderRange(1, rendidoRow, 1, 4);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rendicion_${sanitizeFileName(event.title)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSuccess('Planilla de rendicion generada');
    } catch (err) {
      console.error('Error generando excel de rendicion:', err);
      showError('No se pudo generar la planilla de rendicion');
    } finally {
      setExportingEventId('');
    }
  };

  const SectionIcon = currentSection.icon;

  return (
    <ProtectedRoute>
      <div className="w-full sm:max-w-7xl mx-auto px-0 sm:px-2" data-aos="fade-up">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Subcomision</h2>
              <p className="text-sm text-slate-600 mt-1">Espacio de gestion para eventos, tareas, reuniones, reparaciones y cartera.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-emerald-700 text-sm font-medium">
              <SectionIcon className="h-5 w-5" />
              <span>{currentSection.label}</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = section.key === activeSection;
              return (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => setActiveSection(section.key)}
                  className={`rounded-xl border px-3 py-3 text-left transition ${isActive ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <span className="font-semibold text-sm">{section.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {activeSection !== 'eventos' ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-slate-800">{currentSection.label}</h3>
              <p className="text-sm text-slate-600 mt-2">{currentSection.description}</p>
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                Modulo en construccion. Aqui se va a cargar la gestion de {currentSection.label.toLowerCase()}.
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateEventForm((prev) => !prev)}
                    className="inline-flex items-center gap-2 text-left px-4 py-2 rounded-lg border border-cyan-400 bg-cyan-600 text-white hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-300 shadow-sm"
                  >
                    <ChevronDownIcon className={`h-5 w-5 text-white transition-transform ${showCreateEventForm ? 'rotate-180' : ''}`} />
                    <h3 className="text-base sm:text-lg font-semibold text-white">Registrar evento</h3>
                  </button>
                </div>

                {showCreateEventForm ? (
                <form onSubmit={handleCreateEvent} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nombre del evento</label>
                    <input className="w-full border border-slate-300 rounded-lg px-3 py-2" value={eventForm.title} onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Fecha del evento</label>
                    <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2" value={eventForm.date} onChange={(e) => setEventForm((prev) => ({ ...prev, date: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Lugar del evento</label>
                    <input className="w-full border border-slate-300 rounded-lg px-3 py-2" value={eventForm.lugar} onChange={(e) => setEventForm((prev) => ({ ...prev, lugar: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Encargado de administrar</label>
                    <input className="w-full border border-slate-300 rounded-lg px-3 py-2" value={eventForm.encargado} onChange={(e) => setEventForm((prev) => ({ ...prev, encargado: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Total de entrada</label>
                    <input type="number" min="0" step="0.01" className="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder="0" value={eventForm.totalEntrada} onChange={(e) => setEventForm((prev) => ({ ...prev, totalEntrada: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Elementos necesarios (separados por coma)</label>
                    <input className="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder="comida, bebida, lena, carbon" value={eventForm.elementosNecesarios} onChange={(e) => setEventForm((prev) => ({ ...prev, elementosNecesarios: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Observaciones generales</label>
                    <textarea className="w-full border border-slate-300 rounded-lg px-3 py-2 min-h-[90px]" value={eventForm.observacionesGenerales} onChange={(e) => setEventForm((prev) => ({ ...prev, observacionesGenerales: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button type="submit" disabled={savingEvent} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60">
                      {savingEvent ? 'Guardando...' : 'Guardar evento'}
                    </button>
                  </div>
                </form>
                ) : (
                  <div className="mt-3 text-sm text-slate-500">Formulario colapsado. Toca "Registrar evento" para abrirlo.</div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Eventos registrados</h3>
                {eventsLoading ? (
                  <div className="text-sm text-slate-500">Cargando eventos...</div>
                ) : events.length === 0 ? (
                  <div className="text-sm text-slate-500">No hay eventos cargados aun.</div>
                ) : (
                  <div className="space-y-4">
                    {paginatedEvents.map((event) => {
                      const eventId = String(event._id || event.id);
                      const isExpanded = String(expandedEventId) === eventId;
                      const isEditing = String(editingEventId) === eventId;
                      const form = expenseForms[eventId] || { concepto: '', monto: '', fecha: '', detalle: '' };
                      const eventExpenses = Array.isArray(event.gastos) ? event.gastos : [];
                      const eventTotal = getEventTotal(event);
                      const eventTotalEntrada = getEventTotalEntrada(event);
                      const eventRecaudacion = getEventRecaudacion(event);
                      return (
                        <div key={eventId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => toggleEventDetails(eventId)}
                              className="text-left w-full lg:flex-1 min-w-0"
                            >
                              <div className="flex items-center gap-2">
                                <ChevronDownIcon className={`h-4 w-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                <h4 className="text-base font-semibold text-slate-800">{event.title || 'Evento'}</h4>
                              </div>
                              <p className="text-sm text-slate-600 mt-1">{event.date ? new Date(event.date).toLocaleDateString('es-AR') : 'Sin fecha'} - {event.lugar || 'Sin lugar'}</p>
                              <p className="text-sm text-slate-600 mt-1">Encargado: <span className="font-medium">{event.encargado || 'No informado'}</span></p>
                              {!isExpanded && (
                                <p className="text-xs text-slate-500 mt-1">Toca para ver detalles y gastos del evento</p>
                              )}
                            </button>
                            <div className="w-full lg:w-auto lg:min-w-[250px] text-left lg:text-right shrink-0">
                              <div className="text-xs uppercase text-slate-500">Control de gastos</div>
                              <div className="text-xs text-slate-600 mt-1">Total de gasto: <span className="font-semibold text-slate-800">{formatMoney(eventTotal)}</span></div>
                              <div className="text-xs text-slate-600">Total de entrada: <span className="font-semibold text-slate-800">{formatMoney(eventTotalEntrada)}</span></div>
                              <div className={`text-sm font-semibold ${eventRecaudacion >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>Recaudacion: {formatMoney(eventRecaudacion)}</div>
                              <div className="mt-2 flex flex-wrap items-center gap-2 lg:justify-end">
                                <button
                                  type="button"
                                  onClick={() => startEditingEvent(event)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-blue-700 bg-blue-100 hover:bg-blue-200"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => renderCuentaExcel(event)}
                                  disabled={exportingEventId === eventId}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-emerald-800 bg-emerald-100 hover:bg-emerald-200 disabled:opacity-60"
                                >
                                  <DocumentArrowDownIcon className="h-4 w-4" />
                                  {exportingEventId === eventId ? 'Generando...' : 'Rendir cuenta'}
                                </button>
                                <button
                                  type="button"
                                  disabled={deletingEventId === eventId}
                                  onClick={() => handleDeleteEvent(eventId)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-60"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <>
                              {isEditing ? (
                                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
                                  <h5 className="text-sm font-semibold text-blue-700">Editar evento</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <input className="border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-800" placeholder="Nombre del evento" value={editingEventForm.title} onChange={(e) => setEditingEventForm((prev) => ({ ...prev, title: e.target.value }))} />
                                    <input type="date" className="border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-800" value={editingEventForm.date} onChange={(e) => setEditingEventForm((prev) => ({ ...prev, date: e.target.value }))} />
                                    <input className="border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-800" placeholder="Lugar" value={editingEventForm.lugar} onChange={(e) => setEditingEventForm((prev) => ({ ...prev, lugar: e.target.value }))} />
                                    <input className="border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-800" placeholder="Encargado" value={editingEventForm.encargado} onChange={(e) => setEditingEventForm((prev) => ({ ...prev, encargado: e.target.value }))} />
                                    <input type="number" min="0" step="0.01" className="border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-800" placeholder="Total entrada" value={editingEventForm.totalEntrada} onChange={(e) => setEditingEventForm((prev) => ({ ...prev, totalEntrada: e.target.value }))} />
                                    <input className="md:col-span-2 border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-800" placeholder="Elementos necesarios (coma)" value={editingEventForm.elementosNecesarios} onChange={(e) => setEditingEventForm((prev) => ({ ...prev, elementosNecesarios: e.target.value }))} />
                                    <textarea className="md:col-span-2 border border-slate-300 rounded-lg px-2.5 py-2 min-h-[80px] bg-white text-slate-800" placeholder="Observaciones" value={editingEventForm.observacionesGenerales} onChange={(e) => setEditingEventForm((prev) => ({ ...prev, observacionesGenerales: e.target.value }))} />
                                  </div>
                                  <div className="flex items-center justify-end gap-2">
                                    <button type="button" onClick={cancelEditingEvent} className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100">
                                      Cancelar
                                    </button>
                                    <button type="button" onClick={() => saveEditingEvent(eventId)} disabled={savingEditEvent} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
                                      {savingEditEvent ? 'Guardando...' : 'Guardar cambios'}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-3 space-y-1.5">
                                  <p className="text-sm text-slate-600">Elementos: {(event.elementosNecesarios || []).length > 0 ? event.elementosNecesarios.join(', ') : 'Sin elementos cargados'}</p>
                                  <p className="text-sm text-slate-600">Observaciones: {event.observacionesGenerales || event.description || 'Sin observaciones'}</p>
                                </div>
                              )}

                              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                                <h5 className="text-sm font-semibold text-slate-700 mb-2">Cargar gasto</h5>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                  <input className="border border-slate-300 rounded-lg px-2.5 py-2" placeholder="Concepto" value={form.concepto} onChange={(e) => handleExpenseChange(eventId, 'concepto', e.target.value)} />
                                  <input type="number" min="0" step="0.01" className="border border-slate-300 rounded-lg px-2.5 py-2" placeholder="Monto" value={form.monto} onChange={(e) => handleExpenseChange(eventId, 'monto', e.target.value)} />
                                  <input type="date" className="border border-slate-300 rounded-lg px-2.5 py-2" value={form.fecha} onChange={(e) => handleExpenseChange(eventId, 'fecha', e.target.value)} />
                                  <button type="button" onClick={() => handleAddExpense(eventId)} disabled={savingExpenseEventId === eventId} className="rounded-lg bg-blue-600 text-white px-3 py-2 hover:bg-blue-700 disabled:opacity-60">
                                    {savingExpenseEventId === eventId ? 'Guardando...' : 'Agregar gasto'}
                                  </button>
                                  <input className="md:col-span-4 border border-slate-300 rounded-lg px-2.5 py-2" placeholder="Detalle (opcional)" value={form.detalle} onChange={(e) => handleExpenseChange(eventId, 'detalle', e.target.value)} />
                                </div>

                                <div className="mt-3">
                                  {eventExpenses.length === 0 ? (
                                    <div className="text-sm text-slate-500">Este evento aun no tiene gastos cargados.</div>
                                  ) : (
                                    <div className="overflow-x-auto">
                                      <table className="min-w-full text-sm">
                                        <thead>
                                          <tr className="text-slate-600 border-b border-slate-200">
                                            <th className="text-left py-1.5 pr-3">Concepto</th>
                                            <th className="text-left py-1.5 pr-3">Fecha</th>
                                            <th className="text-left py-1.5 pr-3">Monto</th>
                                            <th className="text-left py-1.5 pr-3">Detalle</th>
                                            <th className="text-right py-1.5">Acciones</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {eventExpenses.map((expense) => {
                                            const expenseId = String(expense._id || expense.id || '');
                                            return (
                                              <tr key={expenseId} className="border-b border-slate-100">
                                                <td className="py-1.5 pr-3 text-slate-700">{expense.concepto}</td>
                                                <td className="py-1.5 pr-3 text-slate-700">{expense.fecha ? new Date(expense.fecha).toLocaleDateString('es-AR') : '-'}</td>
                                                <td className="py-1.5 pr-3 text-slate-700">{formatMoney(expense.monto)}</td>
                                                <td className="py-1.5 pr-3 text-slate-700">{expense.detalle || '-'}</td>
                                                <td className="py-1.5 text-right">
                                                  <button
                                                    type="button"
                                                    onClick={() => handleDeleteExpense(eventId, expenseId)}
                                                    disabled={deletingExpenseId === expenseId}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-red-700 hover:bg-red-100 disabled:opacity-60"
                                                  >
                                                    <TrashIcon className="h-4 w-4" />
                                                  </button>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                          {!isExpanded && (
                            <div className="mt-3 text-xs text-slate-500">Evento colapsado. Toca el encabezado para ver gastos y detalles.</div>
                          )}
                        </div>
                      );
                    })}
                    <div className="pt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="text-xs text-slate-500">
                        Pagina {eventsPage} de {totalEventsPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEventsPage((prev) => Math.max(1, prev - 1))}
                          disabled={eventsPage === 1}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        >
                          Anterior
                        </button>
                        <button
                          type="button"
                          onClick={() => setEventsPage((prev) => Math.min(totalEventsPages, prev + 1))}
                          disabled={eventsPage === totalEventsPages}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
