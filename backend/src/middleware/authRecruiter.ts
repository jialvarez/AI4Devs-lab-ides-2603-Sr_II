import { Request, Response, NextFunction } from 'express';

const DEV_TOKEN = 'dev-lti-recruiter-token';

export function resolveRecruiterToken(): string {
  const fromEnv = process.env.RECRUITER_API_TOKEN;
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('RECRUITER_API_TOKEN es obligatorio en producción');
  }
  return DEV_TOKEN;
}

/**
 * Solo reclutadores con token de sesión (Bearer) válido.
 */
export function requireRecruiterAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const expected = resolveRecruiterToken();
    const header = req.headers.authorization;
    const token =
      typeof header === 'string' && header.toLowerCase().startsWith('bearer ')
        ? header.slice(7).trim()
        : undefined;
    if (!token || token !== expected) {
      res.status(401).json({
        error: 'Sesión no válida o token ausente. Inicia sesión como reclutador.',
        code: 'UNAUTHORIZED',
      });
      return;
    }
    next();
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error de configuración';
    res.status(503).json({ error: message, code: 'SERVER_MISCONFIG' });
  }
}
