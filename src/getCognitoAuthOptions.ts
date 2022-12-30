import { debug, error, warn } from 'ag-common/dist/common/helpers/log';
import { isJson } from 'ag-common/dist/common/helpers/object';
import NextAuth, { Account, Profile } from 'next-auth';
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
  /** if supplied, will set isAdmin to true if email matches */
  adminEmails?: string[];
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
        debug('start session', sRaw);
        const token = sRaw.token as IJWT;

        const session: ISession = {
          user: token.user ?? sRaw.user,
          expires: sRaw.session.expires,
          token: {
            accessToken: token.accessToken,
            idToken: token.idToken,
            refreshToken: token.refreshToken,
          },
        };

        debug('end session ' + session);
        return session;
      },
      async jwt(jRaw) {
        try {
          // eslint-disable-next-line prefer-const
          let { token, account } = JSON.parse(JSON.stringify(jRaw)) as {
            token: IJWT;
            account?: Account;
            profile?: Profile;
            isNewUser?: boolean;
          };
          debug('start jwt ', jRaw);
          let image: string | undefined;
          if (token?.picture?.startsWith('http')) {
            image = token.picture;
          } else if (token?.picture && isJson(token.picture)) {
            image = JSON.parse(token.picture)?.data?.url;
          }

          token.user = {
            id: token.email ?? token.name ?? '',
            isAdmin:
              (!!token.email && p.adminEmails?.includes(token.email)) ?? false,
            email: token.email ?? '',
            image,
          };

          if (account) {
            token.accessToken = account.access_token;
            token.idToken = account.id_token;
            token.refreshToken = account.refresh_token;
          }
          const exp = Number((account?.expires_at || token?.exp) + '000');
          if (Date.now() >= exp) {
            warn(
              'will refresh token, expired at ',
              new Date(exp).toUTCString(),
            );
            const newv = await refreshCognitoAccessToken({
              refresh_token: account?.refresh_token,
              clientSecret: p.COGNITO_CLIENT_SECRET,
              COGNITO_BASE: p.COGNITO_BASE,
              COGNITO_CLIENT_ID: p.COGNITO_CLIENT_ID,
            });
            warn('refreshed token');
            token = {
              ...token,
              ...newv,
            };
          }

          debug('end jwt ' + token);
          return token;
        } catch (e) {
          error('jwt error=', e);
          throw e;
        }
      },
    },
  });
