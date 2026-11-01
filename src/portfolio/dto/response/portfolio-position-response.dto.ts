import type { PortfolioPosition } from '../../models/portfolio.model.js';

export class PortfolioPositionResponseDto {
  instrumentId: number;
  ticker: string;
  name: string;
  quantity: number;
  marketValue: number;
  totalReturnPercentage: number;
  dailyReturnPercentage: number;

  static from(position: PortfolioPosition): PortfolioPositionResponseDto {
    return {
      instrumentId: position.instrumentId,
      ticker: position.ticker,
      name: position.name,
      quantity: position.quantity,
      marketValue: position.marketValue,
      totalReturnPercentage: position.totalReturnPercentage,
      dailyReturnPercentage: position.dailyReturnPercentage,
    };
  }
}
