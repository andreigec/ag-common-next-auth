import { warn } from 'ag-common/dist/common/helpers/log';
import { User } from 'ag-common/dist/ui/helpers/jwt';
import { useSession } from 'next-auth/react';

import { ISession } from './types';

export const useNextAuth = (p: {
  COGNITO_BASE: string;
  COGNITO_CLIENT_ID: string;
}) => {
  const us = useSession();

  const { status } = us;
  const session = us.data as ISession;
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
      isAdmin:
        su.email === 'andreigec@hotmail.com' ||
        su.email === 'andreigec@gmail.com',
      updatedAt: 0,
      nickname: '',
    };
  }
  return {
    logout: async () => {
      const logoutUrl = new URL(p.COGNITO_BASE + '/logout');
      logoutUrl.searchParams.append('client_id', p.COGNITO_CLIENT_ID);
      logoutUrl.searchParams.append('logout_uri', window.location.origin);

      window.location.href = logoutUrl.href;
    },
    isAuthenticated,
    authLoading,
    user,
    session,
  };
};
