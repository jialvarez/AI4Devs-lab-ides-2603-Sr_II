# Feature: Alta de candidato (Add Candidate)

## Objetivo

Permitir al reclutador registrar un candidato con datos de contacto, formación y experiencia, opcionalmente con CV en **PDF** o **DOCX**, con confirmación y manejo de errores.

## Interfaz (frontend)

- **Panel del reclutador**: botón principal *Añadir nuevo candidato* (`frontend/src/App.tsx`).
- **Formulario** (`frontend/src/components/AddCandidateForm.tsx`):
  - Campos: nombre, apellidos, email, teléfono, dirección, formación, experiencia laboral, CV opcional.
  - **Validación en cliente**: reglas en `frontend/src/validation/candidateForm.ts` (campos obligatorios, email por expresión regular, teléfono con patrón acotado). Los errores se muestran al marcar campos (`touched`) y al enviar.
  - **Autocompletado** (formación / experiencia): peticiones debounced al API; si fallan las sugerencias, el usuario puede seguir escribiendo sin bloqueo.
  - **CV**: solo `.pdf` / `.docx`, máximo **5 MB**; mensajes claros si el tipo o tamaño no es válido.
  - **Éxito**: al crear, vuelve al panel y se muestra un aviso de confirmación; la lista de candidatos se refresca.
  - **Errores y reintento**: mensajes para 4xx/401/409; botón *Reintentar envío* ante fallos de red o respuestas **≥ 500** (no se ofrece reintento ante errores de validación del cliente para no reenviar lo mismo sin cambios).
  - **Autenticación**: cabecera `Authorization: Bearer …` mediante `frontend/src/config.ts` (token por variable `REACT_APP_RECRUITER_API_TOKEN` o valor de desarrollo documentado en el doc de calidad).

## API (backend)

- **`POST /api/candidates`** (multipart):
  - Middleware de autenticación: solo reclutadores con token válido (`backend/src/middleware/authRecruiter.ts`).
  - **Multer** (`backend/src/middleware/cvUpload.ts`): almacenamiento en disco bajo `uploads/cvs/` (ruta base configurable con `UPLOADS_DIR`), nombre de fichero con **UUID** + extensión permitida, límite de tamaño.
  - **Validación servidor**: esquema **Zod** en `backend/src/schemas/candidateSchema.ts`.
  - **Sanitización** antes de persistir: `backend/src/lib/sanitize.ts` (recorte, eliminación de caracteres peligrosos, normalización de email; nombres permiten apóstrofe).
  - **Cifrado opcional en reposo** (nombre, apellidos, teléfono, dirección): `backend/src/lib/atRestCrypto.ts` si existe `CANDIDATE_ENCRYPTION_KEY` (64 hex). El **email** se guarda en claro para mantener unicidad e índices.
  - En base de datos solo se guarda la **ruta relativa** del CV (`cvs/<archivo>`), no el binario.

## Rutas relacionadas (sugerencias)

- `GET /api/candidates/suggestions/education?q=…`
- `GET /api/candidates/suggestions/experience?q=…`

Ante error de base de datos devuelven lista vacía para no bloquear el formulario (degradación controlada).

## Modelo de datos

- Tabla **`Candidate`** en Prisma (`backend/prisma/schema.prisma`), migración en `backend/prisma/migrations/`.

## Criterios de aceptación cubiertos (resumen)

- Acceso visible desde el panel, formulario completo, validación cliente y servidor, subida PDF/DOCX, confirmación, errores con reintento donde aplica, UI responsive y accesibilidad básica (etiquetas, `aria-live`, enlace *saltar al contenido*).
