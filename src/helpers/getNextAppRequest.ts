import type { TLang } from 'ag-common/dist/common/helpers/i18n';
import { objectToString } from 'ag-common/dist/common/helpers/object';
import { stripUrl } from 'ag-common/dist/common/helpers/string';
import type { URLLite } from 'ag-common/dist/ui/helpers/routes';
import { getRenderLanguage } from 'ag-common/dist/ui/helpers/routes';

export const getPathName = ({
  headers,
}: {
  headers: { get: (s: string) => string | null };
}) =>
  (
    headers.get('x-invoke-path') ??
    headers.get('next-url') ??
    headers.get('x-pathname') ??
    '/'
  )
    //remote hashroute/querystring
    .replace(/[#?].*/gim, '');

/** get request details
 * next13 server only */
export const getNextAppRequest = ({
  headers,
  overrides,
}: {
  headers: { get: (s: string) => string | null };
  overrides?: {
    pathname?: string;
  };
}): {
  url: URLLite;
  query: Record<string, string>;
  userAgent: string;
  lang: TLang;
  cookieDocument: string;
} => {
  let query: Record<string, string> = {};
  if (headers.get('x-invoke-query')) {
    query = JSON.parse(
      decodeURIComponent(headers.get('x-invoke-query') ?? '{}'),
    );
  }

  const userAgent = headers.get('user-agent')?.toLowerCase() ?? '';
  const host = headers.get('host') ?? '';
  const pathname = overrides?.pathname ?? getPathName({ headers });

  const protocol =
    host.includes(':443') || !host.includes(':') ? 'https:' : 'http:';

  let url = `${protocol}${host}${pathname}`;
  if (Object.keys(query).length > 0) {
    const qs = '?' + objectToString(query, '=', '&');
    url += qs;
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
