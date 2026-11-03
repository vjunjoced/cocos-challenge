import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PositionEntity } from '../entities/position.entity.js';
import { UserEntity } from '../entities/user.entity.js';
import { toPositionEntity } from '../mappers/position.mapper.js';
import type { Position } from '../../core/models/position.model.js';
import type { NewUser, User } from '../../core/models/user.model.js';
import type { IUsersRepository } from '../../core/repositories/users.repository.js';

@Injectable()
export class UsersTypeOrmRepository implements IUsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
    private readonly dataSource: DataSource,
  ) {}

  exists(userId: number): Promise<boolean> {
    return this.repository.existsBy({ id: userId });
  }

  createWithPositions(user: NewUser, positions: Position[]): Promise<User> {
    return this.dataSource.transaction(async (manager) => {
      const saved = await manager.save(manager.create(UserEntity, user));
      const now = new Date();

      await manager.insert(
        PositionEntity,
        positions.map((position) => toPositionEntity(saved.id, position, now)),
      );

      return {
        id: saved.id,
        email: saved.email,
        accountNumber: saved.accountNumber,
      };
    });
  }
}
