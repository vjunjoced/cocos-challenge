import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('responde con estado ok y el uptime en segundos', () => {
    vi.spyOn(process, 'uptime').mockReturnValue(125.7);

    expect(new HealthController().check()).toEqual({
      status: 'ok',
      uptime: 125,
    });
  });
});
