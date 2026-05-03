import React, { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL, recruiterAuthHeader } from '../config';
import { downloadCandidateCv } from '../api/candidateCv';

export type CvRowStatus = 'none' | 'ready' | 'missing';

export type CandidateRow = {
  id: number;
  fullName: string;
  email: string;
  createdAt: string;
  cv: { status: CvRowStatus };
};

type Props = {
  refreshKey: number;
  onAddCandidate: () => void;
};

function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('es', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return iso;
  }
}

export function CandidateList({ refreshKey, onAddCandidate }: Props): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CandidateRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUnauthorized(false);
    try {
      const res = await fetch(apiUrl('/api/candidates'), {
        headers: { ...recruiterAuthHeader() },
      });
      if (res.status === 401) {
        setUnauthorized(true);
        setRows([]);
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error || 'No se pudo obtener la lista de candidatos.');
        setRows([]);
        return;
      }
      const data = (await res.json()) as { candidates?: CandidateRow[] };
      setRows(Array.isArray(data.candidates) ? data.candidates : []);
    } catch {
      setError('Error de red al cargar candidatos. Comprueba la conexión e inténtalo de nuevo.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const onDownload = async (id: number) => {
    setDownloadError(null);
    setDownloadingId(id);
    try {
      await downloadCandidateCv(id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al descargar';
      if (msg === 'UNAUTHORIZED') {
        setUnauthorized(true);
      } else {
        setDownloadError(msg);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  if (unauthorized) {
    return (
      <section className="candidate-list-section" aria-labelledby="list-title">
        <h2 id="list-title" className="section-title">
          Candidatos
        </h2>
        <div className="auth-gate card-surface" role="alert">
          <h3 className="auth-gate-title">Sesión no válida</h3>
          <p className="auth-gate-text">
            No tienes permiso para ver esta lista. En un entorno real serías redirigido al inicio de
            sesión. Configura el mismo token que el API en{' '}
            <code className="inline-code">REACT_APP_RECRUITER_API_TOKEN</code> o usa el token de
            desarrollo por defecto.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="candidate-list-section" aria-labelledby="list-title">
      <h2 id="list-title" className="section-title">
        Candidatos
      </h2>

      {loading && (
        <p className="list-loading" aria-live="polite">
          Cargando candidatos…
        </p>
      )}

      {!loading && error && (
        <div className="banner banner-error" role="alert">
          <p>{error}</p>
          <button type="button" className="btn secondary" onClick={() => void load()}>
            Reintentar
          </button>
        </div>
      )}

      {downloadError && (
        <div className="banner banner-error" role="alert">
          <p>{downloadError}</p>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="empty-state card-surface">
          <p className="empty-state-title">Aún no hay candidatos</p>
          <p className="empty-state-text">
            Cuando registres candidatos, aparecerán aquí con su email, fecha de alta y enlace al CV.
          </p>
          <button type="button" className="btn primary" onClick={onAddCandidate}>
            Añadir candidato
          </button>
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="table-wrap">
          <table className="candidate-table">
            <thead>
              <tr>
                <th scope="col">Nombre completo</th>
                <th scope="col">Email</th>
                <th scope="col">Fecha de alta</th>
                <th scope="col">CV</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td data-label="Nombre">{r.fullName}</td>
                  <td data-label="Email">
                    <a href={`mailto:${r.email}`}>{r.email}</a>
                  </td>
                  <td data-label="Fecha">{formatDate(r.createdAt)}</td>
                  <td data-label="CV">
                    {r.cv.status === 'none' && <span className="cv-muted">Sin CV</span>}
                    {r.cv.status === 'missing' && (
                      <span className="cv-missing" title="El registro indica CV pero el archivo no está en disco">
                        Archivo no encontrado
                      </span>
                    )}
                    {r.cv.status === 'ready' && (
                      <button
                        type="button"
                        className="btn linkish"
                        disabled={downloadingId === r.id}
                        onClick={() => void onDownload(r.id)}
                      >
                        {downloadingId === r.id ? 'Descargando…' : 'Descargar CV'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
