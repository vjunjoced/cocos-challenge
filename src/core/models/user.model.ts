export interface User {
  id: number;
  email: string;
  accountNumber: string;
}

export type NewUser = Omit<User, 'id'>;
