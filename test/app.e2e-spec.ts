import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { CommonModule } from '../src/common/common.module.js';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    vi.stubEnv('DATABASE_URI', 'postgresql://user:pass@localhost:5432/db');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CommonModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body.uptime).toEqual(expect.any(Number));
  });

  afterEach(async () => {
    await app.close();
    vi.unstubAllEnvs();
  });
});
