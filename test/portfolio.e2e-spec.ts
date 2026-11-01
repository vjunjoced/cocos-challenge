import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { CommonModule } from '../src/common/common.module.js';
import { INSTRUMENTS_REPOSITORY } from '../src/core/repositories/instruments.repository.js';
import { MARKET_DATA_REPOSITORY } from '../src/core/repositories/market-data.repository.js';
import { ORDERS_REPOSITORY } from '../src/core/repositories/orders.repository.js';
import { USERS_REPOSITORY } from '../src/core/repositories/users.repository.js';
import { PortfolioController } from '../src/portfolio/controllers/portfolio.controller.js';
import { PortfolioService } from '../src/portfolio/services/portfolio.service.js';

describe('Portfolio (e2e)', () => {
  let app: INestApplication<App>;
  const users = { exists: vi.fn() };
  const orders = { findFilledByUser: vi.fn() };
  const marketData = { findLatestPrices: vi.fn() };
  const instruments = { findByIds: vi.fn() };

  const order = (
    side: string,
    instrumentId: number,
    size: number,
    price: number,
  ) => ({
    id: 1,
    instrumentId,
    userId: 1,
    size,
    price,
    type: 'MARKET',
    side,
    status: 'FILLED',
    datetime: new Date('2023-07-12T12:00:00'),
  });

  beforeEach(async () => {
    vi.stubEnv('DATABASE_URI', 'postgresql://user:pass@localhost:5432/db');
    users.exists.mockReset().mockResolvedValue(true);
    orders.findFilledByUser.mockReset().mockResolvedValue([]);
    marketData.findLatestPrices.mockReset().mockResolvedValue([]);
    instruments.findByIds.mockReset().mockResolvedValue([]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CommonModule],
      controllers: [PortfolioController],
      providers: [
        PortfolioService,
        { provide: USERS_REPOSITORY, useValue: users },
        { provide: ORDERS_REPOSITORY, useValue: orders },
        { provide: MARKET_DATA_REPOSITORY, useValue: marketData },
        { provide: INSTRUMENTS_REPOSITORY, useValue: instruments },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    vi.unstubAllEnvs();
  });

  it('GET /portfolio/1 devuelve total, pesos disponibles y posiciones', async () => {
    orders.findFilledByUser.mockResolvedValue([
      order('CASH_IN', 66, 1000, 1),
      order('BUY', 47, 5, 100),
    ]);
    marketData.findLatestPrices.mockResolvedValue([
      { instrumentId: 47, close: 120, previousClose: 120 },
    ]);
    instruments.findByIds.mockResolvedValue([
      { id: 47, ticker: 'PAMP', name: 'Pampa Holding', type: 'ACCIONES' },
    ]);

    const response = await request(app.getHttpServer())
      .get('/portfolio/1')
      .expect(200);

    expect(response.body).toEqual({
      totalValue: 1100,
      availableCash: 500,
      positions: [
        {
          instrumentId: 47,
          ticker: 'PAMP',
          name: 'Pampa Holding',
          quantity: 5,
          marketValue: 600,
          totalReturnPercentage: 20,
          dailyReturnPercentage: 0,
        },
      ],
    });
    expect(users.exists).toHaveBeenCalledWith(1);
  });

  it('GET /portfolio/1 de un usuario sin órdenes responde todo vacío', async () => {
    const response = await request(app.getHttpServer())
      .get('/portfolio/1')
      .expect(200);

    expect(response.body).toEqual({
      totalValue: 0,
      availableCash: 0,
      positions: [],
    });
  });

  it('GET /portfolio/:userId de un usuario inexistente responde 404', async () => {
    users.exists.mockResolvedValue(false);

    const response = await request(app.getHttpServer())
      .get('/portfolio/999')
      .expect(404);

    expect(response.body).toEqual({ error: 'USER_NOT_FOUND' });
    expect(orders.findFilledByUser).not.toHaveBeenCalled();
  });

  it.each(['abc', '0', '-1', '1.5'])(
    'GET /portfolio/%s con un id inválido responde 400',
    async (userId) => {
      await request(app.getHttpServer())
        .get(`/portfolio/${userId}`)
        .expect(400);
      expect(users.exists).not.toHaveBeenCalled();
    },
  );
});
