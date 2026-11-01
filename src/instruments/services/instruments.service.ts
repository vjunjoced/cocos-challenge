import { Inject, Injectable } from '@nestjs/common';
import type { Instrument } from '../../core/models/instrument.model.js';
import {
  INSTRUMENTS_REPOSITORY,
  type IInstrumentsRepository,
} from '../../core/repositories/instruments.repository.js';

@Injectable()
export class InstrumentsService {
  constructor(
    @Inject(INSTRUMENTS_REPOSITORY)
    private readonly instrumentsRepository: IInstrumentsRepository,
  ) {}

  search(term: string): Promise<Instrument[]> {
    return this.instrumentsRepository.search(term);
  }
}
