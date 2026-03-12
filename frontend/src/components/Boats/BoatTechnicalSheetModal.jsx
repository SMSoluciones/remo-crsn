import { PhotoIcon, XMarkIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { API_BASE_URL } from '../../utils/apiConfig';

const formatDate = (dateValue) => {
  if (!dateValue) return 'No informado';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'No informado';
  return format(date, 'dd-MM-yyyy');
};

export default function BoatTechnicalSheetModal({ isOpen, onRequestClose, boat, reports = [] }) {
  if (!isOpen || !boat) return null;

  const boatId = String(boat._id || boat.id || '');
  const repairs = reports
    .filter((report) => {
      const reportBoatId = String(report.boatId || report.boat || report?.boatId?._id || '');
      return reportBoatId === boatId;
    })
    .slice()
    .sort((a, b) => {
      const ta = a?.fechaReporte ? new Date(a.fechaReporte).getTime() : 0;
      const tb = b?.fechaReporte ? new Date(b.fechaReporte).getTime() : 0;
      return tb - ta;
    });

  const estadoLabel = boat.estado === 'fuera_servicio'
    ? 'Fuera de servicio'
    : boat.estado === 'mantenimiento'
      ? 'Mantenimiento'
      : 'Activo';

  const pesoMin = boat.pesoMinimo ?? boat.pesoMin ?? null;
  const pesoMax = boat.pesoMaximo ?? boat.pesoMax ?? null;
  const boatPhoto = boat.fotoURL || boat.fotoUrl || boat.photoURL || boat.imageURL || '';
  const boatPhotoSrc = boatPhoto && /^https?:\/\//i.test(boatPhoto)
    ? boatPhoto
    : boatPhoto
      ? `${API_BASE_URL}${boatPhoto.startsWith('/') ? '' : '/'}${boatPhoto}`
      : '';

  return (
    <div className="fixed inset-0 z-50 modal-overlay p-2 sm:p-4 flex items-start sm:items-center justify-center overflow-y-auto" onClick={onRequestClose}>
      <div className="modal-panel w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 outline-none max-h-[94vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800">Hoja tecnica del bote</h3>
          <button
            type="button"
            onClick={onRequestClose}
            className="p-1.5 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Cerrar modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
            <div className="w-full h-40 sm:h-48 rounded-xl border-2 border-dashed border-slate-300 bg-white overflow-hidden flex flex-col items-center justify-center text-slate-500">
              {boatPhotoSrc ? (
                <img src={boatPhotoSrc} alt={`Foto de ${boat.nombre || 'bote'}`} className="w-full h-full object-cover" />
              ) : (
                <>
                  <PhotoIcon className="w-14 h-14" />
                  <p className="text-sm mt-2">Imagen del bote</p>
                </>
              )}
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                <div className="text-xs uppercase tracking-wide text-slate-500">Nombre</div>
                <div className="font-medium text-slate-800">{boat.nombre || 'No informado'}</div>
              </div>
              <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                <div className="text-xs uppercase tracking-wide text-slate-500">Tipo</div>
                <div className="font-medium text-slate-800 capitalize">{boat.tipo || 'No informado'}</div>
              </div>
              <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                <div className="text-xs uppercase tracking-wide text-slate-500">Estado</div>
                <div className="font-medium text-slate-800">{estadoLabel}</div>
              </div>
              <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                <div className="text-xs uppercase tracking-wide text-slate-500">Fecha de ingreso</div>
                <div className="font-medium text-slate-800">{formatDate(boat.fechaIngreso)}</div>
              </div>
              <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                <div className="text-xs uppercase tracking-wide text-slate-500">Remos asignados</div>
                <div className="font-medium text-slate-800">{boat.row ?? 'No informado'}</div>
              </div>
              <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                <div className="text-xs uppercase tracking-wide text-slate-500">Peso minimo / maximo</div>
                <div className="font-medium text-slate-800">
                  {pesoMin !== null || pesoMax !== null
                    ? `${pesoMin ?? 'No informado'} kg - ${pesoMax ?? 'No informado'} kg`
                    : 'No informado'}
                </div>
              </div>
              <div className="rounded-lg bg-white border border-slate-200 px-3 py-2 sm:col-span-2">
                <div className="text-xs uppercase tracking-wide text-slate-500">Ubicacion</div>
                <div className="font-medium text-slate-800">{boat.ubicacion || boat.proveedor || 'No informado'}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <WrenchScrewdriverIcon className="w-5 h-5 text-amber-600" />
              <h4 className="text-base font-semibold text-slate-800">Historial de reparaciones</h4>
            </div>

            {repairs.length === 0 ? (
              <div className="text-sm text-slate-500">Este bote no tiene reparaciones registradas.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600">
                      <th className="text-left py-2 pr-3 font-semibold">Inicio reparacion</th>
                      <th className="text-left py-2 pr-3 font-semibold">Finalizacion reparacion</th>
                      <th className="text-left py-2 pr-3 font-semibold">Motivo de reparacion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repairs.map((repair) => {
                      const repairId = repair._id || repair.id;
                      return (
                        <tr key={repairId} className="border-b border-slate-100 align-top">
                          <td className="py-2 pr-3 text-slate-700">{formatDate(repair.enReparacionAt || repair.fechaReporte)}</td>
                          <td className="py-2 pr-3 text-slate-700">{formatDate(repair.cerradoAt)}</td>
                          <td className="py-2 pr-3 text-slate-700">{repair.descripcion || 'Sin detalle'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
