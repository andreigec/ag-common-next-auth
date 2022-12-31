import { dateDiff } from 'ag-common/dist/common/helpers/date';
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
  /** if true, will debug next-auth details. default false */
  debug?: boolean;
  /** if supplied, will set isAdmin to true if email matches */
  adminEmails?: string[];
  /** duration of session in seconds. default 3600s */
  maxAge?: number;
}) => {
  const { maxAge = 3600 } = p;
  return NextAuth({
    debug: p.debug,
    session: {
      maxAge,
      updateAge: maxAge / 3,
    },
    jwt: {
      maxAge,
    },
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
          const expiry =
            token.accessTokenExpires || Number(account?.expires_at + '000');
          debug(
            'start jwt. exp mins=' +
              dateDiff(new Date(), new Date(expiry)).totalMinutes,
          );
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
            accessTokenExpires: expiry,
            user: {
              id: token.email ?? token.name ?? '',
              isAdmin:
                (!!token.email && p.adminEmails?.includes(token.email)) ??
                false,
              email: token.email ?? '',
              image,
            },
          };

          if (Date.now() >= expiry) {
            warn('will refresh token');
            const newv = await refreshCognitoAccessToken({
              refresh_token: account?.refresh_token,
              clientSecret: p.COGNITO_CLIENT_SECRET,
              COGNITO_BASE: p.COGNITO_BASE,
              COGNITO_CLIENT_ID: p.COGNITO_CLIENT_ID,
            });
            token = {
              ...token,
              ...newv,
            };
          }
          debug(
            'end jwt. exp mins=' +
              dateDiff(new Date(), new Date(token.accessTokenExpires))
                .totalMinutes,
          );
          return token;
        } catch (e) {
          error('jwt error=', e);
          throw e;
        }
      },
    },
  });
};
