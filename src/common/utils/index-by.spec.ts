import { indexBy } from './index-by.js';

describe('indexBy', () => {
  it('indexa los elementos por la clave indicada', () => {
    const items = [
      { id: 47, ticker: 'PAMP' },
      { id: 31, ticker: 'GGAL' },
    ];

    const index = indexBy(items, (item) => item.id);

    expect(index.get(47)).toBe(items[0]);
    expect(index.get(31)).toBe(items[1]);
    expect(index.get(99)).toBeUndefined();
  });

  it('con claves repetidas se queda con el último elemento', () => {
    const index = indexBy(
      [
        { id: 1, value: 'a' },
        { id: 1, value: 'b' },
      ],
      (item) => item.id,
    );

    expect(index.get(1)?.value).toBe('b');
  });

  it('devuelve un Map vacío para una lista vacía', () => {
    expect(indexBy([], (item: { id: number }) => item.id).size).toBe(0);
  });
});
