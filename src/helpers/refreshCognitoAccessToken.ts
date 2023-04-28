import { warn } from 'ag-common/dist/common/helpers/log';

const stringify = (p: Record<string, string>) => {
  const params = new URLSearchParams();
  Object.entries(p).forEach(([a, b]) => params.append(a, b));
  return params;
};

export const refreshCognitoAccessToken = async (p: {
  refresh_token?: string;
  clientSecret?: string;
  COGNITO_CLIENT_ID: string;
  COGNITO_BASE: string;
}) => {
  if (!p.refresh_token) {
    warn('no refresh token');
    return {};
  }
  if (!p.clientSecret) {
    warn('no cog secret');
    return {};
  }
  const opt = {
    method: 'POST',
    headers: new Headers({
      'Content-Type': 'application/x-www-form-urlencoded',
    }),
    body: stringify({
      grant_type: 'refresh_token',
      client_id: p.COGNITO_CLIENT_ID,
      refresh_token: p.refresh_token,
      client_secret: p.clientSecret,
    }),
  };
  const req = await fetch(p.COGNITO_BASE + '/oauth2/token', opt);
  if (!req.ok) {
    throw new Error(JSON.stringify(await req.json()));
  }
  const res = (await req.json()) as {
    access_token: string;
    expires_in: number;
    id_token: string;
    refresh_token: string;
  };
  return {
    expires_in: res.expires_in,
    tokens: {
      accessToken: res?.access_token,
      refreshToken: res?.refresh_token ?? p.refresh_token, // Fall back to old refresh token
      idToken: res?.id_token,
    },
  };
};
