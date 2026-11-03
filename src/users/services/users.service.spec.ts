import { UsersService } from './users.service.js';

describe('UsersService', () => {
  it('crea el usuario junto con su fila de efectivo en cero', async () => {
    const created = { id: 5, email: 'a@b.com', accountNumber: '1001' };
    const createWithPositions = vi.fn().mockResolvedValue(created);
    const service = new UsersService({
      exists: vi.fn(),
      createWithPositions,
    });

    await expect(
      service.createUser({ email: 'a@b.com', accountNumber: '1001' }),
    ).resolves.toEqual(created);

    expect(createWithPositions).toHaveBeenCalledTimes(1);
    const [user, positions] = createWithPositions.mock.calls[0] as [
      object,
      {
        instrumentId: number;
        quantity: { toNumber(): number };
        cost: { toNumber(): number };
      }[],
    ];
    expect(user).toEqual({ email: 'a@b.com', accountNumber: '1001' });
    expect(positions).toHaveLength(1);
    expect(positions[0]?.instrumentId).toBe(66);
    expect(positions[0]?.quantity.toNumber()).toBe(0);
    expect(positions[0]?.cost.toNumber()).toBe(0);
  });
});
