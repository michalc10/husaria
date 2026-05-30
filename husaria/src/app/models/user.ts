export type UserRole = 'ADMIN' | 'JUDGE';

export interface IUser {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  mustChangePassword: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ILoginResponse {
  user: IUser;
}

export interface ICreateUserPayload {
  email: string;
  name: string;
  role: UserRole;
  temporaryPassword: string;
}

export interface IUpdateUserPayload {
  email?: string;
  name?: string;
  role?: UserRole;
  active?: boolean;
}
