import * as XLSX from 'xlsx';


export function normalizeHeader(value) { return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' '); }
export function detectColumn(headers, candidates) { return headers.findIndex((h) => candidates.includes(normalizeHeader(h))); }
export function getCellLink(cell) {
  if (!cell) return '';
  const raw = typeof cell === 'object' ? cell.v ?? cell.w ?? '' : cell;
  const hyperlink = typeof cell === 'object' ? cell.l?.Target || cell.l?.target || '' : '';
  const formula = typeof cell === 'object' ? cell.f || '' : '';
  const formulaMatch = formula.match(/HYPERLINK\s*\(\s*["']([^"']+)["']/i);
  const value = String(hyperlink || formulaMatch?.[1] || raw || '').trim();
  const url = value.match(/https?:\/\/[^\s"')]+/i)?.[0] || value;
  return url.replace(/[),;]+$/, '');
}
export function extractDriveFileId(input) {
  const value = String(input ?? '').trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!/google\.com$/.test(url.hostname) && !/\.google\.com$/.test(url.hostname)) return null;
    const match = url.pathname.match(/\/d\/([a-zA-Z0-9_-]{10,})/) || url.searchParams.get('id')?.match(/^([a-zA-Z0-9_-]{10,})$/);
    return match ? (match[1] || match[0]) : null;
  } catch { return null; }
}
export function isDriveFolderUrl(input) { return /\/folders\/[a-zA-Z0-9_-]+/i.test(String(input ?? '')); }
export function parseImageMime(mime, bytes) {
  const m = String(mime || '').toLowerCase();
  if (m === 'image/jpeg' || m === 'image/jpg') return 'jpg';
  if (m === 'image/png') return 'png';
  if (m === 'image/webp') return 'webp';
  if (m === 'image/heic') return 'heic';
  if (m === 'image/heif') return 'heif';
  const b = new Uint8Array(bytes || []);
  if (b[0] === 0xff && b[1] === 0xd8) return 'jpg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45) return 'webp';
  return null;
}
export function sanitizeFilename(value, max = 120) {
  // eslint-disable-next-line no-control-regex
  let name = String(value ?? '').replace(/[<>:"/\\|?*\x00-\x1F]/g, '').replace(/\s+/g, ' ').trim().replace(/[. ]+$/g, '');
  if (!name) return '';
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i.test(name)) name = `_${name}`;
  return name.slice(0, max).replace(/[. ]+$/g, '');
}
export function uniqueFilename(base, used) {
  if (!used.has(base)) { used.add(base); return base; }
  const dot = base.lastIndexOf('.'); const stem = dot > 0 ? base.slice(0, dot) : base; const ext = dot > 0 ? base.slice(dot) : '';
  let n = 2; while (used.has(`${stem} (${n})${ext}`)) n += 1;
  const result = `${stem} (${n})${ext}`; used.add(result); return result;
}
export function summarizeUrl(url) { const s = String(url || ''); return s.length <= 44 ? s : `${s.slice(0, 20)}…${s.slice(-20)}`; }
export function makeProblemsCsv(rows) {
  const header = ['Baris Excel', 'Nama', 'Nomor/ID', 'Link', 'Jenis masalah', 'Pesan error'];
  const esc = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
  return '\uFEFF' + [header, ...rows.map((r) => [r.excelRow, r.name, r.id, r.url, r.type, r.message])].map((r) => r.map(esc).join(';')).join('\r\n');
}
export function zipName(excelName) { return `FOTO - ${sanitizeFilename(String(excelName || 'data').replace(/\.[^.]+$/, '')) || 'data'}.zip`; }

export async function readWorkbook(file) {
  const data = await file.arrayBuffer(); const wb = XLSX.read(data, { type: 'array', cellFormula: true, cellStyles: true });
  const sheets = wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name]; const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
    const headers = (matrix[0] || []).map((v) => String(v ?? '').trim());
    const rows = [];
    for (let i = 1; i < matrix.length; i += 1) {
      const values = matrix[i] || []; if (values.every((v) => String(v ?? '').trim() === '')) continue;
      const cells = headers.map((_, c) => ws[XLSX.utils.encode_cell({ r: i, c })]);
      rows.push({ excelRow: i + 1, values, cells });
    }
    return { name, headers, rows };
  });
  return { workbook: wb, sheets };
}

export function prepareRows(sheet, options) {
  const { nameCol, linkCol, idCol = -1, mode = 'name', uppercase = false } = options; const used = new Set();
  return sheet.rows.map((row) => {
    const nameRaw = row.values[nameCol] ?? ''; const name = sanitizeFilename(uppercase ? String(nameRaw).toUpperCase() : nameRaw);
    const url = getCellLink(row.cells[linkCol]) || String(row.values[linkCol] ?? '').trim(); const id = String(row.values[idCol] ?? '').trim();
    let problem = null; if (!name) problem = ['nama-kosong', 'Nama kosong']; else if (!url) problem = ['link-kosong', 'Link foto kosong']; else if (isDriveFolderUrl(url)) problem = ['folder', 'Link mengarah ke folder, bukan file foto.']; else if (!extractDriveFileId(url) && !/^https?:\/\//i.test(url)) problem = ['link-tidak-valid', 'Link foto tidak valid.'];
    const prefix = mode === 'number' ? id : mode === 'id' ? id : ''; const stem = sanitizeFilename(prefix ? `${prefix} - ${name}` : name);
    return { ...row, name, id, url, fileStem: stem, filename: uniqueFilename(`${stem || 'tanpa-nama'}.jpg`, used), problem };
  });
}
