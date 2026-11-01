import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { setupApp } from '../src/app.setup.js';
import { CommonModule } from '../src/common/common.module.js';

@Controller('probe')
class ProbeController {
  @Get()
  small() {
    return { ok: true };
  }

  @Get('large')
  large() {
    return { data: 'x'.repeat(5000) };
  }
}

describe('Security middleware (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    vi.stubEnv('DATABASE_URI', 'postgresql://user:pass@localhost:5432/db');
    vi.stubEnv('RATE_LIMIT_MAX_REQUESTS', '3');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CommonModule],
      controllers: [ProbeController],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    vi.unstubAllEnvs();
  });

  it('agrega cabeceras de seguridad y oculta x-powered-by', async () => {
    const response = await request(app.getHttpServer())
      .get('/probe')
      .expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('comprime las respuestas grandes cuando el cliente lo acepta', async () => {
    const response = await request(app.getHttpServer())
      .get('/probe/large')
      .set('Accept-Encoding', 'gzip')
      .expect(200);

    expect(response.headers['content-encoding']).toBe('gzip');
  });

  it('responde 429 al superar el límite de peticiones', async () => {
    const server = app.getHttpServer();

    await request(server).get('/probe').expect(200);
    await request(server).get('/probe').expect(200);
    await request(server).get('/probe').expect(200);
    await request(server).get('/probe').expect(429);
  });

  it('no limita el health check', async () => {
    const server = app.getHttpServer();

    for (let i = 0; i < 5; i++) {
      await request(server).get('/health').expect(200);
    }
  });
});
