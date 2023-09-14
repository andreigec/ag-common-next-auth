import { objectToString } from 'ag-common/dist/common/helpers/object';
import { stripUrl } from 'ag-common/dist/common/helpers/string';
import { getRenderLanguage } from 'ag-common/dist/ui/helpers/routes';
/** get request details
 * next13 server only */
export const getNextAppRequest = ({
  headers,
}: {
  headers: { get: (s: string) => string | null };
}) => {
  let query: Record<string, string> = {};
  if (headers.get('x-invoke-query')) {
    query = JSON.parse(
      decodeURIComponent(headers.get('x-invoke-query') ?? '{}'),
    );
  }

  const userAgent = headers.get('user-agent')?.toLowerCase() ?? '';
  const host = headers.get('host') ?? '';
  const pathname = headers.get('x-invoke-path') ?? '/';
  const protocol =
    host.includes(':443') || !host.includes(':') ? 'https:' : 'http:';

  let url = `${protocol}${host}${pathname}`;
  if (Object.keys(query).length > 0) {
    const qs = '?' + objectToString(query, '=', '&');
    url += qs;
  }

  const cookieDocument = headers.get('cookie');

  return {
    url: stripUrl(new URL(url)),
    query,
    userAgent,
    lang: getRenderLanguage(host),
    cookieDocument,
  };
};
