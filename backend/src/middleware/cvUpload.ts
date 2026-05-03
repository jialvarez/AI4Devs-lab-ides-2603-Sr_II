import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import { getCvsDir, ensureCvsDir } from '../lib/paths';

const MAX_BYTES = 5 * 1024 * 1024;

const allowedMime = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

ensureCvsDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureCvsDir();
    cb(null, getCvsDir());
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ext === '.pdf' || ext === '.docx' ? ext : '.pdf';
    cb(null, `${randomUUID()}${safeExt}`);
  },
});

export const cvUpload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeOk = allowedMime.has(file.mimetype);
    const extOk = ext === '.pdf' || ext === '.docx';
    if (mimeOk && extOk) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF o DOCX (máx. 5MB).'));
    }
  },
});

export const uploadCvOptional = cvUpload.single('cv');
