import { getNextAppRequest } from './helpers/getNextAppRequest';
import { getServerSession } from './helpers/getServerSession';
import type { INextRequest, ISession } from './types';

/** get request and session details
 * next 13+ app server side only
 */
export const getNextAppRequestAndSession = async ({
  headers,
  cookies,
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
}): Promise<{
  session?: ISession;
  request: INextRequest;
}> => ({
  session: await getServerSession({ cookies }),
  request: getNextAppRequest({ headers }),
});
