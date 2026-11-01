import type { Instrument } from '../../../core/models/instrument.model.js';

export class InstrumentResponseDto {
  id: number;
  ticker: string;
  name: string;
  type: string;

  static from(instrument: Instrument): InstrumentResponseDto {
    return {
      id: instrument.id,
      ticker: instrument.ticker,
      name: instrument.name,
      type: instrument.type,
    };
  }
}
