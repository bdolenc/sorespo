import type { RestconfRequestOptions } from '$lib/core/restconf/proxy-types';

const RESTCONF_BASE = '/api/restconf';

type Fetch = typeof fetch;

function normalizePath(path: string): string {
  return path.replace(/^\/+/, '');
}

async function readResponse<T>(response: Response, readBody = true): Promise<T> {
  if (!response.ok) {
    const message = (await response.text()) || response.statusText;
    throw new Error(`RESTCONF ${response.status}: ${message}`);
  }

  if (!readBody) {
    return null as T;
  }

  const text = await response.text();
  if (!text) {
    return null as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

export async function restconfRequest<T>(
  path: string,
  init: RequestInit & RestconfRequestOptions = {},
  fetchFn: Fetch = fetch
): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.accept) {
    headers.set('accept', init.accept);
  } else if (!headers.has('accept')) {
    headers.set('accept', 'application/yang-data+json');
  }

  if (init.contentType) {
    headers.set('content-type', init.contentType);
  }

  const response = await fetchFn(`${RESTCONF_BASE}/${normalizePath(path)}`, {
    ...init,
    headers
  });

  return readResponse<T>(response, init.readBody ?? true);
}

export function restconfGetJson<T>(path: string, fetchFn: Fetch = fetch): Promise<T> {
  return restconfRequest<T>(path, {
    method: 'GET',
    accept: 'application/yang-data+json'
  }, fetchFn);
}

export function restconfPutJson<T>(path: string, body: unknown): Promise<T> {
  return restconfRequest<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
    accept: 'application/yang-data+json',
    contentType: 'application/yang-data+json',
    readBody: false
  });
}

export function restconfDelete(path: string): Promise<unknown> {
  return restconfRequest(path, {
    method: 'DELETE',
    accept: 'application/yang-data+json',
    readBody: false
  });
}

export function getListEntryPath(root: string, key: string): string {
  return `${normalizePath(root)}=${encodeURIComponent(key)}`;
}
