import { Router, Request, Response, NextFunction } from 'express';
import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import { candidateFormSchema } from '../schemas/candidateSchema';
import { sanitizeCandidateFields } from '../lib/sanitize';
import { sealAtRest } from '../lib/atRestCrypto';
import { requireRecruiterAuth } from '../middleware/authRecruiter';
import { uploadCvOptional } from '../middleware/cvUpload';

export function buildCandidatesRouter(prisma: PrismaClient): Router {
  const router = Router();
  router.use(requireRecruiterAuth);

  router.get('/suggestions/education', async (req: Request, res: Response) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q.length < 2) {
      res.json({ suggestions: [] });
      return;
    }
    try {
      const rows = await prisma.candidate.findMany({
        where: {
          education: { contains: q, mode: 'insensitive' },
        },
        select: { education: true },
        distinct: ['education'],
        take: 20,
        orderBy: { education: 'asc' },
      });
      res.json({ suggestions: rows.map((r) => r.education) });
    } catch (e) {
      console.error('education suggestions', e);
      res.json({ suggestions: [] });
    }
  });

  router.get('/suggestions/experience', async (req: Request, res: Response) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q.length < 2) {
      res.json({ suggestions: [] });
      return;
    }
    try {
      const rows = await prisma.candidate.findMany({
        where: {
          workExperience: { contains: q, mode: 'insensitive' },
        },
        select: { workExperience: true },
        distinct: ['workExperience'],
        take: 20,
        orderBy: { workExperience: 'asc' },
      });
      res.json({ suggestions: rows.map((r) => r.workExperience) });
    } catch (e) {
      console.error('experience suggestions', e);
      res.json({ suggestions: [] });
    }
  });

  router.post(
    '/',
    (req: Request, res: Response, next: NextFunction) => {
      uploadCvOptional(req, res, (err: unknown) => {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({ error: 'El CV supera el máximo de 5MB.', code: 'FILE_TOO_LARGE' });
            return;
          }
          res.status(400).json({ error: 'No se pudo adjuntar el archivo.', code: 'UPLOAD_ERROR' });
          return;
        }
        if (err) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Error al procesar el archivo. Usa PDF o DOCX de hasta 5MB.';
          res.status(400).json({ error: msg, code: 'FILE_REJECTED' });
          return;
        }
        next();
      });
    },
    async (req: Request, res: Response) => {
      const raw = {
        firstName: String(req.body?.firstName ?? ''),
        lastName: String(req.body?.lastName ?? ''),
        email: String(req.body?.email ?? ''),
        phone: String(req.body?.phone ?? ''),
        address: String(req.body?.address ?? ''),
        education: String(req.body?.education ?? ''),
        workExperience: String(req.body?.workExperience ?? ''),
      };

      const parsed = candidateFormSchema.safeParse(raw);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Validación incorrecta',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const clean = sanitizeCandidateFields(parsed.data);
      const file = req.file;
      let cvFilePath: string | null = null;
      if (file?.filename) {
        cvFilePath = path.posix.join('cvs', path.basename(file.filename));
      }

      // El email permanece en claro para unicidad e índices; el resto de PII puede cifrarse con CANDIDATE_ENCRYPTION_KEY.
      const payload = {
        firstName: sealAtRest(clean.firstName),
        lastName: sealAtRest(clean.lastName),
        email: clean.email,
        phone: sealAtRest(clean.phone),
        address: sealAtRest(clean.address),
        education: clean.education,
        workExperience: clean.workExperience,
        cvFilePath,
      };

      try {
        const created = await prisma.candidate.create({ data: payload });
        res.status(201).json({
          message: 'Candidato registrado correctamente en el sistema.',
          id: created.id,
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          res.status(409).json({
            error: 'Ya existe un candidato con ese email.',
            code: 'DUPLICATE_EMAIL',
          });
          return;
        }
        console.error('create candidate', e);
        res.status(500).json({
          error: 'Error interno al guardar el candidato. Inténtalo de nuevo más tarde.',
          code: 'SERVER_ERROR',
        });
      }
    },
  );

  return router;
}
