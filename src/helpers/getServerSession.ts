import type { ISession, TRefreshType } from '../types';
import { getSsrJwt, jwtToSession } from './getSsrJwt';

/** get logged in user session */
export const getServerSession = async ({
  cookies,
  refreshType,
}: {
  cookies: {
    getAll: () => {
      name: string;
      value: string;
    }[];
  };
  refreshType: TRefreshType;
}): Promise<ISession | undefined> => {
  const jwt = await getSsrJwt({ allCookies: cookies.getAll(), refreshType });

  if (!jwt?.idToken) {
    return undefined;
  }

  return jwtToSession(jwt);
};
