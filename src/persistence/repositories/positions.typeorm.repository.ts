import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PositionEntity } from '../entities/position.entity.js';
import { toPositionModel } from '../mappers/position.mapper.js';
import type { Position } from '../../core/models/position.model.js';
import type { IPositionsRepository } from '../../core/repositories/positions.repository.js';

@Injectable()
export class PositionsTypeOrmRepository implements IPositionsRepository {
  constructor(
    @InjectRepository(PositionEntity)
    private readonly repository: Repository<PositionEntity>,
  ) {}

  async findByUser(userId: number): Promise<Position[]> {
    const entities = await this.repository.find({ where: { userId } });

    return entities.map(toPositionModel);
  }
}
