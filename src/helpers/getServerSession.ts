import { warn } from 'ag-common/dist/common/helpers/log';

import type { ISession } from '../types';
import { getSsrJwt, jwtToSession } from './getSsrJwt';

/** get logged in user session */
export const getServerSession = async ({
  cookies,
}: {
  cookies: {
    getAll: () => {
      name: string;
      value: string;
    }[];
  };
}): Promise<ISession | undefined> => {
  const jwt = await getSsrJwt({ allCookies: cookies.getAll() });

  if (!jwt?.idToken) {
    warn('error no idtoken for session');
    return undefined;
  }

  return jwtToSession(jwt);
};
