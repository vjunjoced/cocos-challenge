import type { PortfolioService } from '../services/portfolio.service.js';
import { PortfolioController } from './portfolio.controller.js';

describe('PortfolioController', () => {
  it('devuelve el portfolio como DTO de respuesta', async () => {
    const getPortfolio = vi.fn().mockResolvedValue({
      totalValue: 1100,
      availableCash: 500,
      internalField: 'no debe viajar',
      positions: [],
    });
    const service = { getPortfolio } as unknown as PortfolioService;
    const controller = new PortfolioController(service);

    await expect(controller.getPortfolio({ userId: 1 })).resolves.toEqual({
      totalValue: 1100,
      availableCash: 500,
      positions: [],
    });
    expect(getPortfolio).toHaveBeenCalledWith(1);
  });
});
