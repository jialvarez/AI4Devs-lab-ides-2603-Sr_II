import React, { useEffect, useState } from 'react';
import './App.css';
import { AddCandidateForm } from './components/AddCandidateForm';
import { CandidateList } from './components/CandidateList';

type View = 'dashboard' | 'add';

function App(): JSX.Element {
  const [view, setView] = useState<View>('dashboard');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [listRefreshKey, setListRefreshKey] = useState(0);

  useEffect(() => {
    if (!successMessage) return;
    const t = window.setTimeout(() => setSuccessMessage(null), 8000);
    return () => window.clearTimeout(t);
  }, [successMessage]);

  return (
    <div className="app-root">
      <a href="#main-content" className="skip-link">
        Ir al contenido principal
      </a>
      {view === 'dashboard' && (
        <div id="main-content" className="dashboard dashboard-wide">
          <header className="dashboard-header">
            <h1>Panel del reclutador</h1>
            <p className="subtitle">
              Gestiona candidatos y procesos de selección desde un único lugar.
            </p>
          </header>
          {successMessage && (
            <div className="banner banner-success" role="status" aria-live="polite">
              {successMessage}
            </div>
          )}
          <section className="dashboard-actions" aria-labelledby="quick-actions-title">
            <h2 id="quick-actions-title" className="visually-hidden">
              Acciones rápidas
            </h2>
            <button
              type="button"
              className="btn primary btn-large"
              onClick={() => {
                setSuccessMessage(null);
                setView('add');
              }}
            >
              Añadir nuevo candidato
            </button>
          </section>
          <CandidateList
            refreshKey={listRefreshKey}
            onAddCandidate={() => {
              setSuccessMessage(null);
              setView('add');
            }}
          />
        </div>
      )}
      {view === 'add' && (
        <div id="main-content">
          <AddCandidateForm
            onCancel={() => setView('dashboard')}
            onSuccess={() => {
              setSuccessMessage('El candidato se ha añadido correctamente al sistema.');
              setListRefreshKey((k) => k + 1);
              setView('dashboard');
            }}
          />
        </div>
      )}
    </div>
  );
}

export default App;
