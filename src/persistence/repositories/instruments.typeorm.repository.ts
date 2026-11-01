import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { escapeLike } from '../../common/utils/escape-like.js';
import { MAX_SEARCH_RESULTS } from '../constants/instruments.constants.js';
import { InstrumentEntity } from '../entities/instrument.entity.js';
import type { Instrument } from '../../core/models/instrument.model.js';
import type { IInstrumentsRepository } from '../../core/repositories/instruments.repository.js';

@Injectable()
export class InstrumentsTypeOrmRepository implements IInstrumentsRepository {
  constructor(
    @InjectRepository(InstrumentEntity)
    private readonly repository: Repository<InstrumentEntity>,
  ) {}

  search(term: string): Promise<Instrument[]> {
    const pattern = `%${escapeLike(term)}%`;

    return this.repository
      .createQueryBuilder('instrument')
      .where('instrument.ticker ILIKE :pattern', { pattern })
      .orWhere('instrument.name ILIKE :pattern', { pattern })
      .orderBy('instrument.ticker', 'ASC')
      .limit(MAX_SEARCH_RESULTS)
      .getMany();
  }

  async findByIds(ids: number[]): Promise<Instrument[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.repository.findBy({ id: In(ids) });
  }
}
