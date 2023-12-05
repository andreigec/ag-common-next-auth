import { debug, error, info, warn } from 'ag-common/dist/common/helpers/log';
import { decode } from 'next-auth/jwt';

import type { IJWT, ISession, TRefreshType } from '../types';
import { refreshCognitoAccessToken } from './refreshCognitoAccessToken';

/** decode cookie with secret to get jwt */
export const getSsrJwt = async ({
  allCookies,
  refreshType,
}: {
  /** cookies().getAll() */
  allCookies: { name: string; value: string }[];
  refreshType: TRefreshType;
}): Promise<IJWT | undefined> => {
  if (allCookies.length === 0) {
    info('getSsrJwt: no cookies received!');
    return undefined;
  }
  const sessionTokenEnc = allCookies
    .filter((r) => r.name.includes('next-auth.session-token'))
    .map((s) => s.value)
    .join('');
  if (!sessionTokenEnc) {
    const list = allCookies.map((c) => c.name);
    info(`no session next-auth token, but saw these:\n${list.join(' ')}`);
    const j = allCookies.find((r) => r.name === '_vercel_jwt');
    if (j?.value) {
      info('_vercel_jwt=', j.value);
    }

    return undefined;
  }
  try {
    const decoded = (await decode({
      token: sessionTokenEnc,
      secret: process.env.NEXTAUTH_SECRET ?? '',
    })) as IJWT;

    if (!decoded.idToken) {
      error('decoded jwt has no idToken', sessionTokenEnc);
      return undefined;
    }

    const jwtExpiry = Number(decoded.expiresAt + '000');

    if (new Date().getTime() > jwtExpiry) {
      if (!decoded.refreshToken) {
        error('jwt expired, and has no refresh', sessionTokenEnc);
        return undefined;
      }
      if (!refreshType) {
        error('error: jwt expired, and no refresh type', sessionTokenEnc);
        return undefined;
      }
      if ('COGNITO_BASE' in refreshType) {
        debug('refreshing expired cognito jwt');
        const { tokens } = await refreshCognitoAccessToken({
          refresh_token: decoded.refreshToken,
          ...refreshType,
        });

        if (!tokens?.accessToken) {
          error('refresh error', tokens);
          return undefined;
        }
        decoded.accessToken = tokens.accessToken;
        decoded.idToken = tokens.idToken;
        decoded.refreshToken = tokens.refreshToken;
      } else {
        debug('cant refresh type:' + JSON.stringify(refreshType));
      }
    }

    return decoded;
  } catch (e) {
    warn('jwt decode error:', (e as Error).toString());
  }
};

export const jwtToSession = (j: IJWT, sessionExp?: string): ISession => ({
  token: {
    accessToken: j.accessToken,
    idToken: j.idToken,
    refreshToken: j.refreshToken,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expiresAt: (j as any).exp,
  },
  user: j.user,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expires: sessionExp || new Date(Number(j.exp + '000')).toISOString(),
});
