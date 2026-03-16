import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDaysIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/useAuth';
import { showError, showSuccess } from '../../utils/toast';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  fetchMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  createMeetingTopic,
  updateMeetingTopic,
  updateMeetingTopicStatus,
} from '../../models/Meeting';
import { fireThemedSwal } from '../../utils/swalTheme';

const CATEGORY_LABELS = {
  hablado: 'Se hablo',
  a_tratar: 'Se hablara',
};

const STATUS_LABELS = {
  abierto: 'Abierto',
  cerrado: 'Cerrado',
  archivado: 'Archivado',
};

const STATUS_BADGES = {
  abierto: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cerrado: 'bg-amber-50 text-amber-700 border border-amber-200',
  archivado: 'bg-slate-100 text-slate-700 border border-slate-200',
};

function CompactTopicCard({ topic, onSave, onStatus }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titulo: topic.titulo || '',
    detalle: topic.detalle || '',
    categoria: topic.categoria || 'a_tratar',
  });

  useEffect(() => {
    setForm({
      titulo: topic.titulo || '',
      detalle: topic.detalle || '',
      categoria: topic.categoria || 'a_tratar',
    });
  }, [topic.titulo, topic.detalle, topic.categoria]);

  const handleSave = async () => {
    if (!String(form.titulo || '').trim()) {
      showError('El tema necesita un titulo');
      return;
    }
    setSaving(true);
    try {
      await onSave(topic, form);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 break-words">{topic.titulo}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${STATUS_BADGES[topic.estado] || STATUS_BADGES.abierto}`}>
              {STATUS_LABELS[topic.estado] || topic.estado}
            </span>
            <span className="rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5">
              {CATEGORY_LABELS[topic.categoria] || CATEGORY_LABELS.a_tratar}
            </span>
          </div>
        </div>

        {topic.estado !== 'archivado' && (
          <button
            type="button"
            onClick={() => setEditing((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
          >
            <PencilSquareIcon className="h-4 w-4" />
            {editing ? 'Cancelar' : 'Editar'}
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-2 space-y-2">
          <input
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
            value={form.titulo}
            onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
            placeholder="Tema"
          />
          <select
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
            value={form.categoria}
            onChange={(e) => setForm((prev) => ({ ...prev, categoria: e.target.value }))}
          >
            <option value="hablado">Se hablo</option>
            <option value="a_tratar">Se hablara</option>
          </select>
          <textarea
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm min-h-[78px]"
            value={form.detalle}
            onChange={(e) => setForm((prev) => ({ ...prev, detalle: e.target.value }))}
            placeholder="Detalle breve"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-600 whitespace-pre-wrap break-words">
          {topic.detalle || 'Sin detalle.'}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {topic.estado === 'abierto' && (
          <button
            type="button"
            onClick={() => onStatus(topic, 'cerrado')}
            className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
          >
            <CheckCircleIcon className="h-4 w-4" />
            Cerrar
          </button>
        )}
        {topic.estado !== 'abierto' && topic.estado !== 'archivado' && (
          <button
            type="button"
            onClick={() => onStatus(topic, 'abierto')}
            className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Reabrir
          </button>
        )}
        {topic.estado !== 'archivado' ? (
          <button
            type="button"
            onClick={() => onStatus(topic, 'archivado')}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            <ArchiveBoxIcon className="h-4 w-4" />
            Archivar
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onStatus(topic, 'abierto')}
            className="inline-flex items-center gap-1 rounded-md border border-blue-300 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Desarchivar
          </button>
        )}
      </div>
    </article>
  );
}

function TopicColumn({ title, topics, emptyText, onSaveTopic, onStatusTopic }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <h5 className="text-sm font-semibold text-slate-800">{title}</h5>
      {topics.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">{emptyText}</p>
      ) : (
        <div className="mt-2 space-y-2">
          {topics.map((topic) => (
            <CompactTopicCard
              key={String(topic._id || topic.id)}
              topic={topic}
              onSave={onSaveTopic}
              onStatus={onStatusTopic}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function Meetings() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(false);
  const [deletingMeeting, setDeletingMeeting] = useState(false);
  const [isMeetingPanelOpen, setIsMeetingPanelOpen] = useState(false);

  const [meetingForm, setMeetingForm] = useState({
    tituloReunion: '',
    fechaReunion: '',
    descripcion: '',
  });

  const [topicForm, setTopicForm] = useState({
    titulo: '',
    detalle: '',
    categoria: 'a_tratar',
  });

  const [selectedMeetingId, setSelectedMeetingId] = useState('');

  const loadMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMeetings();
      const list = Array.isArray(data) ? data : [];
      setMeetings(list);
      if (list.length > 0) {
        const firstId = String(list[0]._id || list[0].id);
        setSelectedMeetingId((prev) => prev || firstId);
      }
    } catch (error) {
      console.error('Error cargando reuniones:', error);
      showError('No se pudieron cargar las reuniones');
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const selectedMeeting = useMemo(
    () => meetings.find((meeting) => String(meeting._id || meeting.id) === String(selectedMeetingId)) || null,
    [meetings, selectedMeetingId]
  );

  useEffect(() => {
    if (!selectedMeeting) return;
    setMeetingForm({
      tituloReunion: selectedMeeting.tituloReunion || '',
      fechaReunion: selectedMeeting.fechaReunion
        ? new Date(selectedMeeting.fechaReunion).toISOString().slice(0, 10)
        : '',
      descripcion: selectedMeeting.descripcion || '',
    });
  }, [selectedMeeting]);

  const sortedMeetings = useMemo(
    () => [...meetings].sort((a, b) => new Date(b.fechaReunion || 0).getTime() - new Date(a.fechaReunion || 0).getTime()),
    [meetings]
  );

  const activeTopics = useMemo(
    () => (selectedMeeting?.temas || []).filter((topic) => topic.estado !== 'archivado'),
    [selectedMeeting]
  );

  const archivedTopics = useMemo(
    () => (selectedMeeting?.temas || []).filter((topic) => topic.estado === 'archivado'),
    [selectedMeeting]
  );

  const topicsSpoken = useMemo(
    () => activeTopics.filter((topic) => topic.categoria === 'hablado'),
    [activeTopics]
  );

  const topicsPlanned = useMemo(
    () => activeTopics.filter((topic) => topic.categoria === 'a_tratar'),
    [activeTopics]
  );

  const replaceMeeting = (updatedMeeting) => {
    setMeetings((prev) => prev.map((meeting) => {
      const currentId = String(meeting._id || meeting.id);
      const updatedId = String(updatedMeeting._id || updatedMeeting.id);
      return currentId === updatedId ? updatedMeeting : meeting;
    }));
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    const tituloReunion = String(meetingForm.tituloReunion || '').trim();
    if (!tituloReunion) {
      showError('Ingresa un titulo para la reunion');
      return;
    }
    if (!meetingForm.fechaReunion) {
      showError('Ingresa la fecha de la reunion');
      return;
    }

    setCreatingMeeting(true);
    try {
      const created = await createMeeting({
        tituloReunion,
        fechaReunion: meetingForm.fechaReunion,
        descripcion: String(meetingForm.descripcion || '').trim(),
      }, user);

      setMeetings((prev) => [created, ...prev]);
      setSelectedMeetingId(String(created._id || created.id));
      setTopicForm({ titulo: '', detalle: '', categoria: 'a_tratar' });
      showSuccess('Reunion creada');
    } catch (error) {
      console.error('Error creando reunion:', error);
      showError('No se pudo crear la reunion');
    } finally {
      setCreatingMeeting(false);
    }
  };

  const handleUpdateMeeting = async () => {
    if (!selectedMeeting) return;
    const meetingId = String(selectedMeeting._id || selectedMeeting.id);

    const tituloReunion = String(meetingForm.tituloReunion || '').trim();
    if (!tituloReunion || !meetingForm.fechaReunion) {
      showError('Completa titulo y fecha para guardar la reunion');
      return;
    }

    setEditingMeeting(true);
    try {
      const updated = await updateMeeting(meetingId, {
        tituloReunion,
        fechaReunion: meetingForm.fechaReunion,
        descripcion: String(meetingForm.descripcion || '').trim(),
      }, user);
      replaceMeeting(updated);
      showSuccess('Reunion actualizada');
    } catch (error) {
      console.error('Error actualizando reunion:', error);
      showError('No se pudo actualizar la reunion');
    } finally {
      setEditingMeeting(false);
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!selectedMeeting) {
      showError('Selecciona una reunion para cargar temas');
      return;
    }

    const titulo = String(topicForm.titulo || '').trim();
    if (!titulo) {
      showError('El tema necesita un titulo');
      return;
    }

    setCreatingTopic(true);
    try {
      const meetingId = String(selectedMeeting._id || selectedMeeting.id);
      const updatedMeeting = await createMeetingTopic(meetingId, {
        titulo,
        detalle: String(topicForm.detalle || '').trim(),
        categoria: topicForm.categoria,
      }, user);

      replaceMeeting(updatedMeeting);
      setTopicForm({ titulo: '', detalle: '', categoria: 'a_tratar' });
      showSuccess('Tema agregado');
    } catch (error) {
      console.error('Error creando tema:', error);
      showError('No se pudo crear el tema');
    } finally {
      setCreatingTopic(false);
    }
  };

  const handleDeleteSelectedMeeting = async () => {
    if (!selectedMeeting) return;
    const meetingId = String(selectedMeeting._id || selectedMeeting.id);

    const confirm = await fireThemedSwal({
      title: 'Eliminar reunion',
      text: 'Esta accion elimina la reunion y todos sus temas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) return;

    setDeletingMeeting(true);
    try {
      await deleteMeeting(meetingId, user);
      const nextMeetings = meetings.filter((meeting) => String(meeting._id || meeting.id) !== meetingId);
      setMeetings(nextMeetings);
      setSelectedMeetingId(nextMeetings.length > 0 ? String(nextMeetings[0]._id || nextMeetings[0].id) : '');
      showSuccess('Reunion eliminada');
    } catch (error) {
      console.error('Error eliminando reunion:', error);
      showError('No se pudo eliminar la reunion');
    } finally {
      setDeletingMeeting(false);
    }
  };

  const handleSaveTopic = async (topic, draft) => {
    if (!selectedMeeting) return;
    const meetingId = String(selectedMeeting._id || selectedMeeting.id);
    const topicId = String(topic._id || topic.id);

    try {
      const updatedMeeting = await updateMeetingTopic(meetingId, topicId, {
        titulo: String(draft.titulo || '').trim(),
        detalle: String(draft.detalle || '').trim(),
        categoria: String(draft.categoria || 'a_tratar'),
      }, user);
      replaceMeeting(updatedMeeting);
      showSuccess('Tema actualizado');
    } catch (error) {
      console.error('Error actualizando tema:', error);
      showError('No se pudo actualizar el tema');
    }
  };

  const handleStatusTopic = async (topic, estado) => {
    if (!selectedMeeting) return;
    const meetingId = String(selectedMeeting._id || selectedMeeting.id);
    const topicId = String(topic._id || topic.id);

    try {
      const updatedMeeting = await updateMeetingTopicStatus(meetingId, topicId, estado, user);
      replaceMeeting(updatedMeeting);
      showSuccess(`Tema marcado como ${STATUS_LABELS[estado].toLowerCase()}`);
    } catch (error) {
      console.error('Error cambiando estado de tema:', error);
      showError('No se pudo cambiar el estado del tema');
    }
  };

  return (
    <div className="mt-5 space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <button
          type="button"
          onClick={() => setIsMeetingPanelOpen((prev) => !prev)}
          className="w-full flex items-center justify-between gap-3 text-left"
        >
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Nuevas Reuniones</h3>
            <p className="text-sm text-slate-600 mt-1">
              Registra una fecha de reunion y luego carga temas dentro de esa reunion.
            </p>
          </div>
          <ChevronDownIcon className={`h-5 w-5 text-slate-500 transition-transform ${isMeetingPanelOpen ? 'rotate-180' : ''}`} />
        </button>

        {isMeetingPanelOpen && (
          <form onSubmit={handleCreateMeeting} className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
            <input
              className="md:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Titulo de la reunion"
              value={meetingForm.tituloReunion}
              onChange={(e) => setMeetingForm((prev) => ({ ...prev, tituloReunion: e.target.value }))}
            />
            <input
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={meetingForm.fechaReunion}
              onChange={(e) => setMeetingForm((prev) => ({ ...prev, fechaReunion: e.target.value }))}
            />
            <button
              type="submit"
              disabled={creatingMeeting}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {creatingMeeting ? 'Guardando...' : 'Registrar reunion'}
            </button>
            <textarea
              className="md:col-span-4 rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[72px]"
              placeholder="Descripcion breve de la reunion"
              value={meetingForm.descripcion}
              onChange={(e) => setMeetingForm((prev) => ({ ...prev, descripcion: e.target.value }))}
            />
            {selectedMeeting && (
              <div className="md:col-span-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleUpdateMeeting}
                  disabled={editingMeeting}
                  className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                >
                  {editingMeeting ? 'Guardando cambios...' : 'Actualizar reunion seleccionada'}
                </button>
              </div>
            )}
          </form>
        )}
      </section>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <LoadingSpinner message="Cargando reuniones..." className="py-2" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <aside className="rounded-2xl border border-slate-200 bg-white p-3 lg:col-span-1 flex flex-col">
            <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <CalendarDaysIcon className="h-5 w-5 text-slate-500" />
              Calendario de reuniones
            </h4>
            {sortedMeetings.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No hay reuniones registradas.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {sortedMeetings.map((meeting) => {
                  const meetingId = String(meeting._id || meeting.id);
                  const selected = meetingId === String(selectedMeetingId);
                  return (
                    <button
                      key={meetingId}
                      type="button"
                      onClick={() => setSelectedMeetingId(meetingId)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition ${selected ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                    >
                      <p className="text-sm font-medium text-slate-800 truncate">{meeting.tituloReunion || 'Reunion'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {meeting.fechaReunion ? new Date(meeting.fechaReunion).toLocaleDateString('es-AR') : 'Sin fecha'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">Temas: {(meeting.temas || []).length}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedMeeting && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleDeleteSelectedMeeting}
                  disabled={deletingMeeting}
                  className="rounded-lg border border-rose-300 bg-transparent px-3 py-1.5 text-sm font-medium text-rose-700 hover:text-rose-800 disabled:opacity-60"
                >
                  {deletingMeeting ? 'Eliminando...' : 'Eliminar reunion seleccionada'}
                </button>
              </div>
            )}
          </aside>

          <main className="lg:col-span-2 space-y-3">
            {!selectedMeeting ? (
              <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                Selecciona una reunion para ver y registrar temas.
              </section>
            ) : (
              <>
                <section className="rounded-2xl border border-slate-200 bg-white p-3">
                  <h4 className="text-sm font-semibold text-slate-800">Agregar tema a la reunion</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Reunion: {selectedMeeting.tituloReunion || 'Sin titulo'} - {selectedMeeting.fechaReunion ? new Date(selectedMeeting.fechaReunion).toLocaleDateString('es-AR') : 'Sin fecha'}
                  </p>
                  <form onSubmit={handleCreateTopic} className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
                      placeholder="Tema"
                      value={topicForm.titulo}
                      onChange={(e) => setTopicForm((prev) => ({ ...prev, titulo: e.target.value }))}
                    />
                    <select
                      className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
                      value={topicForm.categoria}
                      onChange={(e) => setTopicForm((prev) => ({ ...prev, categoria: e.target.value }))}
                    >
                      <option value="hablado">Se hablo</option>
                      <option value="a_tratar">Se hablara</option>
                    </select>
                    <button
                      type="submit"
                      disabled={creatingTopic}
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {creatingTopic ? 'Guardando...' : 'Agregar tema'}
                    </button>
                    <textarea
                      className="md:col-span-3 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm min-h-[72px]"
                      placeholder="Detalle breve"
                      value={topicForm.detalle}
                      onChange={(e) => setTopicForm((prev) => ({ ...prev, detalle: e.target.value }))}
                    />
                  </form>
                </section>

                <TopicColumn
                  title="Se hablo"
                  topics={topicsSpoken}
                  emptyText="No hay temas marcados como hablados."
                  onSaveTopic={handleSaveTopic}
                  onStatusTopic={handleStatusTopic}
                />

                <TopicColumn
                  title="Se hablara"
                  topics={topicsPlanned}
                  emptyText="No hay temas pendientes para tratar."
                  onSaveTopic={handleSaveTopic}
                  onStatusTopic={handleStatusTopic}
                />

                <TopicColumn
                  title="Archivados"
                  topics={archivedTopics}
                  emptyText="No hay temas archivados."
                  onSaveTopic={handleSaveTopic}
                  onStatusTopic={handleStatusTopic}
                />
              </>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
