import { z } from 'zod';

export const candidateFormSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio').max(200),
  lastName: z.string().min(1, 'Los apellidos son obligatorios').max(200),
  email: z.string().min(1, 'El email es obligatorio').email('El email no es válido').max(320),
  phone: z
    .string()
    .min(1, 'El teléfono es obligatorio')
    .max(40)
    .regex(/^[\d+\s().-]{5,40}$/u, 'El teléfono no tiene un formato válido'),
  address: z.string().min(1, 'La dirección es obligatoria').max(2000),
  education: z.string().min(1, 'La formación es obligatoria').max(5000),
  workExperience: z.string().min(1, 'La experiencia laboral es obligatoria').max(10000),
});

export type CandidateFormInput = z.infer<typeof candidateFormSchema>;
