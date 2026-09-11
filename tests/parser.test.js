import { describe, expect, it } from 'vitest';
import { extractDriveFileId, isDriveFolderUrl, sanitizeFilename, uniqueFilename, parseImageMime, makeProblemsCsv, zipName, getCellLink } from '../src/parser.js';
describe('parser foto drive', () => {
  it('mengenali URL Drive dan folder', () => { expect(extractDriveFileId('https://drive.google.com/file/d/abc_DEF-123456/view?x=1')).toBe('abc_DEF-123456'); expect(extractDriveFileId('https://drive.google.com/open?id=abc_DEF-123456')).toBe('abc_DEF-123456'); expect(isDriveFolderUrl('https://drive.google.com/drive/folders/abc_DEF-123456')).toBe(true); });
  it('mendapatkan hyperlink dan formula', () => { expect(getCellLink({ v: 'Open', l: { Target: 'https://drive.google.com/uc?id=abc_DEF-123456' } })).toContain('drive.google'); expect(getCellLink({ v: 'Foto', f: 'HYPERLINK("https://example.com/a.jpg","Foto")' })).toBe('https://example.com/a.jpg'); });
  it('membersihkan nama Windows dan reserved name', () => { expect(sanitizeFilename('CON: foto?  ')).toBe('CON foto'); expect(sanitizeFilename('CON')).toBe('_CON'); expect(sanitizeFilename('Nama. ')).toBe('Nama'); });
  it('mengurutkan duplikat sesuai urutan', () => { const s = new Set(); expect(uniqueFilename('BUDI.jpg', s)).toBe('BUDI.jpg'); expect(uniqueFilename('BUDI.jpg', s)).toBe('BUDI (2).jpg'); expect(uniqueFilename('BUDI.jpg', s)).toBe('BUDI (3).jpg'); });
  it('mengenali signature gambar dan menolak HTML', () => { expect(parseImageMime('', [0xff, 0xd8, 0xff])).toBe('jpg'); expect(parseImageMime('text/html', [60, 104, 116, 109, 108])).toBe(null); });
  it('membuat CSV BOM dan nama ZIP', () => { expect(makeProblemsCsv([{ excelRow: 2, name: 'Siti', id: '1', url: '', type: 'link-kosong', message: 'kosong' }])).toMatch(/^\uFEFF/); expect(zipName('contoh.xlsx')).toBe('FOTO - contoh.zip'); });
});
