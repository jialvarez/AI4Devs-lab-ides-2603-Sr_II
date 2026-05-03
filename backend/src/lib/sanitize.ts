import validator from 'validator';

const MAX_LEN: Record<string, number> = {
  firstName: 200,
  lastName: 200,
  email: 320,
  phone: 40,
  address: 2000,
  education: 5000,
  workExperience: 10000,
};

function stripXssish(s: string, max: number): string {
  return validator
    .trim(s)
    .replace(/\u0000/g, '')
    .replace(/</g, '')
    .replace(/>/g, '')
    .replace(/"/g, '')
    .replace(/'/g, '')
    .slice(0, max);
}

function stripXssishName(s: string, max: number): string {
  return validator
    .trim(s)
    .replace(/\u0000/g, '')
    .replace(/</g, '')
    .replace(/>/g, '')
    .replace(/"/g, '')
    .slice(0, max);
}

/**
 * Normaliza texto para persistencia: sin etiquetas HTML obvias; el email se normaliza sin entidades HTML.
 */
export function sanitizeCandidateFields(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  education: string;
  workExperience: string;
}): typeof input {
  const maxEmail = MAX_LEN.email;
  const emailRaw = validator.trim(input.email).replace(/\u0000/g, '').slice(0, maxEmail);
  const emailNorm = validator.normalizeEmail(emailRaw, { gmail_remove_dots: false }) || emailRaw;

  return {
    firstName: stripXssishName(input.firstName, MAX_LEN.firstName),
    lastName: stripXssishName(input.lastName, MAX_LEN.lastName),
    email: emailNorm,
    phone: stripXssish(input.phone, MAX_LEN.phone).replace(/[^\d+\s().-]/g, ''),
    address: stripXssish(input.address, MAX_LEN.address),
    education: stripXssish(input.education, MAX_LEN.education),
    workExperience: stripXssish(input.workExperience, MAX_LEN.workExperience),
  };
}
