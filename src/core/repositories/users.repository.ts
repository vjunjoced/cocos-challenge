export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface IUsersRepository {
  exists(userId: number): Promise<boolean>;
}
