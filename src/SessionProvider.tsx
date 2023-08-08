import { debug, warn } from 'ag-common/dist/common/helpers/log';
import type { User } from 'ag-common/dist/ui/helpers/jwt';
import { useInterval } from 'ag-common/dist/ui/helpers/useInterval';
import type {
  SessionProviderProps,
  SignInOptions,
  SignInResponse,
  SignOutParams,
  UseSessionOptions,
} from 'next-auth/react';
import {
  SessionProvider as SP,
  signIn,
  signOut,
  useSession,
} from 'next-auth/react';
import React, { createContext, useEffect } from 'react';

import type { ISession } from './types';

export type ISessionProviderProps = SessionProviderProps & {
  COGNITO_BASE: string;
  COGNITO_CLIENT_ID: string;

  useSessionOpt?: UseSessionOptions<boolean>;
  signoutOpt?: SignOutParams<boolean>;
  signinOpt?: SignInOptions;
};
export interface ISessionProvider {
  login: () => Promise<SignInResponse | undefined>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  authLoading: boolean;
  user: User | undefined;
  session: ISession;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SessionContext = createContext<ISessionProvider>({} as any);

const WithSessionProvider = (p: ISessionProviderProps) => {
  const raw = useSession(p.useSessionOpt);
  const session = raw.data as ISession;

  useInterval(() => {
    try {
      debug('triggering visibilitychange for jwt/session refresh');
      //refresh the session + jwt
      document.dispatchEvent(new Event('visibilitychange'));
    } catch (e) {
      warn('error refreshing session');
    }
  }, 4 * 60000);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const se = (session as any)?.error;
    if (se) {
      if (se === 'RefreshAccessTokenError') {
        warn('session expired, try relogin');
        void signIn('cognito', p.signinOpt); // Force sign in to hopefully resolve error
      } else {
        warn('unhandled session error:' + se);
      }
    }
  }, [p.signinOpt, session]);
  //
  let isAuthenticated =
    raw.status === 'authenticated' && !!session?.token?.idToken;
  const authLoading =
    raw.status === 'loading' ||
    (raw.status === 'authenticated' && !session?.token?.idToken);

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
  debug(`session user. isauth?=${isAuthenticated} email=${su?.email}`);

  const state: ISessionProvider = {
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

  return (
    <SessionContext.Provider value={state}>
      {p.children}
    </SessionContext.Provider>
  );
};

/** SessionProvider that periodically user refreshes.
 * refetchInterval default 10m
 */
export const SessionProvider = (props: ISessionProviderProps) => {
  return (
    <SP {...props}>
      <WithSessionProvider {...props} />
    </SP>
  );
};
