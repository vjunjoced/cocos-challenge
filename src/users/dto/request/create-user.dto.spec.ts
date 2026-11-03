import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { toValidationDetails } from '../../../common/mappers/validation-details.mapper.js';
import { CreateUserDto } from './create-user.dto.js';

const details = async (plain: object) =>
  toValidationDetails(await validate(plainToInstance(CreateUserDto, plain)));

describe('CreateUserDto', () => {
  it('acepta un email y un número de cuenta', async () => {
    await expect(
      details({ email: 'a@b.com', accountNumber: '1001' }),
    ).resolves.toEqual([]);
  });

  it('rechaza un email inválido', async () => {
    await expect(
      details({ email: 'no-es-email', accountNumber: '1001' }),
    ).resolves.toEqual([{ field: 'email', code: 'IS_EMAIL' }]);
  });

  it.each(['', 123])(
    'rechaza el número de cuenta %j',
    async (accountNumber) => {
      const result = await details({ email: 'a@b.com', accountNumber });

      expect(result.length).toBeGreaterThan(0);
      expect(result.every((d) => d.field === 'accountNumber')).toBe(true);
    },
  );

  it('exige ambos campos', async () => {
    const result = await details({});

    expect(result.map((d) => d.field)).toEqual(
      expect.arrayContaining(['email', 'accountNumber']),
    );
  });
});
