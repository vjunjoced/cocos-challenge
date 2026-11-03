import { Inject, Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { CASH_INSTRUMENT_ID } from '../../core/constants/instrument.constants.js';
import type { NewUser, User } from '../../core/models/user.model.js';
import {
  USERS_REPOSITORY,
  type IUsersRepository,
} from '../../core/repositories/users.repository.js';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  /** Todo usuario nace con su fila de efectivo en cero. */
  createUser(user: NewUser): Promise<User> {
    return this.usersRepository.createWithPositions(user, [
      {
        instrumentId: CASH_INSTRUMENT_ID,
        quantity: new Decimal(0),
        cost: new Decimal(0),
      },
    ]);
  }
}
