import { toLatestPrice } from './latest-price.mapper.js';

describe('toLatestPrice', () => {
  it('convierte la fila cruda (numeric como string) a números', () => {
    expect(
      toLatestPrice({
        instrumentId: 47,
        close: '950.50',
        previousClose: '940.00',
      }),
    ).toEqual({
      instrumentId: 47,
      close: 950.5,
      previousClose: 940,
    });
  });

  it('acepta el id como string, como lo devuelve el driver en filas crudas', () => {
    expect(
      toLatestPrice({
        instrumentId: '31' as unknown as number,
        close: '1540',
        previousClose: '1500',
      }),
    ).toEqual({ instrumentId: 31, close: 1540, previousClose: 1500 });
  });
});
