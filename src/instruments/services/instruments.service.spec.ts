import type { Instrument } from '../../core/models/instrument.model.js';
import type { IInstrumentsRepository } from '../../core/repositories/instruments.repository.js';
import { InstrumentsService } from './instruments.service.js';

describe('InstrumentsService', () => {
  const instrument: Instrument = {
    id: 1,
    ticker: 'GGAL',
    name: 'Grupo Financiero Galicia',
    type: 'ACCIONES',
  };

  it('delega la búsqueda en el repositorio y devuelve su resultado', async () => {
    const search = vi.fn().mockResolvedValue([instrument]);
    const repository: IInstrumentsRepository = { search, findByIds: vi.fn() };
    const service = new InstrumentsService(repository);

    await expect(service.search('gal')).resolves.toEqual([instrument]);
    expect(search).toHaveBeenCalledWith('gal');
  });
});
