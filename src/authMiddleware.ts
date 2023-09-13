import { getSsrJwt, jwtToSession } from './helpers/getSsrJwt';

/** for use with next 13 appdir */
export const authMiddleware = async ({
  cookies,
}: {
  /** use next/headers/cookies() */
  cookies: {
    getAll: () => {
      name: string;
      value: string;
    }[];
  };
}) => {
  const jwt = await getSsrJwt({ allCookies: cookies.getAll() });

  if (!jwt?.idToken) {
    return {};
  }
  const session = jwtToSession(jwt);

  return { session };
};
