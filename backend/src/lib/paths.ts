import fs from 'fs';
import path from 'path';

/**
 * Resuelve el directorio base de subidas de forma portable (Windows/Mac/Linux).
 */
export function getUploadsRoot(): string {
  const fromEnv = process.env.UPLOADS_DIR;
  if (fromEnv && fromEnv.trim().length > 0) {
    return path.resolve(fromEnv.trim());
  }
  return path.join(process.cwd(), 'uploads');
}

export function getCvsDir(): string {
  return path.join(getUploadsRoot(), 'cvs');
}

export function ensureCvsDir(): void {
  const dir = getCvsDir();
  fs.mkdirSync(dir, { recursive: true });
}
