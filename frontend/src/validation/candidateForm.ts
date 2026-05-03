export type CandidateFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  education: string;
  workExperience: string;
};

export type FieldErrors = Partial<Record<keyof CandidateFormState, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d+\s().-]{5,40}$/u;

export function validateCandidateForm(values: CandidateFormState): FieldErrors {
  const e: FieldErrors = {};
  if (!values.firstName.trim()) e.firstName = 'El nombre es obligatorio';
  if (!values.lastName.trim()) e.lastName = 'Los apellidos son obligatorios';
  if (!values.email.trim()) e.email = 'El email es obligatorio';
  else if (!EMAIL_RE.test(values.email.trim())) e.email = 'Introduce un email válido';
  if (!values.phone.trim()) e.phone = 'El teléfono es obligatorio';
  else if (!PHONE_RE.test(values.phone.trim())) e.phone = 'Formato de teléfono no válido';
  if (!values.address.trim()) e.address = 'La dirección es obligatoria';
  if (!values.education.trim()) e.education = 'La formación es obligatoria';
  if (!values.workExperience.trim()) e.workExperience = 'La experiencia laboral es obligatoria';
  return e;
}
