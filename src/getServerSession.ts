import { getSsrJwt, jwtToSession } from './helpers/getSsrJwt';
import type { ISession } from './types';

/** get logged in user session
 * for use with next 13 appdir */
export const getServerSession = async ({
  cookies,
}: {
  /** use next/headers/cookies() */
  cookies: {
    getAll: () => {
      name: string;
      value: string;
    }[];
  };
}): Promise<ISession | undefined> => {
  const jwt = await getSsrJwt({ allCookies: cookies.getAll() });

  if (!jwt?.idToken) {
    return undefined;
  }

  return jwtToSession(jwt);
};
