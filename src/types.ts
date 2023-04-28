import { DefaultSession, User } from 'next-auth/core/types';
import { JWT } from 'next-auth/jwt';

export interface ISession extends DefaultSession {
  token: {
    idToken: string;
    accessToken: string;
    refreshToken: string;
  };

  user: IUser;
}
export interface IJWT extends JWT {
  user: IUser;
  accessToken: string;
  idToken: string;
  refreshToken: string;
}
export interface IUser extends User {
  isAdmin: boolean;
}
