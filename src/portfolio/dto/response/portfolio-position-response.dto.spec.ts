import { PortfolioPositionResponseDto } from './portfolio-position-response.dto.js';

describe('PortfolioPositionResponseDto', () => {
  it('expone solo los campos del contrato', () => {
    const internal = {
      instrumentId: 47,
      ticker: 'PAMP',
      name: 'Pampa Holding',
      quantity: 40,
      marketValue: 38_000,
      totalReturnPercentage: 2.15,
      dailyReturnPercentage: 1.06,
      cost: 37_200,
    };

    expect(PortfolioPositionResponseDto.from(internal)).toEqual({
      instrumentId: 47,
      ticker: 'PAMP',
      name: 'Pampa Holding',
      quantity: 40,
      marketValue: 38_000,
      totalReturnPercentage: 2.15,
      dailyReturnPercentage: 1.06,
    });
  });
});
