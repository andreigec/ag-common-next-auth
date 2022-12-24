import { User } from 'next-auth/core/types';
import { JWT } from 'next-auth/jwt';

export interface ISession {
  expires: string;
  token: {
    idToken?: string;
    accessToken?: string;
    refreshToken?: string;
  };

  user: IUser;
}
export interface IJWT extends JWT {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  name?: string;
  email?: string;
  picture?: string;
  /** derived object */
  user: IUser;
}
export interface IUser extends User {
  isAdmin: boolean;
}
