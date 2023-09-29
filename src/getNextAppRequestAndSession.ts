import { getNextAppRequest } from './helpers/getNextAppRequest';
import { getServerSession } from './helpers/getServerSession';

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
}) => {
  const pathname =
    headers.get('x-invoke-path') ?? headers.get('next-url') ?? '/';

  const session = await getServerSession({ cookies });

  const ar = getNextAppRequest({ headers });

  return {
    session,
    request: ar,
    cookieDocument: ar.cookieDocument || '',
    pathname,
  };
};
