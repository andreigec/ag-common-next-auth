import type { TLang } from 'ag-common/dist/common/helpers/i18n';
import { info } from 'ag-common/dist/common/helpers/log';
import { objectToString } from 'ag-common/dist/common/helpers/object';
import { stringToObject, stripUrl } from 'ag-common/dist/common/helpers/string';
import type { URLLite } from 'ag-common/dist/ui/helpers/routes';
import { getRenderLanguage } from 'ag-common/dist/ui/helpers/routes';

import type { NextHeaders } from '../types';

const getPathName = ({
  headers,
}: {
  headers: { get: (s: string) => string | null };
}) =>
  (
    headers.get('x-invoke-path') ??
    headers.get('next-url') ??
    headers.get('x-invoke-path2') ??
    '/'
  )
    //remove hash/querystring
    .replace(/[#?].*/gim, '');

const getQs = ({
  headers,
}: {
  headers: { get: (s: string) => string | null };
}) => {
  let query: Record<string, string> = {};
  const qraw =
    headers.get('x-invoke-query') || headers.get('x-invoke-query2') || '{}';
  try {
    if (qraw.startsWith('?')) {
      query = stringToObject(qraw.substring(1), '=', '&');
    } else {
      query = JSON.parse(decodeURIComponent(qraw));
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    info('bad qs passed=', qraw);
  }
  if (Object.keys(query).length === 0) {
    return { search: '', query: {} };
  }
  const search = '?' + objectToString(query, '=', '&');

  return { search, query };
};

export interface IGetNextAppRequest {
  url: URLLite;
  query: Record<string, string>;
  userAgent: string;
  lang: TLang;
  cookieDocument: string;
}

/** get request details
 * next13 server only */
export const getNextAppRequest = async ({
  headers,
}: {
  headers: NextHeaders;
}): Promise<IGetNextAppRequest> => {
  const hv = await headers;
  const userAgent = hv.get('user-agent')?.toLowerCase() ?? '';
  const host = hv.get('host') ?? '';
  const pathname = getPathName({ headers: hv });

  const protocol =
    host.includes(':443') || !host.includes(':') ? 'https:' : 'http:';

  let url = `${protocol}${host}${pathname}`;

  const { search, query } = getQs({ headers: hv });
  if (search) {
    url += search;
  }

  const cookieDocument = hv.get('cookie') || '';

  return {
    url: stripUrl(new URL(url)),
    query,
    userAgent,
    lang: getRenderLanguage(host),
    cookieDocument,
  };
};
