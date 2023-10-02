import { getNextAppRequest } from './helpers/getNextAppRequest';
import { getServerSession } from './helpers/getServerSession';
import type { INextRequest, ISession } from './types';

/** get request and session details
 * next 13+ app server side only
 */
export const getNextAppRequestAndSession = async ({
  headers,
  cookies,
  overrides,
}: {
  /** use next/headers() */
  headers: { get: (s: string) => string | null };
  /** use next/cookies() */
  cookies: {
    getAll: () => {
      name: string;
      value: string;
    }[];
  };
  overrides?: {
    pathname?: string;
  };
}): Promise<{
  session?: ISession;
  request: INextRequest;
  cookieDocument: string;
}> => {
  const session = await getServerSession({ cookies });

  const ar = getNextAppRequest({ headers, overrides });

  return {
    session,
    request: ar,
    cookieDocument: ar.cookieDocument || '',
  };
};
