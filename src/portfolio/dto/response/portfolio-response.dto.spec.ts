import { PortfolioResponseDto } from './portfolio-response.dto.js';

describe('PortfolioResponseDto', () => {
  it('expone totales y posiciones sin campos de más', () => {
    const internal = {
      totalValue: 1100,
      availableCash: 500,
      internalField: 'no debe viajar',
      positions: [
        {
          instrumentId: 47,
          ticker: 'PAMP',
          name: 'Pampa Holding',
          quantity: 5,
          marketValue: 600,
          totalReturnPercentage: 20,
          cost: 500,
        },
      ],
    };

    expect(PortfolioResponseDto.from(internal)).toEqual({
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
        },
      ],
    });
  });

  it('devuelve una lista vacía cuando no hay posiciones', () => {
    expect(
      PortfolioResponseDto.from({
        totalValue: 0,
        availableCash: 0,
        positions: [],
      }),
    ).toEqual({ totalValue: 0, availableCash: 0, positions: [] });
  });
});
