import { UserResponseDto } from './user-response.dto.js';

describe('UserResponseDto', () => {
  it('expone solo los campos del contrato', () => {
    const user = { id: 5, email: 'a@b.com', accountNumber: '1001' };

    expect(UserResponseDto.from({ ...user, extra: 'x' } as never)).toEqual(
      user,
    );
  });
});
