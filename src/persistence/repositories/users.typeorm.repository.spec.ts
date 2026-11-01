import type { Repository } from 'typeorm';
import type { UserEntity } from '../entities/user.entity.js';
import { UsersTypeOrmRepository } from './users.typeorm.repository.js';

describe('UsersTypeOrmRepository', () => {
  it.each([true, false])('exists devuelve %s según la base', async (found) => {
    const existsBy = vi.fn().mockResolvedValue(found);
    const repository = new UsersTypeOrmRepository({
      existsBy,
    } as unknown as Repository<UserEntity>);

    await expect(repository.exists(7)).resolves.toBe(found);
    expect(existsBy).toHaveBeenCalledWith({ id: 7 });
  });
});
