import { Session } from 'next-auth/core/types';
import { JWT } from 'next-auth/jwt';

export interface ISession extends Session {
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
}
export interface IJWT extends JWT {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
}
