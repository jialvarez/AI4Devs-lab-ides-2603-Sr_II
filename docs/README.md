# Documentación ATS — candidatos

Esta carpeta describe las funcionalidades implementadas para el reclutador (**alta de candidato** y **listado con descarga de CV**) y cómo se asegura la **calidad**, la **validación** y las **pruebas**.

## Contenido

| Documento | Descripción |
|-----------|-------------|
| [add-candidate.md](./add-candidate.md) | Alta de candidato: flujo UI, API, validación, ficheros, seguridad. |
| [list-candidates.md](./list-candidates.md) | Listado, estados vacío/error, descarga segura de CV. |
| [calidad-validacion-testing.md](./calidad-validacion-testing.md) | Estrategia de calidad: capas de validación, seguridad, suites de tests y comprobaciones manuales. |

## Arranque rápido (referencia)

- **Backend**: puerto por defecto `3010`, rutas bajo `/api/candidates`.
- **Frontend**: proxy CRA a `http://localhost:3010` en desarrollo.
- **Base de datos**: Postgres (p. ej. `docker-compose` del repo); migraciones Prisma en `backend/prisma/migrations/`.

Para detalle de variables de entorno y tokens, ver [calidad-validacion-testing.md](./calidad-validacion-testing.md).
