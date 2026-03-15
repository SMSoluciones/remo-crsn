import { useState, useEffect } from 'react';
import {
  WrenchScrewdriverIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { fetchBoats } from '../../models/Boat';
import { fetchOars } from '../../models/Oar';
import { fetchSeats } from '../../models/Seat';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { exportRepairsExcel } from '../Reportes/repairsExcelReport';
import { showError } from '../../utils/toast';
import { fireThemedSwal } from '../../utils/swalTheme';
import LoadingSpinner from '../common/LoadingSpinner';

const DND_ITEM_TYPE = 'repair-item';

const TIPO_LABELS = {
  bote: 'Bote',
  remo: 'Remo',
  carro: 'Carro',
};

const TIPO_COLORS = {
  bote:  { bg: 'bg-cyan-100/60 dark:bg-cyan-500/10', text: 'text-cyan-800 dark:text-cyan-200', border: 'border-cyan-300 dark:border-cyan-400/40' },
  remo:  { bg: 'bg-violet-100/60 dark:bg-violet-500/10', text: 'text-violet-800 dark:text-violet-200', border: 'border-violet-300 dark:border-violet-400/40' },
  carro: { bg: 'bg-amber-100/60 dark:bg-amber-500/10', text: 'text-amber-800 dark:text-amber-200', border: 'border-amber-300 dark:border-amber-400/40' },
};

const ESTADO_LABELS = {
  mantenimiento: 'Mantenimiento',
  fuera_servicio: 'Fuera de servicio',
};

const ESTADO_COLORS = {
  mantenimiento: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-300/30',
  fuera_servicio: 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-300/30',
};

function CatalogRow({ item, isSelected, onAdd }) {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: DND_ITEM_TYPE,
    canDrag: !isSelected,
    item: {
      dragKind: 'catalog',
      key: item.key,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [item.key, isSelected]);

  return (
    <tr
      ref={dragRef}
      className={`transition ${isSelected ? 'bg-emerald-100 dark:bg-emerald-500/10' : 'hover:bg-cyan-50 dark:hover:bg-slate-800/60 cursor-grab'} ${isDragging ? 'opacity-40' : 'opacity-100'}`}
      onDoubleClick={() => {
        if (!isSelected) onAdd(item.key);
      }}
    >
      <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-100">
        <span className="block">{item.nombre}</span>
        <span className="sm:hidden block text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
          {item.subtipo !== '—' ? `${item.subtipo} · ` : ''}{item.causa || '—'}
        </span>
        <span className="sm:hidden block text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-normal">
          {item.fechaIngreso ? format(new Date(item.fechaIngreso), "d MMM yyyy", { locale: es }) : '—'}
        </span>
      </td>
      <td className="hidden sm:table-cell px-3 py-2.5 text-slate-600 dark:text-slate-300 capitalize">{item.subtipo}</td>
      <td className="px-3 py-2.5">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_COLORS[item.estado]}`}>
          {ESTADO_LABELS[item.estado] || item.estado}
        </span>
      </td>
      <td className="hidden sm:table-cell px-3 py-2.5 text-slate-600 dark:text-slate-300">{item.causa || '—'}</td>
      <td className="hidden sm:table-cell px-3 py-2.5 text-slate-600 dark:text-slate-300">
        {item.fechaIngreso
          ? format(new Date(item.fechaIngreso), "d MMM yyyy", { locale: es })
          : '—'}
      </td>
    </tr>
  );
}

function SelectedRow({ item, index, onRemove, onReorder, onInsertCatalog }) {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: DND_ITEM_TYPE,
    item: {
      dragKind: 'selected',
      key: item.key,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [item.key]);

  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: DND_ITEM_TYPE,
    drop: (dragged) => {
      if (!dragged?.key) return;
      if (dragged.dragKind === 'selected') {
        onReorder(dragged.key, item.key);
        return;
      }
      if (dragged.dragKind === 'catalog') {
        onInsertCatalog(dragged.key, index);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  }), [item.key, index, onReorder, onInsertCatalog]);

  const setRefs = (node) => {
    dragRef(node);
    dropRef(node);
  };

  return (
    <li
      ref={setRefs}
      className={`rounded-lg border px-3 py-2 bg-white dark:bg-slate-900/80 flex items-center gap-2 ${isOver ? 'border-emerald-400' : 'border-slate-200 dark:border-slate-700'} ${isDragging ? 'opacity-40' : 'opacity-100'}`}
    >
      <Bars3Icon className="h-5 w-5 text-slate-500 dark:text-slate-400 shrink-0" />
      <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400 w-6 text-center shrink-0">{index + 1}</span>
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-full px-2 py-0.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
        {TIPO_LABELS[item.tipo]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate leading-tight">{item.nombre}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
          {item.causa || '—'}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(item.key)}
        className="rounded-md border border-slate-300 dark:border-slate-700 p-1 text-slate-600 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-slate-800"
        title="Quitar del informe"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </li>
  );
}

function RepairsContent() {
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [boats, oars, seats] = await Promise.all([
          fetchBoats().catch(() => []),
          fetchOars().catch(() => []),
          fetchSeats().catch(() => []),
        ]);

        const REPAIR_STATES = new Set(['mantenimiento', 'fuera_servicio']);

        const mapped = [
          ...boats.filter(b => REPAIR_STATES.has(b.estado)).map(b => ({
            key: `bote-${String(b._id || b.id || b.nombre)}`,
            _id: b._id,
            tipo: 'bote',
            nombre: b.nombre,
            subtipo: b.tipo || '—',
            estado: b.estado,
            causa: String(b.causa || '').trim(),
            fechaIngreso: b.fechaIngreso,
          })),
          ...oars.filter(o => REPAIR_STATES.has(o.estado)).map(o => ({
            key: `remo-${String(o._id || o.id || o.nombre)}`,
            _id: o._id,
            tipo: 'remo',
            nombre: o.nombre,
            subtipo: o.tipo || '—',
            estado: o.estado,
            causa: String(o.causa || '').trim(),
            fechaIngreso: o.fechaIngreso,
          })),
          ...seats.filter(s => REPAIR_STATES.has(s.estado)).map(s => ({
            key: `carro-${String(s._id || s.id || s.nombre)}`,
            _id: s._id,
            tipo: 'carro',
            nombre: s.nombre,
            subtipo: '—',
            estado: s.estado,
            causa: String(s.causa || '').trim(),
            fechaIngreso: s.fechaIngreso,
          })),
        ];

        setItems(mapped);
      } catch (err) {
        console.error('Error cargando artefactos en reparacion:', err);
        showError('No se pudieron cargar los artefactos');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleExportExcel = async () => {
    if (selectedItems.length === 0) {
      showError('Selecciona al menos un artefacto para exportar');
      return;
    }

    const modal = await fireThemedSwal({
      title: 'Completar datos del reporte',
      html: `
        <div style="display:flex; flex-direction:column; gap:10px; text-align:left; margin-top:8px;">
          <label for="repairs-materials" style="font-size:13px; font-weight:600;">Detalle de pedido de materiales</label>
          <textarea id="repairs-materials" class="swal2-textarea" style="width:100%; min-height:90px; margin:0;" placeholder="Ej: tornillos inoxidables, mecha 4mm, caño de metal 30 cm..."></textarea>
          <label for="repairs-observations" style="font-size:13px; font-weight:600;">Observaciones</label>
          <textarea id="repairs-observations" class="swal2-textarea" style="width:100%; min-height:90px; margin:0;" placeholder="Observaciones adicionales..."></textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Generar Excel',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const materialsInput = document.getElementById('repairs-materials');
        const observationsInput = document.getElementById('repairs-observations');
        return {
          materialsDetail: materialsInput?.value?.trim() || '',
          observations: observationsInput?.value?.trim() || '',
        };
      },
    });

    if (!modal.isConfirmed) return;

    setExporting(true);
    try {
      await exportRepairsExcel(selectedItems, {
        tipoLabels: TIPO_LABELS,
        estadoLabels: ESTADO_LABELS,
        materialsDetail: modal.value?.materialsDetail || '',
        observations: modal.value?.observations || '',
      });
    } catch (err) {
      console.error('Error exportando Excel:', err);
      showError('No se pudo generar el Excel');
    } finally {
      setExporting(false);
    }
  };

  const groups = ['bote', 'remo', 'carro'];
  const selectedKeys = new Set(selectedItems.map((item) => item.key));

  const getItemByKey = (key) => items.find((item) => item.key === key) || null;

  const addToSelection = (key) => {
    const item = getItemByKey(key);
    if (!item) return;
    setSelectedItems((prev) => {
      if (prev.some((selected) => selected.key === item.key)) return prev;
      return [...prev, item];
    });
  };

  const insertCatalogItemAt = (key, targetIndex) => {
    const item = getItemByKey(key);
    if (!item) return;
    setSelectedItems((prev) => {
      const existingIndex = prev.findIndex((entry) => entry.key === key);
      if (existingIndex !== -1) return prev;
      const safeIndex = Math.max(0, Math.min(targetIndex, prev.length));
      const next = [...prev];
      next.splice(safeIndex, 0, item);
      return next;
    });
  };

  const reorderSelection = (sourceKey, targetKey) => {
    if (!sourceKey || !targetKey || sourceKey === targetKey) return;
    setSelectedItems((prev) => {
      const sourceIndex = prev.findIndex((item) => item.key === sourceKey);
      const targetIndex = prev.findIndex((item) => item.key === targetKey);
      if (sourceIndex === -1 || targetIndex === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const removeSelected = (key) => {
    setSelectedItems((prev) => prev.filter((item) => item.key !== key));
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const [{ isOverPanel }, panelDropRef] = useDrop(() => ({
    accept: DND_ITEM_TYPE,
    drop: (dragged) => {
      if (!dragged?.key) return;
      if (dragged.dragKind === 'catalog') addToSelection(dragged.key);
    },
    collect: (monitor) => ({
      isOverPanel: monitor.isOver({ shallow: true }),
    }),
  }), [items]);

  return (
    <div className="mt-5 space-y-5">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/70 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <WrenchScrewdriverIcon className="h-5 w-5 text-slate-500 dark:text-slate-300" />
                Artefactos en Mantenimiento
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Botes, remos y carros con estado <span className="font-medium text-amber-700 dark:text-amber-300">Mantenimiento</span> o{' '}
                <span className="font-medium text-rose-700 dark:text-rose-300">Fuera de servicio</span>.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Arrastra artefactos desde el catalogo al panel de informe para seleccionar y ordenar lo que vas a enviar.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exporting || loading || selectedItems.length === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-emerald-300 bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {exporting ? 'Exportando...' : 'Exportar selección a Excel'}
            </button>
          </div>

          {/* Resumen */}
          {!loading && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {groups.map(tipo => {
                const count = items.filter(i => i.tipo === tipo).length;
                const colors = TIPO_COLORS[tipo];
                return (
                  <div key={tipo} className={`rounded-xl border ${colors.border} ${colors.bg} px-3 py-2.5 sm:px-4 sm:py-3`}>
                    <p className={`text-xs font-medium ${colors.text}`}>{TIPO_LABELS[tipo]}s</p>
                    <p className={`text-xl sm:text-2xl font-bold ${colors.text}`}>{count}</p>
                  </div>
                );
              })}
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-400/40 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2.5 sm:px-4 sm:py-3">
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-200">Seleccionados</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-200">{selectedItems.length}</p>
              </div>
            </div>
          )}
        </div>

        {!loading && items.length > 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h4 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">Informe de reparación (drag and drop)</h4>
              <button
                type="button"
                onClick={clearSelection}
                disabled={selectedItems.length === 0}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Limpiar selección
              </button>
            </div>

            <div
              ref={panelDropRef}
              className={`rounded-xl border-2 border-dashed p-3 sm:p-4 transition ${isOverPanel ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50'}`}
            >
              {selectedItems.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  Arrastra aquí los artefactos que quieras incluir en el informe.
                </p>
              ) : (
                <ul className="space-y-2">
                  {selectedItems.map((item, idx) => (
                    <SelectedRow
                      key={item.key}
                      item={item}
                      index={idx}
                      onRemove={removeSelected}
                      onReorder={reorderSelection}
                      onInsertCatalog={insertCatalogItemAt}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Contenido */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            <LoadingSpinner message="Cargando artefactos..." className="py-2" textClassName="text-sm text-slate-500 dark:text-slate-400" color="#60A5FA" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2 text-slate-500 dark:text-slate-300" />
            No hay artefactos en mantenimiento ni fuera de servicio.
          </div>
        ) : (
          groups.map(tipo => {
            const group = items.filter(i => i.tipo === tipo);
            if (group.length === 0) return null;
            const colors = TIPO_COLORS[tipo];
            return (
              <div key={tipo} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/70 overflow-hidden shadow-sm">
                {/* Cabecera de grupo */}
                <div className={`px-5 py-3 flex items-center gap-2 border-b ${colors.border} ${colors.bg}`}>
                  <span className={`text-sm font-semibold ${colors.text}`}>
                    {TIPO_LABELS[tipo]}s
                  </span>
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium border ${colors.border} ${colors.text}`}>
                    {group.length}
                  </span>
                </div>

                {/* Tabla */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-white dark:bg-slate-900 text-left text-xs text-slate-700 dark:text-slate-400 uppercase tracking-wide border-b border-sky-100 dark:border-slate-700 select-none">
                        <th className="px-3 py-2 font-semibold">Nombre</th>
                        <th className="hidden sm:table-cell px-3 py-2 font-semibold">Subtipo</th>
                        <th className="px-3 py-2 font-semibold">Estado</th>
                        <th className="hidden sm:table-cell px-3 py-2 font-semibold">Causa</th>
                        <th className="hidden sm:table-cell px-3 py-2 font-semibold">Fecha Ingreso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sky-100 dark:divide-slate-800">
                      {group.map(item => (
                        <CatalogRow
                          key={item.key}
                          item={item}
                          isSelected={selectedKeys.has(item.key)}
                          onAdd={addToSelection}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
  );
}

export default function Repairs() {
  return (
    <DndProvider backend={HTML5Backend}>
      <RepairsContent />
    </DndProvider>
  );
}
