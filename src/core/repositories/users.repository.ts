import type { Position } from '../models/position.model.js';
import type { NewUser, User } from '../models/user.model.js';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface IUsersRepository {
  exists(userId: number): Promise<boolean>;

  /**
   * Crea el usuario junto con sus posiciones iniciales en una sola
   * transacción: se crean las dos cosas o ninguna.
   */
  createWithPositions(user: NewUser, positions: Position[]): Promise<User>;
}
