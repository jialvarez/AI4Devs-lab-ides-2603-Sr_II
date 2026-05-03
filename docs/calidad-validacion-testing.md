# Calidad, validación y testing

Este documento resume cómo se asegura la calidad de las dos features (alta y listado/descarga de candidatos): **validación por capas**, **seguridad**, **pruebas automatizadas** y **comprobaciones manuales** recomendadas.

## Validación por capas

| Capa | Alta de candidato | Listado / CV |
|------|-------------------|--------------|
| **Cliente** | Reglas en `candidateForm.ts` (obligatorios, email, teléfono); validación de fichero (extensión y 5 MB). | Estados de carga y error; interpretación de `cv.status` sin asumir enlace si no es `ready`. |
| **Servidor** | Zod (`candidateSchema.ts`) + sanitización (`sanitize.ts`) antes de Prisma. | `id` numérico en descarga; rutas CV validadas en `cvPath.ts`; existencia en disco comprobada para listado y descarga. |
| **Persistencia** | Prisma + restricción única en `email`; rutas relativas al CV. | Lectura coherente con lo almacenado; descarga solo tras comprobaciones. |

La **doble validación** (cliente + servidor) evita depender solo del navegador y mantiene integridad ante clientes alterados.

## Seguridad (resumen)

- **Autenticación**: todas las rutas bajo `/api/candidates` exigen `Authorization: Bearer` coincidente con `RECRUITER_API_TOKEN` (en desarrollo sin variable se usa un token por defecto documentado abajo).
- **Helmet** y **CORS** configurables (`FRONTEND_ORIGIN`) en `backend/src/app.ts`.
- **XSS / inyección**: sanitización de texto; Prisma usa parámetros enlazados (mitiga inyección SQL).
- **CV en disco**: nombres UUID; rutas servidas solo tras validación estricta; no se expone la ruta absoluta al cliente.
- **HTTPS**: en producción debe terminarse TLS delante del API (el código envía cabeceras adecuadas para no cachear listas/descargas en proxies públicos de forma ingenua).
- **Cifrado opcional**: `CANDIDATE_ENCRYPTION_KEY` (64 caracteres hex) para campos PII seleccionados en alta; el listado descifra nombres cuando aplica.

## Variables de entorno relevantes

| Variable | Uso |
|----------|-----|
| `RECRUITER_API_TOKEN` | Token esperado en `Authorization: Bearer` (obligatorio en producción en el middleware). |
| `REACT_APP_RECRUITER_API_TOKEN` | Mismo valor en el frontend para las peticiones (producción). |
| `REACT_APP_API_URL` | Base URL del API si el frontend no se sirve con proxy al mismo origen. |
| `UPLOADS_DIR` | Directorio raíz de subidas (por defecto `uploads` bajo el cwd del backend). |
| `CANDIDATE_ENCRYPTION_KEY` | Opcional; 64 hex → AES-256-GCM para ciertos campos en alta. |
| `FRONTEND_ORIGIN` | Orígenes CORS permitidos (coma-separados). |

En desarrollo, si no se define `RECRUITER_API_TOKEN` / `REACT_APP_RECRUITER_API_TOKEN`, se usa el mismo valor por defecto solo para facilitar el laboratorio (no usar en producción sin sustituir).

## Testing automatizado

### Backend (`backend/`)

- Comando: `npm test` (Jest + Supertest).
- Archivos principales: `backend/src/tests/app.test.ts`, `backend/src/tests/cvPath.test.ts`.
- Cobertura aproximada:
  - Salud del servidor `GET /`.
  - `POST /api/candidates` con y sin token.
  - `GET /api/candidates` con token y cuerpo JSON esperado.
  - `GET /api/candidates/:id/cv` cuando no existe el candidato (404 + código).
  - Pruebas unitarias de **rutas CV inseguras** rechazadas por `resolveSafeCvAbsolutePath`.
- Los tests de API usan **`createApp` con Prisma mockeado** para no depender de una base real en CI.

### Frontend (`frontend/`)

- Comando: `CI=true npm test` (script en `package.json` con `react-scripts test --watchAll=false`).
- Archivo: `frontend/src/tests/App.test.tsx`.
- Se **mockea `fetch`** para aislar la UI del backend.
- Casos: panel y navegación al formulario, lista vacía tras “carga”, tabla con filas cuando el JSON incluye candidatos.

### Compilación

- Backend: `npm run build` (`tsc`).
- Frontend: `npm run build` (bundle de producción).

## Comprobaciones manuales recomendadas

1. **Alta**: enviar formulario válido con y sin CV; comprobar mensaje de éxito y fila nueva en la lista.
2. **Validación**: email inválido y teléfono fuera de patrón deben bloquear en cliente y, si se fuerza el API, responder 400 con detalles Zod.
3. **CV ausente**: registrar candidato con CV, borrar manualmente el fichero en `uploads/cvs/` y verificar texto *Archivo no encontrado* en la lista y 404 JSON al intentar descargar.
4. **401**: llamar al API sin `Authorization` y comprobar que el listado muestra el bloque de sesión no válida.
5. **Orden**: crear dos candidatos y verificar que el más reciente aparece primero.

## Mejoras futuras posibles

- Login con sesión/cookies en lugar de token estático en el cliente.
- Paginación y búsqueda en el listado.
- Rate limiting en rutas de listado/descarga.
- Auditoría de descargas de CV.
