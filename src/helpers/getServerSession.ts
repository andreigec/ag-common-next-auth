import type { ISession, NextCookies, TRefreshType } from '../types';
import { getSsrJwt, jwtToSession } from './getSsrJwt';

/** get logged in user session */
export const getServerSession = async ({
  cookies,
  refreshType,
}: {
  cookies: NextCookies;
  refreshType: TRefreshType;
}): Promise<ISession | undefined> => {
  const jwt = await getSsrJwt({
    allCookies: (await cookies).getAll(),
    refreshType,
  });

  if (!jwt?.idToken) {
    return undefined;
  }

  return jwtToSession(jwt);
};
