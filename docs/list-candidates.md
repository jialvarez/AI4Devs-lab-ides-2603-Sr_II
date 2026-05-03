# Feature: Listado de candidatos y CV

## Objetivo

Mostrar al reclutador todos los candidatos del sistema con **nombre completo**, **email** y **fecha de alta**, y permitir **descargar el CV** cuando exista en almacenamiento local, con estados claros si no hay datos o falta el fichero.

## Interfaz (frontend)

- **Sección “Candidatos”** en el panel (`frontend/src/components/CandidateList.tsx`), debajo de las acciones rápidas.
- **Estados**:
  - **Cargando**: mensaje mientras se obtiene la lista.
  - **Error al listar**: mensaje descriptivo y botón *Reintentar*.
  - **401 / no autorizado**: bloque explicativo (en producción iría a login; aquí se indica configuración del token).
  - **Lista vacía**: mensaje amable y acceso directo a *Añadir candidato*.
  - **Tabla**: columnas nombre, email (enlace `mailto:`), fecha formateada (`es`), CV.
- **CV en tabla**:
  - *Sin CV*: texto neutro.
  - *Archivo no encontrado*: cuando el API indica que en BD hay CV pero el fichero no está en disco (mensaje explícito, sin enlace roto).
  - *Descargar CV*: botón que llama a `downloadCandidateCv` en `frontend/src/api/candidateCv.ts` ( **`fetch` con Bearer** + blob + descarga con nombre sugerido por cabeceras), necesario porque un `<a href>` no envía el token.

## API (backend)

### Listado

- **`GET /api/candidates`**
  - Misma autenticación Bearer que el resto del recurso.
  - Orden: **`createdAt` descendente** (más recientes primero).
  - Por cada fila se comprueba en disco si el `cvFilePath` de BD es válido y existe; la respuesta incluye `cv.status`: `none` | `ready` | `missing`.
  - Nombres mostrados: se intenta **descifrar** `firstName` / `lastName` con `openAtRest`; si no es posible, texto sustituto.
  - Cabeceras: `Cache-Control: private, no-store`, `X-Robots-Tag: noindex, nofollow` (reduce caché pública y señal a robots; el control de acceso real es el token).

### Descarga segura

- **`GET /api/candidates/:id/cv`**
  - Resuelve el fichero solo mediante **`resolveSafeCvAbsolutePath`** (`backend/src/lib/cvPath.ts`):
    - Acepta únicamente rutas relativas del tipo `cvs/<nombre>.pdf|docx`.
    - Comprueba que la ruta absoluta quede **bajo el directorio de CVs** (mitiga path traversal).
  - Si no hay candidato, no hay CV en BD, ruta inválida o **fichero ausente en disco** → **404** con JSON y códigos (`NOT_FOUND`, `NO_CV`, `CV_FILE_NOT_FOUND`, etc.), sin exponer rutas absolutas del servidor.
  - Si existe: **stream** con `Content-Type` PDF o DOCX y `Content-Disposition: attachment`.

## Diseño responsive

- Tabla con scroll horizontal en pantallas estrechas; en anchos reducidos las filas se apilan usando `data-label` en celdas (`frontend/src/App.css`).

## Criterios de aceptación cubiertos (resumen)

- Vista central de lista, datos clave visibles, acceso a CV solo cuando está disponible, estado vacío con atajo a alta, manejo de fichero faltante sin crash, listado y descarga restringidos a reclutador autenticado, comprobación de existencia de fichero antes de ofrecer descarga.
