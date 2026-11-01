import { NotFoundError } from '../../common/errors/not-found.error.js';
import type { LatestPrice } from '../../core/models/latest-price.model.js';
import type { Order } from '../../core/models/order.model.js';
import { PortfolioService } from './portfolio.service.js';

describe('PortfolioService', () => {
  const order = (
    side: Order['side'],
    instrumentId: number,
    size: number,
    price: number,
  ): Order => ({
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

  const build = (
    overrides: {
      exists?: boolean;
      orders?: Order[];
      prices?: LatestPrice[];
      instruments?: {
        id: number;
        ticker: string;
        name: string;
        type: string;
      }[];
    } = {},
  ) => {
    const users = {
      exists: vi.fn().mockResolvedValue(overrides.exists ?? true),
    };
    const orders = {
      findFilledByUser: vi.fn().mockResolvedValue(overrides.orders ?? []),
    };
    const marketData = {
      findLatestPrices: vi.fn().mockResolvedValue(overrides.prices ?? []),
    };
    const instruments = {
      search: vi.fn(),
      findByIds: vi.fn().mockResolvedValue(overrides.instruments ?? []),
    };

    return {
      users,
      orders,
      marketData,
      instruments,
      service: new PortfolioService(users, orders, marketData, instruments),
    };
  };

  it('lanza NotFoundError cuando el usuario no existe', async () => {
    const { orders, service } = build({ exists: false });

    await expect(service.getPortfolio(7)).rejects.toThrow(NotFoundError);
    expect(orders.findFilledByUser).not.toHaveBeenCalled();
  });

  it('devuelve el portfolio vacío cuando el usuario no tiene órdenes', async () => {
    const { service } = build();

    await expect(service.getPortfolio(1)).resolves.toEqual({
      totalValue: 0,
      availableCash: 0,
      positions: [],
    });
  });

  it('consulta precios e instrumentos solo de los operados, sin repetidos', async () => {
    const { orders, marketData, instruments, service } = build({
      orders: [
        order('CASH_IN', 66, 1000, 1),
        order('BUY', 47, 5, 100),
        order('BUY', 47, 5, 90),
        order('SELL', 31, 1, 10),
      ],
    });

    await service.getPortfolio(1);

    expect(orders.findFilledByUser).toHaveBeenCalledWith(1);
    expect(marketData.findLatestPrices).toHaveBeenCalledWith([47, 31]);
    expect(instruments.findByIds).toHaveBeenCalledWith([47, 31]);
  });

  it('calcula el portfolio con las órdenes, precios e instrumentos', async () => {
    const { service } = build({
      orders: [order('CASH_IN', 66, 1000, 1), order('BUY', 47, 5, 100)],
      prices: [{ instrumentId: 47, close: 120, previousClose: 120 }],
      instruments: [
        { id: 47, ticker: 'PAMP', name: 'Pampa Holding', type: 'ACCIONES' },
      ],
    });

    await expect(service.getPortfolio(1)).resolves.toEqual({
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
  });
});
