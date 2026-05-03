import request from 'supertest';
import type { PrismaClient } from '@prisma/client';
import { createApp } from '../app';

const devToken = 'dev-lti-recruiter-token';

function buildMockPrisma(): PrismaClient {
  return {
    candidate: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 1 }),
    },
  } as unknown as PrismaClient;
}

describe('API ATS', () => {
  const mockPrisma = buildMockPrisma();
  const app = createApp(mockPrisma);

  it('GET / responde saludo', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Hola LTI!');
  });

  it('POST /api/candidates sin token responde 401', async () => {
    const response = await request(app).post('/api/candidates').send({});
    expect(response.status).toBe(401);
  });

  it('GET /api/candidates sin token responde 401', async () => {
    const response = await request(app).get('/api/candidates');
    expect(response.status).toBe(401);
  });

  it('GET /api/candidates con token devuelve lista', async () => {
    (mockPrisma.candidate.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: 1,
        firstName: 'Ana',
        lastName: 'Ruiz',
        email: 'ana@example.com',
        createdAt: new Date('2026-01-02T12:00:00.000Z'),
        cvFilePath: null,
      },
    ]);
    const response = await request(app)
      .get('/api/candidates')
      .set('Authorization', `Bearer ${devToken}`);
    expect(response.status).toBe(200);
    expect(response.body.candidates).toHaveLength(1);
    expect(response.body.candidates[0].fullName).toBe('Ana Ruiz');
    expect(response.body.candidates[0].cv.status).toBe('none');
  });

  it('GET /api/candidates/:id/cv sin candidato responde 404 JSON', async () => {
    (mockPrisma.candidate.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const response = await request(app)
      .get('/api/candidates/999/cv')
      .set('Authorization', `Bearer ${devToken}`);
    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });

  it('POST /api/candidates con token y datos válidos responde 201', async () => {
    (mockPrisma.candidate.create as jest.Mock).mockResolvedValueOnce({ id: 99 });
    const response = await request(app)
      .post('/api/candidates')
      .set('Authorization', `Bearer ${devToken}`)
      .field('firstName', 'Ana')
      .field('lastName', 'López')
      .field('email', 'ana.lopez@example.com')
      .field('phone', '+34 600 111 222')
      .field('address', 'Calle Mayor 1, Madrid')
      .field('education', 'Grado en ADE')
      .field('workExperience', '2 años como analista');
    expect(response.status).toBe(201);
    expect(response.body.message).toMatch(/correctamente/);
    expect(mockPrisma.candidate.create).toHaveBeenCalled();
  });
});
