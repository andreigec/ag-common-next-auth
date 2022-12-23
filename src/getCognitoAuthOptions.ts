import { info, warn } from 'ag-common/dist/common/helpers/log';
import NextAuth, { Account, Profile, User } from 'next-auth';
import CognitoProvider from 'next-auth/providers/cognito';

import { refreshCognitoAccessToken } from './helpers/refreshCognitoAccessToken';
import { IJWT, ISession } from './types';

export const getCognitoAuthOptions = (p: {
  COGNITO_CLIENT_ID: string;
  COGNITO_CLIENT_SECRET: string;
  /** set this to be any const in env */
  NEXTAUTH_SECRET: string;
  COGNITO_ISSUER: string;
  COGNITO_BASE: string;
  /** if true, will debug details. default false */
  debug?: boolean;
}) =>
  NextAuth({
    debug: p.debug,
    providers: [
      CognitoProvider({
        clientId: p.COGNITO_CLIENT_ID,
        clientSecret: p.COGNITO_CLIENT_SECRET || '',
        issuer: p.COGNITO_ISSUER,
        checks: ['nonce', 'state'],
      }),
    ],
    secret: p.NEXTAUTH_SECRET,
    callbacks: {
      async session(sRaw) {
        const { session, token } = JSON.parse(JSON.stringify(sRaw)) as {
          session: ISession;
          user: User;
          token: IJWT;
        };

        session.accessToken = token.accessToken;
        session.idToken = token.idToken;
        session.refreshToken = token.refreshToken;
        if (session?.user?.image && typeof session.user.image === 'string') {
          session.user.image = JSON.parse(session.user.image)?.data?.url;
        }
        if (p.debug) {
          info('session=', sRaw, session);
        }
        return session;
      },
      async jwt(jRaw) {
        const { token, user, account } = JSON.parse(JSON.stringify(jRaw)) as {
          token: IJWT;
          user?: User | undefined;
          account?: Account | null | undefined;
          profile?: Profile | undefined;
          isNewUser?: boolean | undefined;
        };

        if (user) {
          token.id = user.id;
        }
        if (account) {
          token.accessToken = account.access_token;
          token.idToken = account.id_token;
          token.refreshToken = account.refresh_token;
        }
        const exp = Number((account?.expires_at || token?.exp) + '000');
        if (Date.now() < exp) {
          return token;
        }

        warn('will refresh token, expired at ', new Date(exp).toUTCString());
        const newv = await refreshCognitoAccessToken({
          refresh_token: account?.refresh_token,
          clientSecret: p.COGNITO_CLIENT_SECRET,
          COGNITO_BASE: p.COGNITO_BASE,
          COGNITO_CLIENT_ID: p.COGNITO_CLIENT_ID,
        });
        warn('refreshed token');

        const ret = {
          ...token,
          ...newv,
        };
        if (p.debug) {
          info('jwt=', jRaw, ret);
        }
        return ret;
      },
    },
  });
