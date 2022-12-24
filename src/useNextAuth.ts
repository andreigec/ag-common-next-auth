import { info, warn } from 'ag-common/dist/common/helpers/log';
import { User } from 'ag-common/dist/ui/helpers/jwt';
import {
  signIn,
  SignInOptions,
  signOut,
  SignOutParams,
  useSession,
  UseSessionOptions,
} from 'next-auth/react';
import { useEffect } from 'react';

import { ISession } from './types';

export const useNextAuth = (p: {
  COGNITO_BASE: string;
  COGNITO_CLIENT_ID: string;

  useSessionOpt?: UseSessionOptions<boolean>;
  signoutOpt?: SignOutParams<boolean>;
  signinOpt?: SignInOptions;
  /** if true, will debug details. default false */
  debug?: boolean;
}) => {
  const { status, data } = useSession(p.useSessionOpt);
  const session = data as ISession;
  if (p.debug) {
    info('use session=', status, session);
  }

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((session as any)?.error === 'RefreshAccessTokenError') {
      warn('session expired, try relogin');
      void signIn('cognito'); // Force sign in to hopefully resolve error
    }
  }, [session]);
  //
  let isAuthenticated = status === 'authenticated' && !!session?.token?.idToken;
  const authLoading =
    status === 'loading' ||
    (status === 'authenticated' && !session?.token?.idToken);

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
      isAdmin: su.isAdmin,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      idJwt: undefined as any,
      updatedAt: new Date().getTime(),
      nickname: su.name || '',
    };
  }
  return {
    login: () => signIn('cognito', p.signinOpt),
    logout: async () => {
      const logoutUrl = new URL(p.COGNITO_BASE + '/logout');
      logoutUrl.searchParams.append('client_id', p.COGNITO_CLIENT_ID);
      logoutUrl.searchParams.append('logout_uri', window.location.origin);
      await signOut(p.signoutOpt);
      window.location.href = logoutUrl.href;
    },
    isAuthenticated,
    authLoading,
    user,
    session,
  };
};
