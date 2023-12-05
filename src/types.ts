import type { TLang } from 'ag-common/dist/common/helpers/i18n';
import type { URLLite } from 'ag-common/dist/ui/helpers/routes';
import type { DefaultSession, User } from 'next-auth/core/types';
import type { JWT } from 'next-auth/jwt/types';

export interface ISession extends DefaultSession {
  token: {
    idToken: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };

  user: IUser;
}
export interface IJWT extends JWT {
  user: IUser;
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}
export interface IUser extends User {
  isAdmin: boolean;
}

export interface INextRequest {
  url: URLLite;
  query: Record<string, string>;
  userAgent: string;
  lang: TLang;
  cookieDocument: string | null;
}

export interface ICognitoRefresh {
  client_id: string;
  COGNITO_BASE: string;
  client_secret: string;
}
export type TRefreshType = { type: 'direct' } | ICognitoRefresh;

export type TRefreshTypeIn =
  | { type: 'direct' }
  | {
      client_id: string;
      COGNITO_BASE: string;
    };
