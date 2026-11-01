import type { InstrumentsService } from '../services/instruments.service.js';
import { InstrumentsController } from './instruments.controller.js';

describe('InstrumentsController', () => {
  it('devuelve los instrumentos como DTOs de respuesta', async () => {
    const search = vi.fn().mockResolvedValue([
      {
        id: 1,
        ticker: 'GGAL',
        name: 'Grupo Financiero Galicia',
        type: 'ACCIONES',
        internalField: 'no debe viajar',
      },
    ]);
    const service = { search } as unknown as InstrumentsService;
    const controller = new InstrumentsController(service);

    await expect(controller.search({ q: 'gal' })).resolves.toEqual([
      {
        id: 1,
        ticker: 'GGAL',
        name: 'Grupo Financiero Galicia',
        type: 'ACCIONES',
      },
    ]);
    expect(search).toHaveBeenCalledWith('gal');
  });
});
