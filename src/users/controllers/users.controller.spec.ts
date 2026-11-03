import type { UsersService } from '../services/users.service.js';
import { UsersController } from './users.controller.js';

describe('UsersController', () => {
  it('delega la creación y responde con el contrato del usuario', async () => {
    const createUser = vi
      .fn()
      .mockResolvedValue({ id: 5, email: 'a@b.com', accountNumber: '1001' });
    const controller = new UsersController({
      createUser,
    } as unknown as UsersService);
    const dto = { email: 'a@b.com', accountNumber: '1001' };

    await expect(controller.create(dto)).resolves.toEqual({
      id: 5,
      email: 'a@b.com',
      accountNumber: '1001',
    });
    expect(createUser).toHaveBeenCalledWith(dto);
  });
});
