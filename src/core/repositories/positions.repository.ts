import type { Position } from '../models/position.model.js';

export const POSITIONS_REPOSITORY = Symbol('POSITIONS_REPOSITORY');

export interface IPositionsRepository {
  findByUser(userId: number): Promise<Position[]>;
}
