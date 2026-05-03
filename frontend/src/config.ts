const DEV_TOKEN = 'dev-lti-recruiter-token';

/** URL base del API (vacío = mismo origen, p. ej. con proxy de CRA). */
export const API_BASE_URL = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

export function recruiterAuthHeader(): Record<string, string> {
  const token =
    process.env.REACT_APP_RECRUITER_API_TOKEN ||
    (process.env.NODE_ENV === 'development' ? DEV_TOKEN : '');
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
}
