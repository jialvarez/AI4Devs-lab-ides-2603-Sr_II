import fs from 'fs';
import path from 'path';
import { getCvsDir, getUploadsRoot } from './paths';

/**
 * Resuelve la ruta absoluta del CV solo si el valor en BD es relativo seguro `cvs/<archivo>`.
 * Evita path traversal (.., separadores extra, etc.).
 */
export function resolveSafeCvAbsolutePath(cvFilePath: string | null | undefined): string | null {
  if (!cvFilePath || typeof cvFilePath !== 'string') {
    return null;
  }
  const norm = cvFilePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const parts = norm.split('/').filter(Boolean);
  if (parts.length !== 2 || parts[0] !== 'cvs') {
    return null;
  }
  const segment = parts[1];
  const base = path.basename(segment);
  if (!base || base !== segment || base === '.' || base === '..') {
    return null;
  }
  if (!/^[a-zA-Z0-9._-]+\.(pdf|docx)$/i.test(base)) {
    return null;
  }
  const abs = path.resolve(getUploadsRoot(), 'cvs', base);
  const cvsRoot = path.resolve(getCvsDir());
  const resolved = path.resolve(abs);
  if (resolved !== cvsRoot && !resolved.startsWith(cvsRoot + path.sep)) {
    return null;
  }
  return resolved;
}

export function cvFileExistsOnDisk(cvFilePath: string | null | undefined): boolean {
  const abs = resolveSafeCvAbsolutePath(cvFilePath);
  if (!abs) {
    return false;
  }
  try {
    return fs.existsSync(abs) && fs.statSync(abs).isFile();
  } catch {
    return false;
  }
}

export function mimeForCvFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.docx') {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  return 'application/octet-stream';
}
