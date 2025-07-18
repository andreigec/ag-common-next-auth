import { warn } from 'ag-common/dist/common/helpers/log';

import { getNextAppRequest } from './helpers/getNextAppRequest';
import { getServerSession } from './helpers/getServerSession';
import type {
  INextRequest,
  ISession,
  NextCookies,
  NextHeaders,
  TRefreshType,
  TRefreshTypeIn,
} from './types';

/** get request and session details
 * next 13+ app server side only
 */
export const getNextAppRequestAndSession = async ({
  headers,
  cookies,
  refreshType: refreshTypeRaw,
}: {
  /** use next/headers() */
  headers: NextHeaders;
  /** use next/cookies() */
  cookies: NextCookies;
  refreshType: TRefreshTypeIn;
}): Promise<{
  session?: ISession;
  request: INextRequest;
}> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refreshType: TRefreshType = refreshTypeRaw as any;
  if ('COGNITO_BASE' in refreshType) {
    refreshType.client_secret = process.env.COGNITO_CLIENT_SECRET || '';
    if (!refreshType.client_secret) {
      warn('cognito or COGNITO_CLIENT_SECRET not provided, wont refresh');
    }
  }

  return {
    session: await getServerSession({
      cookies,
      refreshType,
    }),
    request: await getNextAppRequest({ headers }),
  };
};
