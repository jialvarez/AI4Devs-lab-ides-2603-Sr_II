import { API_BASE_URL, recruiterAuthHeader } from '../config';

function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export async function downloadCandidateCv(candidateId: number): Promise<void> {
  const res = await fetch(apiUrl(`/api/candidates/${candidateId}/cv`), {
    method: 'GET',
    headers: { ...recruiterAuthHeader() },
  });

  if (res.status === 401) {
    throw new Error('UNAUTHORIZED');
  }

  const ct = res.headers.get('Content-Type') || '';
  if (ct.includes('application/json')) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || 'No se pudo descargar el CV.');
  }

  if (!res.ok) {
    throw new Error('No se pudo descargar el CV.');
  }

  const blob = await res.blob();
  const cd = res.headers.get('Content-Disposition');
  let filename = `cv-candidato-${candidateId}.pdf`;
  const m = cd?.match(/filename="?([^";]+)"?/i);
  if (m?.[1]) {
    filename = m[1];
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
