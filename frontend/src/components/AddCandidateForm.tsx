import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL, recruiterAuthHeader } from '../config';
import { CandidateFormState, validateCandidateForm } from '../validation/candidateForm';

type Props = {
  onCancel: () => void;
  onSuccess: () => void;
};

const initial: CandidateFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  education: '',
  workExperience: '',
};

function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export function AddCandidateForm({ onCancel, onSuccess }: Props): JSX.Element {
  const [values, setValues] = useState<CandidateFormState>(initial);
  const [touched, setTouched] = useState<Partial<Record<keyof CandidateFormState, boolean>>>({});
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [eduSuggestions, setEduSuggestions] = useState<string[]>([]);
  const [expSuggestions, setExpSuggestions] = useState<string[]>([]);
  const lastPayloadRef = useRef<FormData | null>(null);
  const debounceEdu = useRef<number>();
  const debounceExp = useRef<number>();

  const errors = useMemo(() => validateCandidateForm(values), [values]);
  const showErrors = useCallback(
    (field: keyof CandidateFormState) => touched[field] && !!errors[field],
    [errors, touched],
  );

  const fetchSuggestions = useCallback(
    async (field: 'education' | 'workExperience', q: string) => {
      if (q.length < 2) {
        if (field === 'education') setEduSuggestions([]);
        else setExpSuggestions([]);
        return;
      }
      const path =
        field === 'education'
          ? `/api/candidates/suggestions/education?q=${encodeURIComponent(q)}`
          : `/api/candidates/suggestions/experience?q=${encodeURIComponent(q)}`;
      try {
        const res = await fetch(apiUrl(path), { headers: { ...recruiterAuthHeader() } });
        if (!res.ok) {
          if (field === 'education') setEduSuggestions([]);
          else setExpSuggestions([]);
          return;
        }
        const data = (await res.json()) as { suggestions?: string[] };
        const list = Array.isArray(data.suggestions) ? data.suggestions : [];
        if (field === 'education') setEduSuggestions(list);
        else setExpSuggestions(list);
      } catch {
        if (field === 'education') setEduSuggestions([]);
        else setExpSuggestions([]);
      }
    },
    [],
  );

  useEffect(() => {
    window.clearTimeout(debounceEdu.current);
    debounceEdu.current = window.setTimeout(() => {
      void fetchSuggestions('education', values.education);
    }, 320);
    return () => window.clearTimeout(debounceEdu.current);
  }, [values.education, fetchSuggestions]);

  useEffect(() => {
    window.clearTimeout(debounceExp.current);
    debounceExp.current = window.setTimeout(() => {
      void fetchSuggestions('workExperience', values.workExperience);
    }, 320);
    return () => window.clearTimeout(debounceExp.current);
  }, [values.workExperience, fetchSuggestions]);

  const onFileChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const f = ev.target.files?.[0];
    if (!f) {
      setFile(null);
      return;
    }
    const name = f.name.toLowerCase();
    const okExt = name.endsWith('.pdf') || name.endsWith('.docx');
    const okSize = f.size <= 5 * 1024 * 1024;
    if (!okExt) {
      setFile(null);
      setFileError('Solo se admiten archivos PDF o DOCX.');
      return;
    }
    if (!okSize) {
      setFile(null);
      setFileError('El archivo no puede superar 5MB.');
      return;
    }
    setFile(f);
  };

  const buildFormData = (): FormData => {
    const fd = new FormData();
    fd.append('firstName', values.firstName.trim());
    fd.append('lastName', values.lastName.trim());
    fd.append('email', values.email.trim());
    fd.append('phone', values.phone.trim());
    fd.append('address', values.address.trim());
    fd.append('education', values.education.trim());
    fd.append('workExperience', values.workExperience.trim());
    if (file) fd.append('cv', file);
    return fd;
  };

  const submitWithPayload = async (fd: FormData) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(apiUrl('/api/candidates'), {
        method: 'POST',
        headers: { ...recruiterAuthHeader() },
        body: fd,
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        details?: Record<string, string[]>;
      };
      if (res.status === 201 && body.message) {
        setValues(initial);
        setFile(null);
        setTouched({});
        lastPayloadRef.current = null;
        onSuccess();
        return;
      }
      lastPayloadRef.current = null;
      if (res.status === 400 && body.details) {
        const first = Object.values(body.details).flat()[0];
        setSubmitError(first || body.error || 'Revisa los datos del formulario.');
        return;
      }
      if (res.status === 409) {
        setSubmitError(body.error || 'El email ya está en uso.');
        return;
      }
      if (res.status === 401) {
        setSubmitError(body.error || 'No autorizado. Comprueba el token de reclutador.');
        return;
      }
      if (res.status >= 500) {
        lastPayloadRef.current = fd;
        setSubmitError(
          body.error || 'Error del servidor. Puedes reintentar cuando la conexión mejore.',
        );
        return;
      }
      setSubmitError(body.error || `Error (${res.status}). Reintenta o revisa los datos.`);
    } catch {
      lastPayloadRef.current = fd;
      setSubmitError('No hay conexión con el servidor. Comprueba la red y reintenta.');
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      address: true,
      education: true,
      workExperience: true,
    });
    const v = validateCandidateForm(values);
    if (Object.keys(v).length > 0) return;
    const fd = buildFormData();
    await submitWithPayload(fd);
  };

  const onRetry = () => {
    const fd = lastPayloadRef.current;
    if (fd) void submitWithPayload(fd);
  };

  const datalistIdEdu = 'edu-suggestions';

  return (
    <main className="form-shell" aria-labelledby="add-candidate-title">
      <h1 id="add-candidate-title">Añadir candidato</h1>
      <p className="lede">
        Completa los datos del candidato. Los campos marcados son obligatorios. El CV es opcional
        (PDF o DOCX, máx. 5MB).
      </p>

      <form className="candidate-form" onSubmit={onSubmit} noValidate>
        <div className="field-grid">
          <label className="field">
            <span>Nombre</span>
            <input
              name="firstName"
              autoComplete="given-name"
              value={values.firstName}
              onChange={(e) => setValues((s) => ({ ...s, firstName: e.target.value }))}
              onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
              aria-invalid={showErrors('firstName')}
              aria-describedby={showErrors('firstName') ? 'err-firstName' : undefined}
            />
            {showErrors('firstName') && (
              <span className="field-error" id="err-firstName" role="alert">
                {errors.firstName}
              </span>
            )}
          </label>
          <label className="field">
            <span>Apellidos</span>
            <input
              name="lastName"
              autoComplete="family-name"
              value={values.lastName}
              onChange={(e) => setValues((s) => ({ ...s, lastName: e.target.value }))}
              onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
              aria-invalid={showErrors('lastName')}
              aria-describedby={showErrors('lastName') ? 'err-lastName' : undefined}
            />
            {showErrors('lastName') && (
              <span className="field-error" id="err-lastName" role="alert">
                {errors.lastName}
              </span>
            )}
          </label>
          <label className="field field-span-2">
            <span>Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={values.email}
              onChange={(e) => setValues((s) => ({ ...s, email: e.target.value }))}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              aria-invalid={showErrors('email')}
              aria-describedby={showErrors('email') ? 'err-email' : undefined}
            />
            {showErrors('email') && (
              <span className="field-error" id="err-email" role="alert">
                {errors.email}
              </span>
            )}
          </label>
          <label className="field field-span-2">
            <span>Teléfono</span>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              value={values.phone}
              onChange={(e) => setValues((s) => ({ ...s, phone: e.target.value }))}
              onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
              aria-invalid={showErrors('phone')}
              aria-describedby={showErrors('phone') ? 'err-phone' : undefined}
            />
            {showErrors('phone') && (
              <span className="field-error" id="err-phone" role="alert">
                {errors.phone}
              </span>
            )}
          </label>
          <label className="field field-span-2">
            <span>Dirección</span>
            <textarea
              name="address"
              autoComplete="street-address"
              rows={2}
              value={values.address}
              onChange={(e) => setValues((s) => ({ ...s, address: e.target.value }))}
              onBlur={() => setTouched((t) => ({ ...t, address: true }))}
              aria-invalid={showErrors('address')}
              aria-describedby={showErrors('address') ? 'err-address' : undefined}
            />
            {showErrors('address') && (
              <span className="field-error" id="err-address" role="alert">
                {errors.address}
              </span>
            )}
          </label>
          <label className="field field-span-2">
            <span>Formación</span>
            <input
              name="education"
              list={datalistIdEdu}
              value={values.education}
              onChange={(e) => setValues((s) => ({ ...s, education: e.target.value }))}
              onBlur={() => setTouched((t) => ({ ...t, education: true }))}
              aria-invalid={showErrors('education')}
              aria-describedby={showErrors('education') ? 'err-education' : undefined}
            />
            <datalist id={datalistIdEdu}>
              {eduSuggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            {showErrors('education') && (
              <span className="field-error" id="err-education" role="alert">
                {errors.education}
              </span>
            )}
          </label>
          <label className="field field-span-2">
            <span>Experiencia laboral</span>
            {expSuggestions.length > 0 && (
              <div className="suggestion-chips" role="listbox" aria-label="Sugerencias de experiencia">
                {expSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="chip"
                    onClick={() => setValues((v) => ({ ...v, workExperience: s }))}
                  >
                    {s.length > 80 ? `${s.slice(0, 80)}…` : s}
                  </button>
                ))}
              </div>
            )}
            <textarea
              name="workExperience"
              rows={4}
              value={values.workExperience}
              onChange={(e) => setValues((s) => ({ ...s, workExperience: e.target.value }))}
              onBlur={() => setTouched((t) => ({ ...t, workExperience: true }))}
              aria-invalid={showErrors('workExperience')}
              aria-describedby={showErrors('workExperience') ? 'err-workExperience' : undefined}
            />
            {showErrors('workExperience') && (
              <span className="field-error" id="err-workExperience" role="alert">
                {errors.workExperience}
              </span>
            )}
          </label>
          <label className="field field-span-2">
            <span>CV (PDF o DOCX)</span>
            <input
              name="cv"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={onFileChange}
            />
            {fileError && (
              <span className="field-error" role="alert">
                {fileError}
              </span>
            )}
            {file && <span className="file-name">{file.name}</span>}
          </label>
        </div>

        {submitError && (
          <div className="banner banner-error" role="alert" aria-live="polite">
            <p>{submitError}</p>
            {lastPayloadRef.current && (
              <button type="button" className="btn secondary" onClick={onRetry}>
                Reintentar envío
              </button>
            )}
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn secondary" onClick={onCancel}>
            Volver al panel
          </button>
          <button type="submit" className="btn primary" disabled={submitting}>
            {submitting ? 'Guardando…' : 'Guardar candidato'}
          </button>
        </div>
      </form>
    </main>
  );
}
