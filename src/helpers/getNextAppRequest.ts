import type { TLang } from 'ag-common/dist/common/helpers/i18n';
import { info } from 'ag-common/dist/common/helpers/log';
import { objectToString } from 'ag-common/dist/common/helpers/object';
import { stripUrl } from 'ag-common/dist/common/helpers/string';
import type { URLLite } from 'ag-common/dist/ui/helpers/routes';
import { getRenderLanguage } from 'ag-common/dist/ui/helpers/routes';

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
    headers.get('x-invoke-query') ?? headers.get('x-invoke-query2') ?? '{}';
  try {
    query = JSON.parse(decodeURIComponent(qraw));
  } catch (e) {
    info('bad qs passed=', qraw);
  }
  if (Object.keys(query).length === 0) {
    return { search: '', query: {} };
  }
  const search = '?' + objectToString(query, '=', '&');

  return { search, query };
};

/** get request details
 * next13 server only */
export const getNextAppRequest = ({
  headers,
}: {
  headers: { get: (s: string) => string | null };
}): {
  url: URLLite;
  query: Record<string, string>;
  userAgent: string;
  lang: TLang;
  cookieDocument: string;
} => {
  const userAgent = headers.get('user-agent')?.toLowerCase() ?? '';
  const host = headers.get('host') ?? '';
  const pathname = getPathName({ headers });

  const protocol =
    host.includes(':443') || !host.includes(':') ? 'https:' : 'http:';

  let url = `${protocol}${host}${pathname}`;

  const { search, query } = getQs({ headers });
  if (search) {
    url += search;
  }

  const cookieDocument = headers.get('cookie') || '';

  return {
    url: stripUrl(new URL(url)),
    query,
    userAgent,
    lang: getRenderLanguage(host),
    cookieDocument,
  };
};
