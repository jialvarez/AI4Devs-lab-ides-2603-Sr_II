# Briefing del ejercicio · NAR

Este repositorio responde al laboratorio **LTI — Talent Tracking System**: implementar, de extremo a extremo, lo descrito en los dos documentos de requisitos que siguen.

---

## Alcance pedagógico

La consigna se articula en **dos historias de usuario complementarias**:

1. **[Alta de candidato](./prompts/add_candidate_instructions_v1.md)** — formulario para el reclutador, validación, subida de CV (PDF/DOCX), confirmación y manejo de errores con las salvaguardas técnicas indicadas.

2. **[Listado de candidatos y CV](./prompts/list_candidates_instructions_v1.md)** — vista central con los datos esenciales, descarga segura del CV desde almacenamiento local, estados vacío y de error, y las mismas exigencias de acceso y seguridad sobre ficheros.

En conjunto cubren el flujo típico de un ATS ligero: **capturar** talento y **revisarlo** después.

---

## Qué se entiende por “implementar lo dicho”

No se trata solo de “hacer que compile”, sino de **alinear** interfaz, API, persistencia, validación, subidas y descargas con los criterios de aceptación y las restricciones de cada prompt (incluidas privacidad, rutas seguras y pruebas razonables).

Para la corrección o la defensa oral, la narrativa técnica detallada —rutas, decisiones de seguridad, capas de validación y suites de tests— está recogida en **[`docs/README.md`](./docs/README.md)** y los enlaces que parten de ahí.

---

## Entrega

- Código en `frontend/` y `backend/`.
- Documentación de producto y calidad en **`docs/`**.
- Demostración visual referenciada desde el **[`README.md`](./README.md)** principal del repo.

Si algo del enunciado no quedó explícito en los prompts, la implementación prioriza **claridad para el reclutador**, **trazabilidad en el código** y **mensajes de error comprensibles** —criterios que suelen valorarse en una entrega de este tipo.

*Buena corrección.*
