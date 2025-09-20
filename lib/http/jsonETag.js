// lib/http/jsonETag.js
import crypto from 'node:crypto';

export function makeETag(bodyString) {
  return '"' + crypto.createHash('sha1').update(bodyString).digest('hex') + '"';
}

export function maybeNotModified(request, etag) {
  const incoming = request.headers.get('if-none-match');
  return incoming && incoming === etag;
}

export function jsonWithETag(data, { status = 200, headers = {} } = {}) {
  const body = JSON.stringify(data);
  const etag = makeETag(body);
  return new Response(body, {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'private, max-age=0, must-revalidate',
      etag,
      ...headers
    }
  });
}