import { info, warn } from 'ag-common/dist/common/helpers/log';
import { User } from 'ag-common/dist/ui/helpers/jwt';
import { signIn, SignInOptions, signOut, useSession } from 'next-auth/react';
import { useEffect } from 'react';

import { ISession } from './types';

export const useNextAuth = (p: {
  COGNITO_BASE: string;
  COGNITO_CLIENT_ID: string;
  /** if supplied, will set isAdmin to true if email matches */
  adminEmails?: string[];
  /** if true, will debug details. default false */
  debug?: boolean;
}) => {
  const { status, data } = useSession();
  const session = data as ISession;
  if (p.debug) {
    info('use session=', session);
  }

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((session as any)?.error === 'RefreshAccessTokenError') {
      warn('session expired, try relogin');
      void signIn('cognito'); // Force sign in to hopefully resolve error
    }
  }, [session]);
  //
  let isAuthenticated = status === 'authenticated' && session.idToken;
  const authLoading =
    status === 'loading' || (status === 'authenticated' && !session?.idToken);
  let user: User | undefined;
  const su = session?.user;
  if (isAuthenticated && !su?.email) {
    warn(`auth error`);
    isAuthenticated = false;
  }

  if (isAuthenticated && su?.email) {
    user = {
      fullname: su.name || '',
      userId: su.email,
      picture: su.image || '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      idJwt: undefined as any,
      isAdmin: p.adminEmails?.includes(su.email) ?? false,
      updatedAt: new Date().getTime(),
      nickname: su.name || '',
    };
  }
  return {
    login: (opt?: SignInOptions) => signIn('cognito', opt),
    logout: async () => {
      const logoutUrl = new URL(p.COGNITO_BASE + '/logout');
      logoutUrl.searchParams.append('client_id', p.COGNITO_CLIENT_ID);
      logoutUrl.searchParams.append('logout_uri', window.location.origin);
      await signOut({ redirect: false });
      window.location.href = logoutUrl.href;
    },
    isAuthenticated,
    authLoading,
    user,
    session,
  };
};
