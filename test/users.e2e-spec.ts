import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { CommonModule } from '../src/common/common.module.js';
import type { NewUser } from '../src/core/models/user.model.js';
import type { Position } from '../src/core/models/position.model.js';
import { USERS_REPOSITORY } from '../src/core/repositories/users.repository.js';
import { UsersController } from '../src/users/controllers/users.controller.js';
import { UsersService } from '../src/users/services/users.service.js';

describe('Users (e2e)', () => {
  let app: INestApplication<App>;
  const created: { user: NewUser; positions: Position[] }[] = [];
  const users = {
    exists: vi.fn(),
    createWithPositions: vi.fn((user: NewUser, positions: Position[]) => {
      created.push({ user, positions });
      return Promise.resolve({ id: 5, ...user });
    }),
  };

  beforeEach(async () => {
    vi.stubEnv('DATABASE_URI', 'postgresql://user:pass@localhost:5432/db');
    created.length = 0;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CommonModule],
      controllers: [UsersController],
      providers: [UsersService, { provide: USERS_REPOSITORY, useValue: users }],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    vi.unstubAllEnvs();
  });

  it('POST /users crea el usuario con su fila de efectivo en cero', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({ email: 'nuevo@cocos.com', accountNumber: '20001' })
      .expect(201);

    expect(response.body).toEqual({
      id: 5,
      email: 'nuevo@cocos.com',
      accountNumber: '20001',
    });
    expect(created).toHaveLength(1);
    expect(created[0]?.positions).toHaveLength(1);
    expect(created[0]?.positions[0]?.instrumentId).toBe(66);
    expect(created[0]?.positions[0]?.quantity.toNumber()).toBe(0);
  });

  it('POST /users responde 400 con detalles por campo ante un body inválido', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({ email: 'no-es-email', accountNumber: '' })
      .expect(400);

    expect(response.body.error).toBe('VALIDATION_FAILED');
    expect(response.body.details).toEqual(
      expect.arrayContaining([{ field: 'email', code: 'IS_EMAIL' }]),
    );
    expect(created).toHaveLength(0);
  });

  it('POST /users rechaza campos no declarados, como un id enviado por el cliente', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({ id: 99, email: 'a@b.com', accountNumber: '1' })
      .expect(400);

    expect(response.body.details).toEqual([
      { field: 'id', code: 'NOT_ALLOWED' },
    ]);
  });
});
