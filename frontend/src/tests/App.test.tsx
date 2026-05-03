import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

const baseListResponse = {
  ok: true,
  status: 200,
  json: async () => ({ candidates: [] }),
  headers: new Headers(),
} as unknown as Response;

describe('App', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(baseListResponse);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  test('muestra el panel y el enlace para añadir candidato', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /panel del reclutador/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /añadir nuevo candidato/i })).toBeInTheDocument();
  });

  test('navega al formulario al pulsar añadir candidato', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /añadir nuevo candidato/i }));
    expect(screen.getByRole('heading', { name: /añadir candidato/i })).toBeInTheDocument();
  });

  test('muestra lista vacía de candidatos tras cargar', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: /^candidatos$/i })).toBeInTheDocument();
    expect(await screen.findByText(/Aún no hay candidatos/i)).toBeInTheDocument();
  });

  test('muestra filas cuando el API devuelve candidatos', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            id: 1,
            fullName: 'Pepe Pérez',
            email: 'pepe@example.com',
            createdAt: '2026-01-01T10:00:00.000Z',
            cv: { status: 'none' },
          },
        ],
      }),
      headers: new Headers(),
    } as unknown as Response);

    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Pepe Pérez')).toBeInTheDocument();
    });
    expect(screen.getByText('pepe@example.com')).toBeInTheDocument();
  });
});
