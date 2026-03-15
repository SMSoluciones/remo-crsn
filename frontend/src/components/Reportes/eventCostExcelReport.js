import ExcelJS from 'exceljs';
import { downloadExcelBuffer } from './excelDownload';

function sanitizeFileName(value) {
  return String(value || 'evento').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-AR');
}

function getEventTotal(event) {
  return (Array.isArray(event?.gastos) ? event.gastos : []).reduce(
    (acc, gasto) => acc + Number(gasto?.monto || 0),
    0,
  );
}

function getEventTotalEntrada(event) {
  return Number(event?.totalEntrada || 0);
}

function getEventRecaudacion(event) {
  return getEventTotalEntrada(event) - getEventTotal(event);
}

export async function exportEventCostExcel(event) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Rendicion');

  sheet.columns = [{ width: 34 }, { width: 45 }, { width: 62 }, { width: 45 }];

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
  sheet.getCell(superavitRow, 3).value = `${
    recaudacion >= 0 ? 'Superavit' : 'Deficit'
  } ${formatMoney(Math.abs(recaudacion))}`;
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
  const fileName = `rendicion_${sanitizeFileName(event?.title)}.xlsx`;
  downloadExcelBuffer(buffer, fileName);

  return { fileName };
}
