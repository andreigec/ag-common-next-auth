import { dateDiff } from 'ag-common/dist/common/helpers/date';
import { debug, error, warn } from 'ag-common/dist/common/helpers/log';
import { isJson } from 'ag-common/dist/common/helpers/object';
import NextAuth, { Account, Profile } from 'next-auth';
import CognitoProvider from 'next-auth/providers/cognito';

import { getExpMins, parseJwt } from './helpers/parse';
import { refreshCognitoAccessToken } from './helpers/refreshCognitoAccessToken';
import { IJWT, ISession } from './types';

export const getCognitoAuthOptions = (p: {
  COGNITO_CLIENT_ID: string;
  COGNITO_CLIENT_SECRET: string;
  /** set this to be any const in env */
  NEXTAUTH_SECRET: string;
  COGNITO_ISSUER: string;
  COGNITO_BASE: string;
  /** if true, will debug next-auth details. default false */
  debug?: boolean;
  /** if supplied, will set isAdmin to true if email matches */
  adminEmails?: string[];
}) => {
  return NextAuth({
    debug: p.debug,
    session: {
      //maxAge, //default 30d
      updateAge: 600, //10m. default 1d
    },
    jwt: {
      //maxAge, //default 30d
    },
    providers: [
      CognitoProvider({
        clientId: p.COGNITO_CLIENT_ID,
        clientSecret: p.COGNITO_CLIENT_SECRET || '',
        issuer: p.COGNITO_ISSUER,

        checks: [
          //@ts-ignore - fix cognito bug
          'nonce',
          'state',
        ],
      }),
    ],
    secret: p.NEXTAUTH_SECRET,
    callbacks: {
      async session(sRaw) {
        const token = sRaw.token as IJWT;
        debug(
          'start session. exp=' +
            dateDiff(new Date(), new Date(sRaw.session.expires)).totalMinutes,
        );

        const session: ISession = {
          user: token.user ?? sRaw.user,
          expires: sRaw.session.expires,
          token,
        };

        debug('end session. has user picture? ' + !!session.user.image);
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

          let image: string | undefined;
          if (token?.picture?.startsWith('http')) {
            image = token.picture;
          } else if (token?.picture && isJson(token.picture)) {
            image = JSON.parse(token.picture)?.data?.url;
          }

          token = {
            ...token,
            ...(account?.access_token && { accessToken: account.access_token }),
            ...(account?.id_token && { idToken: account.id_token }),
            ...(account?.refresh_token && {
              refreshToken: account.refresh_token,
            }),
            user: {
              id: token.email ?? token.name ?? '',
              isAdmin:
                (!!token.email && p.adminEmails?.includes(token.email)) ??
                false,
              email: token.email ?? '',
              image,
            },
          };

          let tokenexpmins = getExpMins(token);
          debug('start jwt. exp mins', tokenexpmins);

          if (!tokenexpmins || tokenexpmins <= 5) {
            warn('will refresh token');
            const { tokens } = await refreshCognitoAccessToken({
              refresh_token: token?.refreshToken,
              clientSecret: p.COGNITO_CLIENT_SECRET,
              COGNITO_BASE: p.COGNITO_BASE,
              COGNITO_CLIENT_ID: p.COGNITO_CLIENT_ID,
            });
            token = {
              ...token,
              ...tokens,
            };
          }

          tokenexpmins = getExpMins(token);
          debug('end jwt. exp mins=', tokenexpmins);

          return token;
        } catch (e) {
          error('jwt error=', e);
          throw e;
        }
      },
    },
  });
};
