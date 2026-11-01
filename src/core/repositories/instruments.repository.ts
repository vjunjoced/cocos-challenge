import type { Instrument } from '../models/instrument.model.js';

export const INSTRUMENTS_REPOSITORY = Symbol('INSTRUMENTS_REPOSITORY');

export interface IInstrumentsRepository {
  search(term: string): Promise<Instrument[]>;
  findByIds(ids: number[]): Promise<Instrument[]>;
}
