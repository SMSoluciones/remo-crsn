import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { downloadExcelBuffer } from './excelDownload';

const DEFAULT_TIPO_LABELS = {
  bote: 'Bote',
  remo: 'Remo',
  carro: 'Carro',
};

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD2DCE6' } };
const WHITE_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

const THIN_BORDER = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } },
};

async function svgToPngDataUrl(svgPath) {
  const response = await fetch(svgPath);
  if (!response.ok) throw new Error(`No se pudo cargar el logo: ${svgPath}`);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo procesar el logo SVG'));
      img.src = objectUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo inicializar canvas para el logo');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function setRange(sheet, fromRow, toRow, fromCol, toCol, style = {}) {
  for (let row = fromRow; row <= toRow; row += 1) {
    for (let col = fromCol; col <= toCol; col += 1) {
      const cell = sheet.getRow(row).getCell(col);
      if (style.fill) cell.fill = style.fill;
      if (style.font) cell.font = style.font;
      if (style.alignment) cell.alignment = style.alignment;
      if (style.border) cell.border = style.border;
    }
  }
}

function inferTaskLabel(items) {
  const tipos = new Set((Array.isArray(items) ? items : []).map((item) => String(item?.tipo || '').trim().toLowerCase()));
  const parts = [];
  if (tipos.has('bote')) parts.push('BOTES');
  if (tipos.has('remo')) parts.push('REMOS');
  if (tipos.has('carro')) parts.push('ASIENTOS');

  if (parts.length === 0) {
    return 'REPARACIONES Y MANTENIMIENTO.';
  }

  if (parts.length === 1) {
    return `REPARACIONES Y MANTENIMIENTO DE ${parts[0]}.`;
  }

  if (parts.length === 2) {
    return `REPARACIONES Y MANTENIMIENTO DE ${parts[0]} Y ${parts[1]}.`;
  }

  return `REPARACIONES Y MANTENIMIENTO DE ${parts[0]}, ${parts[1]} Y ${parts[2]}.`;
}

function buildDetailLines(items, tipoLabels) {
  return (Array.isArray(items) ? items : []).map((item, index) => {
    const tipoKey = String(item?.tipo || '').trim().toLowerCase();
    const estadoKey = String(item?.estado || '').trim().toLowerCase();

    const tipoWord = tipoKey === 'bote'
      ? 'BOTE'
      : tipoKey === 'remo'
        ? 'REMO'
        : (tipoLabels[tipoKey] || 'ASIENTO').toUpperCase();

    const accion = estadoKey === 'mantenimiento' ? 'MANTENIMIENTO' : 'REPARACION';
    const nombre = String(item?.nombre || '').trim().toUpperCase() || `${tipoWord} ${index + 1}`;
    const causa = String(item?.causa || '').trim() || 'SIN MOTIVO INFORMADO';

    return {
      index: index + 1,
      text: `${accion} ${tipoWord} ${nombre}: ${causa}`,
    };
  });
}

