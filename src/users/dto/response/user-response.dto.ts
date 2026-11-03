import type { User } from '../../../core/models/user.model.js';

export class UserResponseDto {
  id: number;
  email: string;
  accountNumber: string;

  static from(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      accountNumber: user.accountNumber,
    };
  }
}
