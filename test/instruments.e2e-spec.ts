import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { CommonModule } from '../src/common/common.module.js';
import { InstrumentsController } from '../src/instruments/controllers/instruments.controller.js';
import { INSTRUMENTS_REPOSITORY } from '../src/core/repositories/instruments.repository.js';
import { InstrumentsService } from '../src/instruments/services/instruments.service.js';

describe('Instruments (e2e)', () => {
  let app: INestApplication<App>;
  const repository = { search: vi.fn() };

  beforeEach(async () => {
    vi.stubEnv('DATABASE_URI', 'postgresql://user:pass@localhost:5432/db');
    repository.search.mockReset();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CommonModule],
      controllers: [InstrumentsController],
      providers: [
        InstrumentsService,
        { provide: INSTRUMENTS_REPOSITORY, useValue: repository },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    vi.unstubAllEnvs();
  });

  it('GET /instruments?q=gal devuelve los instrumentos sin campos de más', async () => {
    repository.search.mockResolvedValue([
      {
        id: 1,
        ticker: 'GGAL',
        name: 'Grupo Financiero Galicia',
        type: 'ACCIONES',
        internalField: 'no debe viajar',
      },
    ]);

    const response = await request(app.getHttpServer())
      .get('/instruments')
      .query({ q: ' gal ' })
      .expect(200);

    expect(response.body).toEqual([
      {
        id: 1,
        ticker: 'GGAL',
        name: 'Grupo Financiero Galicia',
        type: 'ACCIONES',
      },
    ]);
    expect(repository.search).toHaveBeenCalledWith('gal');
  });

  it('GET /instruments sin q responde 400', async () => {
    const response = await request(app.getHttpServer())
      .get('/instruments')
      .expect(400);

    expect(response.body).toEqual({
      error: 'VALIDATION_FAILED',
      details: expect.arrayContaining([{ field: 'q', code: 'IS_NOT_EMPTY' }]),
    });
    expect(repository.search).not.toHaveBeenCalled();
  });

  it('GET /instruments con parámetros desconocidos responde 400', async () => {
    const response = await request(app.getHttpServer())
      .get('/instruments')
      .query({ q: 'gal', extra: 'x' })
      .expect(400);

    expect(response.body).toEqual({
      error: 'VALIDATION_FAILED',
      details: [{ field: 'extra', code: 'NOT_ALLOWED' }],
    });
  });
});