export async function exportRepairsExcel(selectedItems, options = {}) {
  const tipoLabels = options.tipoLabels || DEFAULT_TIPO_LABELS;
  const materialsDetail = String(options.materialsDetail || '').trim();
  const observations = String(options.observations || '').trim();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CRSN';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Nota de pedidos', {
    pageSetup: {
      paperSize: 9,
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: { left: 0.2, right: 0.2, top: 0.25, bottom: 0.25, header: 0.15, footer: 0.15 },
    },
  });

  sheet.columns = [
    { width: 8 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
  ];

  // Layout base con alturas fijas calibradas para A4 (imagen de referencia).
  const fixedHeights = {
    1: 60,
    2: 52,
    3: 24,
    4: 22,
    5: 22,
    6: 24,
    7: 26,
    8: 26,
    9: 26,
    10: 26,
    11: 26,
    12: 26,
    13: 26,
    14: 26,
    15: 26,
    16: 26,
    17: 26,
    18: 26,
    19: 26,
    20: 26,
    21: 50,
    22: 26,
    23: 50,
  };

  Object.entries(fixedHeights).forEach(([row, height]) => {
    sheet.getRow(Number(row)).height = height;
  });

  const now = new Date();
  const fechaEmision = format(now, 'dd/MM/yyyy');
  const tareaTexto = inferTaskLabel(selectedItems);
  const detailLines = buildDetailLines(selectedItems, tipoLabels);

  // Top area.
  sheet.mergeCells('A1:B2');
  sheet.mergeCells('C1:F1');
  sheet.mergeCells('C2:F2');

  sheet.getCell('C1').value = 'AREA CAPITANIA CRSN';
  sheet.getCell('C2').value = 'NOTA DE PEDIDOS';
  sheet.getCell('C1').font = { name: 'Times New Roman', size: 22, bold: true };
  sheet.getCell('C2').font = { name: 'Times New Roman', size: 16, bold: false };
  sheet.getCell('C1').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('C2').alignment = { horizontal: 'center', vertical: 'middle' };

  setRange(sheet, 1, 2, 1, 6, { fill: HEADER_FILL, border: THIN_BORDER });

  // Subcomision row.
  sheet.mergeCells('A3:F3');
  sheet.getCell('A3').value = 'SUBCOMISION DE REMO';
  sheet.getCell('A3').font = { name: 'Times New Roman', size: 11, bold: false };
  sheet.getCell('A3').alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  setRange(sheet, 3, 3, 1, 6, { border: THIN_BORDER, fill: WHITE_FILL });

  // Fecha.
  sheet.mergeCells('A4:B4');
  sheet.mergeCells('C4:F4');
  sheet.getCell('A4').value = 'FECHA';
  sheet.getCell('A4').font = { name: 'Times New Roman', size: 11, bold: false };
  sheet.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('C4').value = fechaEmision;
  sheet.getCell('C4').font = { name: 'Times New Roman', size: 11, bold: false };
  sheet.getCell('C4').alignment = { horizontal: 'center', vertical: 'middle' };
  setRange(sheet, 4, 4, 1, 6, { border: THIN_BORDER, fill: WHITE_FILL });

  // Responsables.
  sheet.mergeCells('A5:B5');
  sheet.mergeCells('C5:D5');
  sheet.mergeCells('E5:F5');
  sheet.getCell('A5').value = 'RESPONSABLE';
  sheet.getCell('A5').font = { name: 'Times New Roman', size: 11, bold: false };
  sheet.getCell('A5').alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

  sheet.getCell('C5').value = 'PAMELA BORGETTO';
  sheet.getCell('E5').value = 'SEBASTIAN MUÑOZ';
  sheet.getCell('C5').font = { name: 'Times New Roman', size: 11, bold: false };
  sheet.getCell('E5').font = { name: 'Times New Roman', size: 11, bold: false };
  sheet.getCell('C5').alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  sheet.getCell('E5').alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  setRange(sheet, 5, 5, 1, 6, { border: THIN_BORDER, fill: WHITE_FILL });

  // Tarea.
  sheet.mergeCells('A6:B6');
  sheet.mergeCells('C6:F6');
  sheet.getCell('A6').value = 'SUBCOMISION';
  sheet.getCell('A6').font = { name: 'Times New Roman', size: 11, bold: false };
  sheet.getCell('A6').alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

  sheet.getCell('C6').value = `TAREA: ${tareaTexto}`;
  sheet.getCell('C6').font = { name: 'Times New Roman', size: 11, bold: true };
  sheet.getCell('C6').alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  setRange(sheet, 6, 6, 1, 6, { border: THIN_BORDER, fill: WHITE_FILL });

  // Header bloque detalle.
  sheet.mergeCells('B7:F7');
  sheet.getCell('A7').value = 1;
  sheet.getCell('A7').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('A7').font = { name: 'Times New Roman', size: 11, bold: true };
  sheet.getCell('B7').value = 'DETALLE DE TAREAS A REALIZAR';
  sheet.getCell('B7').font = { name: 'Times New Roman', size: 11, bold: false };
  sheet.getCell('B7').alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  setRange(sheet, 7, 7, 1, 6, { border: THIN_BORDER, fill: HEADER_FILL });

  // Cuerpo detalle con caja alta (8..19).
  const detailBodyStart = 8;
  const detailBodyEnd = 19;
  const maxLines = detailBodyEnd - detailBodyStart + 1;

  for (let row = detailBodyStart; row <= detailBodyEnd; row += 1) {
    sheet.mergeCells(`B${row}:F${row}`);
    setRange(sheet, row, row, 1, 6, { border: THIN_BORDER, fill: WHITE_FILL });
  }

  if (detailLines.length === 0) {
    sheet.getCell(`B${detailBodyStart}`).value = 'SIN ITEMS SELECCIONADOS';
    sheet.getCell(`B${detailBodyStart}`).font = { name: 'Times New Roman', size: 11 };
    sheet.getCell(`B${detailBodyStart}`).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  } else {
    detailLines.slice(0, maxLines).forEach((line, index) => {
      const row = detailBodyStart + index;
      sheet.getCell(`A${row}`).value = line.index;
      sheet.getCell(`A${row}`).font = { name: 'Times New Roman', size: 11 };
      sheet.getCell(`A${row}`).alignment = { horizontal: 'center', vertical: 'top' };

      sheet.getCell(`B${row}`).value = line.text;
      sheet.getCell(`B${row}`).font = { name: 'Times New Roman', size: 11, bold: false };
      sheet.getCell(`B${row}`).alignment = { horizontal: 'left', vertical: 'top', wrapText: true, indent: 1 };
    });
  }

  // Seccion materiales.
  sheet.mergeCells('B20:F20');
  sheet.getCell('A20').value = 2;
  sheet.getCell('A20').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('A20').font = { name: 'Times New Roman', size: 11, bold: true };
  sheet.getCell('B20').value = 'DETALLE DE PEDIDO DE MATERIALES';
  sheet.getCell('B20').font = { name: 'Times New Roman', size: 11, bold: false };
  sheet.getCell('B20').alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  setRange(sheet, 20, 20, 1, 6, { border: THIN_BORDER, fill: HEADER_FILL });

  sheet.mergeCells('A21:A21');
  sheet.mergeCells('B21:F21');
  sheet.getCell('B21').value = materialsDetail;
  sheet.getCell('B21').font = { name: 'Times New Roman', size: 11 };
  sheet.getCell('B21').alignment = { horizontal: 'left', vertical: 'top', wrapText: true, indent: 1 };
  setRange(sheet, 21, 21, 1, 6, { border: THIN_BORDER, fill: WHITE_FILL });

  // Seccion observaciones.
  sheet.mergeCells('B22:F22');
  sheet.getCell('A22').value = 3;
  sheet.getCell('A22').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('A22').font = { name: 'Times New Roman', size: 11, bold: true };
  sheet.getCell('B22').value = 'OBSERVACIONES';
  sheet.getCell('B22').font = { name: 'Times New Roman', size: 11, bold: false };
  sheet.getCell('B22').alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  setRange(sheet, 22, 22, 1, 6, { border: THIN_BORDER, fill: HEADER_FILL });

  sheet.mergeCells('A23:A23');
  sheet.mergeCells('B23:F23');
  sheet.getCell('B23').value = observations;
  sheet.getCell('B23').font = { name: 'Times New Roman', size: 11 };
  sheet.getCell('B23').alignment = { horizontal: 'left', vertical: 'top', wrapText: true, indent: 1 };
  setRange(sheet, 23, 23, 1, 6, { border: THIN_BORDER, fill: WHITE_FILL });

  // Inserta el logo del club en el bloque superior izquierdo.
  try {
    const logoPngDataUrl = await svgToPngDataUrl('/icon.svg');
    const imageId = workbook.addImage({
      base64: logoPngDataUrl,
      extension: 'png',
    });

    // Centrar el logo cuadrado en el área merged A1:B2.
    sheet.addImage(imageId, {
    // Col A (width=8) ≈ 61px, Col B (width=20) ≈ 145px → total ≈ 206px ancho.
    // Row 1 (60pt) ≈ 80px, Row 2 (52pt) ≈ 69px → total ≈ 149px alto.
    // Logo 130px centrado: left=(206-130)/2=38px, top=(149-130)/2=9.5px.
    // tl.col=38/61=0.623, br.col=1+(38+130-61)/145=1.738
    // tl.row=9.5/80=0.119, br.row=1+(9.5+130-80)/69=1.862
      tl: { col: 0.623, row: 0.119 },
      br: { col: 1.738, row: 1.862 },
      editAs: 'oneCell',
    });
  } catch (error) {
    // Si falla el logo, el Excel igual se genera.
    console.warn('No se pudo insertar el logo en la planilla:', error);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `nota_pedidos_reparacion_${format(now, 'yyyyMMdd')}.xlsx`;
  downloadExcelBuffer(buffer, fileName);

  return { fileName };
}
