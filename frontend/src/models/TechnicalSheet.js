// Modelo de datos para Fichas Técnicas
export class TechnicalSheet {
  constructor({ id, studentId, entrenadorId, fecha, postura, remada, equilibrio, observaciones }) {
    this.id = id;
    this.studentId = studentId;
    this.entrenadorId = entrenadorId;
    this.fecha = fecha;
    this.postura = postura;
    this.remada = remada;
    this.equilibrio = equilibrio;
    this.observaciones = observaciones;
  }
}
