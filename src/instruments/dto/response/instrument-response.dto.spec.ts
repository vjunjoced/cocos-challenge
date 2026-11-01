import { InstrumentResponseDto } from './instrument-response.dto.js';

describe('InstrumentResponseDto', () => {
  it('expone solo los campos del contrato', () => {
    const internal = {
      id: 1,
      ticker: 'GGAL',
      name: 'Grupo Financiero Galicia',
      type: 'ACCIONES',
      internalField: 'no debe viajar',
    };

    expect(InstrumentResponseDto.from(internal)).toEqual({
      id: 1,
      ticker: 'GGAL',
      name: 'Grupo Financiero Galicia',
      type: 'ACCIONES',
    });
  });
});
