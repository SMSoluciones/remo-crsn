const express = require('express');

const router = express.Router();

const SOURCE_URL = 'https://contenidosweb.prefecturanaval.gob.ar/alturas/?page=historico&tiempo=7&id=300';
const CACHE_TTL_MS = 5 * 60 * 1000;

let cache = {
  ts: 0,
  data: null,
};

function toNumber(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim().replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function matchText(text, regex) {
  const match = text.match(regex);
  return match && match[1] ? String(match[1]).trim() : '';
}

function normalizeHtmlToText(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseLatestFromTopRow(text) {
  // The first row in "Ultimos Registros" is the newest level (puesto 1).
  const match = String(text || '').match(
    /Ultimos\s+Registros[\s\S]*?\b1\s+([0-9]{4}-[0-9]{2}-[0-9]{2})\s+([0-9]{2}:[0-9]{2})\s+([0-9]+(?:[.,][0-9]+)?)\s*Mts/i
  );
  if (!match) return { level: null, label: '' };
  return {
    level: toNumber(match[3]),
    label: `${match[1]} ${match[2]}`,
  };
}

async function fetchSanNicolasLevel() {
  const now = Date.now();
  if (cache.data && now - cache.ts < CACHE_TTL_MS) {
    return cache.data;
  }

  const res = await fetch(SOURCE_URL, {
    headers: {
      'User-Agent': 'remo-crsn-river-level/1.0',
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!res.ok) {
    throw new Error(`Error obteniendo datos de Prefectura: HTTP ${res.status}`);
  }

  const html = await res.text();
  const text = normalizeHtmlToText(html);

  const puerto = matchText(text, /Puerto:\s*([^:]+?)\s+Dependencia informante:/i);
  const dependencia = matchText(text, /Dependencia informante:\s*([^:]+?)\s+Ultimo registro:/i);
  const ultimoBloque = matchText(text, /Ultimo registro:\s*([\s\S]*?)\s+Registro anterior:/i);
  const anteriorBloque = matchText(text, /Registro anterior:\s*([\s\S]*?)\s+Alerta:/i);
  const alertaRaw = matchText(text, /Alerta:\s*([0-9]+(?:[.,][0-9]+)?)/i);
  const evacuacionRaw = matchText(text, /Evacuacion:\s*([0-9]+(?:[.,][0-9]+)?)/i);

  const ultimoNivelRaw = matchText(ultimoBloque, /([0-9]+(?:[.,][0-9]+)?)\s*Mts/i);
  const anteriorNivelRaw = matchText(anteriorBloque, /([0-9]+(?:[.,][0-9]+)?)\s*Mts/i);
  const topRow = parseLatestFromTopRow(text);

  const data = {
    source: 'Prefectura Naval Argentina',
    sourceUrl: SOURCE_URL,
    stationId: 300,
    stationName: 'San Nicolas de los Arroyos',
    puerto: puerto || 'SAN NICOLAS en rio PARANA',
    dependenciaInformante: dependencia || 'Prefectura San nicolas',
    // Requested behavior: use "puesto 1" from "Ultimos Registros" as source of truth.
    latestLevelMts: topRow.level !== null ? topRow.level : toNumber(ultimoNivelRaw),
    latestRecordLabel: topRow.label || ultimoBloque || '',
    previousLevelMts: toNumber(anteriorNivelRaw),
    previousRecordLabel: anteriorBloque || '',
    alertLevelMts: toNumber(alertaRaw),
    evacuationLevelMts: toNumber(evacuacionRaw),
    fetchedAt: new Date().toISOString(),
  };

  cache = { ts: now, data };
  return data;
}

router.get('/san-nicolas', async (req, res) => {
  try {
    const data = await fetchSanNicolasLevel();
    return res.json(data);
  } catch (err) {
    console.error('Error obteniendo nivel del rio de Prefectura:', err);
    return res.status(502).json({ error: 'No se pudo obtener el nivel del rio desde Prefectura.' });
  }
});

module.exports = router;
