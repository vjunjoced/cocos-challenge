import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { CommonModule } from '../src/common/common.module.js';
import { Decimal } from 'decimal.js';
import type { Order } from '../src/core/models/order.model.js';
import type { Position } from '../src/core/models/position.model.js';
import { INSTRUMENTS_REPOSITORY } from '../src/core/repositories/instruments.repository.js';
import { MARKET_DATA_REPOSITORY } from '../src/core/repositories/market-data.repository.js';
import { ORDERS_REPOSITORY } from '../src/core/repositories/orders.repository.js';
import type { IUserOrdersScope } from '../src/core/repositories/user-orders-scope.js';
import { USERS_REPOSITORY } from '../src/core/repositories/users.repository.js';
import { OrdersController } from '../src/orders/controllers/orders.controller.js';
import { OrdersService } from '../src/orders/services/orders.service.js';

describe('Orders (e2e)', () => {
  let app: INestApplication<App>;
  let ledger: Order[];
  let positions: Map<number, Position>;
  const users = { exists: vi.fn() };
  const marketData = { findLatestPrices: vi.fn() };
  const instruments = { findByIds: vi.fn() };

  const orders = {
    withUserLock: (
      _userId: number,
      work: (scope: IUserOrdersScope) => Promise<unknown>,
    ) =>
      work({
        findPosition: (instrumentId) =>
          Promise.resolve(positions.get(instrumentId) ?? null),
        savePosition: (position) => {
          positions.set(position.instrumentId, position);
          return Promise.resolve();
        },
        deletePosition: (instrumentId) => {
          positions.delete(instrumentId);
          return Promise.resolve();
        },
        saveOrder: (order) => {
          const saved = {
            ...order,
            id: ledger.length + 1,
            datetime: new Date('2023-07-12T12:00:00'),
          };
          ledger.push(saved);
          return Promise.resolve(saved);
        },
      }),
  };

  const cashBalance = () => positions.get(66)?.quantity.toNumber();
  const shares = (instrumentId: number) =>
    positions.get(instrumentId)?.quantity.toNumber();

  const cashIn = (amount: number) =>
    request(app.getHttpServer())
      .post('/orders/cash')
      .send({ userId: 1, side: 'CASH_IN', amount });

  const send = (body: object) =>
    request(app.getHttpServer())
      .post('/orders')
      .send({ userId: 1, instrumentId: 47, ...body });

  beforeEach(async () => {
    vi.stubEnv('DATABASE_URI', 'postgresql://user:pass@localhost:5432/db');
    ledger = [];
    positions = new Map<number, Position>([
      [
        66,
        { instrumentId: 66, quantity: new Decimal(0), cost: new Decimal(0) },
      ],
    ]);
    users.exists.mockReset().mockResolvedValue(true);
    marketData.findLatestPrices
      .mockReset()
      .mockResolvedValue([{ instrumentId: 47, close: 100, previousClose: 98 }]);
    instruments.findByIds
      .mockReset()
      .mockResolvedValue([
        { id: 47, ticker: 'PAMP', name: 'Pampa Holding', type: 'ACCIONES' },
      ]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CommonModule],
      controllers: [OrdersController],
      providers: [
        OrdersService,
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

  it('POST /orders/cash agrega saldo y queda FILLED', async () => {
    const response = await cashIn(5_000).expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        instrumentId: 66,
        side: 'CASH_IN',
        type: 'MARKET',
        size: 5_000,
        price: 1,
        status: 'FILLED',
      }),
    );
    expect(cashBalance()).toBe(5_000);
  });

  it('POST /orders/cash rechaza un retiro mayor al saldo y lo registra', async () => {
    await cashIn(100).expect(201);

    const response = await request(app.getHttpServer())
      .post('/orders/cash')
      .send({ userId: 1, side: 'CASH_OUT', amount: 101 })
      .expect(201);

    expect(response.body.status).toBe('REJECTED');
    expect(ledger).toHaveLength(2);
    expect(cashBalance()).toBe(100);
  });

  it('una MARKET de compra con saldo se ejecuta al último close', async () => {
    await cashIn(1_000).expect(201);

    const response = await send({
      side: 'BUY',
      type: 'MARKET',
      size: 5,
    }).expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        side: 'BUY',
        type: 'MARKET',
        size: 5,
        price: 100,
        status: 'FILLED',
      }),
    );
    expect(cashBalance()).toBe(500);
    expect(shares(47)).toBe(5);
  });

  it('una LIMIT queda NEW al precio enviado', async () => {
    await cashIn(1_000).expect(201);

    const response = await send({
      side: 'BUY',
      type: 'LIMIT',
      size: 5,
      price: 90.5,
    }).expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({ type: 'LIMIT', price: 90.5, status: 'NEW' }),
    );
    expect(cashBalance()).toBe(1_000);
    expect(shares(47)).toBeUndefined();
  });

  it('calcula las acciones máximas a partir de un monto en pesos', async () => {
    await cashIn(1_000).expect(201);

    const response = await send({
      side: 'BUY',
      type: 'MARKET',
      amount: 350,
    }).expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({ size: 3, status: 'FILLED' }),
    );
  });

  it('una compra sin saldo se guarda REJECTED', async () => {
    const response = await send({
      side: 'BUY',
      type: 'MARKET',
      size: 5,
    }).expect(201);

    expect(response.body.status).toBe('REJECTED');
    expect(ledger).toHaveLength(1);
  });

  it('una venta de acciones que no se tienen se guarda REJECTED', async () => {
    await cashIn(1_000).expect(201);

    const response = await send({
      side: 'SELL',
      type: 'MARKET',
      size: 1,
    }).expect(201);

    expect(response.body.status).toBe('REJECTED');
  });

  it('permite vender lo comprado y luego rechaza vender de más', async () => {
    await cashIn(1_000).expect(201);
    await send({ side: 'BUY', type: 'MARKET', size: 5 }).expect(201);

    const sold = await send({ side: 'SELL', type: 'MARKET', size: 5 }).expect(
      201,
    );
    const oversold = await send({
      side: 'SELL',
      type: 'MARKET',
      size: 1,
    }).expect(201);

    expect(sold.body.status).toBe('FILLED');
    expect(oversold.body.status).toBe('REJECTED');
    expect(shares(47)).toBeUndefined();
    expect(cashBalance()).toBe(1_000);
  });

  it('el saldo gastado en una compra ya no está disponible para la siguiente', async () => {
    await cashIn(500).expect(201);

    const first = await send({ side: 'BUY', type: 'MARKET', size: 5 }).expect(
      201,
    );
    const second = await send({ side: 'BUY', type: 'MARKET', size: 1 }).expect(
      201,
    );

    expect(first.body.status).toBe('FILLED');
    expect(second.body.status).toBe('REJECTED');
  });

  it('responde 404 USER_NOT_FOUND si el usuario no existe', async () => {
    users.exists.mockResolvedValue(false);

    const response = await send({
      side: 'BUY',
      type: 'MARKET',
      size: 1,
    }).expect(404);

    expect(response.body).toEqual({ error: 'USER_NOT_FOUND' });
    expect(ledger).toHaveLength(0);
  });

  it('responde 404 INSTRUMENT_NOT_FOUND si el instrumento no existe', async () => {
    instruments.findByIds.mockResolvedValue([]);

    const response = await send({
      side: 'BUY',
      type: 'MARKET',
      size: 1,
    }).expect(404);

    expect(response.body).toEqual({ error: 'INSTRUMENT_NOT_FOUND' });
  });

  it('responde 400 al intentar operar el instrumento de efectivo', async () => {
    instruments.findByIds.mockResolvedValue([
      { id: 66, ticker: 'ARS', name: 'Pesos', type: 'MONEDA' },
    ]);

    const response = await send({
      instrumentId: 66,
      side: 'BUY',
      type: 'MARKET',
      size: 1,
    }).expect(400);

    expect(response.body).toEqual({
      error: 'VALIDATION_FAILED',
      details: [{ field: 'instrumentId', code: 'NOT_TRADABLE' }],
    });
  });

  it('responde 400 con detalles por campo ante un body inválido', async () => {
    const response = await send({ side: 'BUY', type: 'LIMIT' }).expect(400);

    expect(response.body.error).toBe('VALIDATION_FAILED');
    expect(response.body.details).toEqual(
      expect.arrayContaining([{ field: 'price', code: 'IS_NUMBER' }]),
    );
    expect(ledger).toHaveLength(0);
  });

  it('responde 400 si se envían size y amount a la vez', async () => {
    const response = await send({
      side: 'BUY',
      type: 'MARKET',
      size: 1,
      amount: 100,
    }).expect(400);

    expect(response.body.details).toEqual([
      { field: 'amount', code: 'IS_ABSENT_WHEN' },
    ]);
  });
});
