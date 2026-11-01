import { Controller, Get, Param } from '@nestjs/common';
import { PortfolioParamsDto } from '../dto/request/portfolio-params.dto.js';
import { PortfolioResponseDto } from '../dto/response/portfolio-response.dto.js';
import { PortfolioService } from '../services/portfolio.service.js';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get(':userId')
  async getPortfolio(
    @Param() params: PortfolioParamsDto,
  ): Promise<PortfolioResponseDto> {
    const portfolio = await this.portfolioService.getPortfolio(params.userId);

    return PortfolioResponseDto.from(portfolio);
  }
}
