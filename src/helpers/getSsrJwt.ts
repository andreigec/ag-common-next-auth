import { error, warn } from 'ag-common/dist/common/helpers/log';
import { decode } from 'next-auth/jwt';

import type { IJWT, ISession } from '../types';

/** decode cookie with secret to get jwt */
export const getSsrJwt = async ({
  allCookies,
}: {
  /** cookies().getAll() */
  allCookies: { name: string; value: string }[];
}): Promise<IJWT | undefined> => {
  const sessionTokenEnc = allCookies
    .filter((r) => r.name.includes('next-auth.session-token'))
    .map((s) => s.value)
    .join('');
  if (!sessionTokenEnc) {
    error('error, no session next-auth token');
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
  expires: sessionExp || new Date((j as any).exp).toISOString(),
});
