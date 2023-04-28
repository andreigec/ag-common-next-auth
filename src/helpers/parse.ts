import { dateDiff } from 'ag-common/dist/common/helpers/date';
import { fromBase64 } from 'ag-common/dist/common/helpers/string/base64';

import { IJWT } from '../types';

export function parseJwt(token: string) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    fromBase64(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''),
  );

  return JSON.parse(jsonPayload);
}
export function getExpMins(token: IJWT) {
  //have to pull out of jwt itself
  const tokenExp = !token?.idToken
    ? undefined
    : new Date(Number(parseJwt(token.idToken).exp + '000'));
  if (!tokenExp) {
    return 0;
  }

  const tokenexpmins = dateDiff(new Date(), tokenExp).totalMinutes;
  return tokenexpmins;
}
