import { Decimal } from 'decimal.js';
import { NotFoundError } from '../../common/errors/not-found.error.js';
import type { LatestPrice } from '../../core/models/latest-price.model.js';
import type { Position } from '../../core/models/position.model.js';
import { PortfolioService } from './portfolio.service.js';

describe('PortfolioService', () => {
  const position = (
    instrumentId: number,
    quantity: number,
    cost = 0,
  ): Position => ({
    instrumentId,
    quantity: new Decimal(quantity),
    cost: new Decimal(cost),
  });

  const build = (
    overrides: {
      exists?: boolean;
      positions?: Position[];
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
      createWithPositions: vi.fn(),
    };
    const positions = {
      findByUser: vi.fn().mockResolvedValue(overrides.positions ?? []),
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
      positions,
      marketData,
      instruments,
      service: new PortfolioService(users, positions, marketData, instruments),
    };
  };

  it('lanza NotFoundError cuando el usuario no existe', async () => {
    const { positions, service } = build({ exists: false });

    await expect(service.getPortfolio(7)).rejects.toThrow(NotFoundError);
    expect(positions.findByUser).not.toHaveBeenCalled();
  });

  it('devuelve el portfolio vacío cuando el usuario no tiene posiciones', async () => {
    const { service } = build();

    await expect(service.getPortfolio(1)).resolves.toEqual({
      totalValue: 0,
      availableCash: 0,
      positions: [],
    });
  });

  it('consulta precios e instrumentos solo de los activos, sin el efectivo', async () => {
    const { positions, marketData, instruments, service } = build({
      positions: [
        position(66, 1000),
        position(47, 5, 500),
        position(31, 1, 10),
      ],
    });

    await service.getPortfolio(1);

    expect(positions.findByUser).toHaveBeenCalledWith(1);
    expect(marketData.findLatestPrices).toHaveBeenCalledWith([47, 31]);
    expect(instruments.findByIds).toHaveBeenCalledWith([47, 31]);
  });

  it('calcula el portfolio con las posiciones, precios e instrumentos', async () => {
    const { service } = build({
      positions: [position(66, 500), position(47, 5, 500)],
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
