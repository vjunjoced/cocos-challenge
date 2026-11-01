import type { Portfolio } from '../../models/portfolio.model.js';
import { PortfolioPositionResponseDto } from './portfolio-position-response.dto.js';

export class PortfolioResponseDto {
  totalValue: number;
  availableCash: number;
  positions: PortfolioPositionResponseDto[];

  static from(portfolio: Portfolio): PortfolioResponseDto {
    return {
      totalValue: portfolio.totalValue,
      availableCash: portfolio.availableCash,
      positions: portfolio.positions.map((position) =>
        PortfolioPositionResponseDto.from(position),
      ),
    };
  }
}
