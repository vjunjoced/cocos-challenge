import { Controller, Get, Query } from '@nestjs/common';
import { SearchInstrumentsDto } from '../dto/request/search-instruments.dto.js';
import { InstrumentResponseDto } from '../dto/response/instrument-response.dto.js';
import { InstrumentsService } from '../services/instruments.service.js';

@Controller('instruments')
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentsService) {}

  @Get()
  async search(
    @Query() query: SearchInstrumentsDto,
  ): Promise<InstrumentResponseDto[]> {
    const instruments = await this.instrumentsService.search(query.q);

    return instruments.map((instrument) =>
      InstrumentResponseDto.from(instrument),
    );
  }
}
