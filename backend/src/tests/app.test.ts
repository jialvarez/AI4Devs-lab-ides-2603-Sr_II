import request from 'supertest';
import type { PrismaClient } from '@prisma/client';
import { createApp } from '../app';

const devToken = 'dev-lti-recruiter-token';

function buildMockPrisma(): PrismaClient {
  return {
    candidate: {
      findMany: jest.fn().mockResolvedValue([{ education: 'Grado en Informática' }]),
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
