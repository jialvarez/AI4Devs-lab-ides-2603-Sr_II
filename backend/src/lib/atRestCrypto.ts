import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const PREFIX = 'v1:';

function getKey32(): Buffer | null {
  const hex = process.env.CANDIDATE_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    return null;
  }
  try {
    return Buffer.from(hex, 'hex');
  } catch {
    return null;
  }
}

/** Cifra texto para almacenamiento si existe CANDIDATE_ENCRYPTION_KEY (64 caracteres hex = 32 bytes). */
export function sealAtRest(plain: string): string {
  const key = getKey32();
  if (!key) {
    return plain;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, enc]).toString('base64');
  return `${PREFIX}${payload}`;
}

export function openAtRest(stored: string): string {
  if (!stored.startsWith(PREFIX)) {
    return stored;
  }
  const key = getKey32();
  if (!key) {
    throw new Error('CANDIDATE_ENCRYPTION_KEY requerido para descifrar datos');
  }
  const raw = Buffer.from(stored.slice(PREFIX.length), 'base64');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
