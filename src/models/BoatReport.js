// Modelo de datos para Reportes de Fallas de Botes
export const BoatReportStatus = {
  ABIERTO: 'abierto',
  EN_REPARACION: 'en_reparacion',
  CERRADO: 'cerrado',
};

export class BoatReport {
  constructor({ id, boatId, descripcion, fotoURL, fechaReporte, status }) {
    this.id = id;
    this.boatId = boatId;
    this.descripcion = descripcion;
    this.fotoURL = fotoURL;
    this.fechaReporte = fechaReporte;
    this.status = status;
  }
}
