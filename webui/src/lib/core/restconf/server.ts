import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const DEFAULT_API_ORIGIN = 'http://localhost:15000';
const DOCKER_DISCOVERY_TTL_MS = 5_000;

const execFileAsync = promisify(execFile);

let cachedDockerOrigins: string[] = [];
let dockerOriginsCachedAt = 0;

function canHaveBody(method: string): boolean {
  return method !== 'GET' && method !== 'HEAD';
}

async function readProxyBody(request: Request): Promise<ArrayBuffer | undefined> {
  if (!canHaveBody(request.method)) {
    return undefined;
  }

  const body = await request.arrayBuffer();
  return body.byteLength > 0 ? body : undefined;
}

export function getApiOrigin(): string {
  return process.env.ORCHESTRON_API_ORIGIN ?? DEFAULT_API_ORIGIN;
}

function uniqueOrigins(origins: string[]): string[] {
  return Array.from(new Set(origins.filter(Boolean)));
}

function scoreDockerContainer(name: string): number {
  if (name.startsWith('sorespo-') && name.endsWith('-otron')) {
    return 0;
  }

  if (name.endsWith('-otron')) {
    return 1;
  }

  if (name.includes('otron')) {
    return 2;
  }

  return 3;
}

async function discoverDockerApiOrigins(): Promise<string[]> {
  const now = Date.now();

  if (now - dockerOriginsCachedAt < DOCKER_DISCOVERY_TTL_MS) {
    return cachedDockerOrigins;
  }

  try {
    const { stdout } = await execFileAsync(
      'docker',
      ['ps', '--format', '{{.Names}}\t{{.Ports}}'],
      {
        timeout: 1_500
      }
    );

    const origins = stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, ports = ''] = line.split('\t');
        const match = ports.match(/(?:0\.0\.0\.0|\[::\]):(\d+)->80\/tcp/);

        if (!match) {
          return null;
        }

        return {
          name,
          origin: `http://127.0.0.1:${match[1]}`
        };
      })
      .filter((entry): entry is { name: string; origin: string } => entry !== null)
      .filter(({ name }) => name.includes('otron'))
      .sort((left, right) => scoreDockerContainer(left.name) - scoreDockerContainer(right.name))
      .map(({ origin }) => origin);

    cachedDockerOrigins = uniqueOrigins(origins);
    dockerOriginsCachedAt = now;
    return cachedDockerOrigins;
  } catch {
    cachedDockerOrigins = [];
    dockerOriginsCachedAt = now;
    return [];
  }
}

async function getApiOrigins(): Promise<string[]> {
  const configuredOrigin = process.env.ORCHESTRON_API_ORIGIN;
  const dockerOrigins = await discoverDockerApiOrigins();

  return uniqueOrigins([
    configuredOrigin ?? '',
    ...dockerOrigins,
    DEFAULT_API_ORIGIN
  ]);
}

export async function proxyRequest(request: Request, targetPath: string, search = ''): Promise<Response> {
  const headers = new Headers(request.headers);
  headers.delete('connection');
  headers.delete('content-length');
  headers.delete('host');

  const body = await readProxyBody(request);
  let lastError: unknown = null;

  for (const origin of await getApiOrigins()) {
    const targetUrl = new URL(targetPath.startsWith('/') ? targetPath : `/${targetPath}`, origin);
    targetUrl.search = search;

    try {
      const upstream = await fetch(targetUrl, {
        method: request.method,
        headers,
        body,
        redirect: 'manual'
      });

      const responseHeaders = new Headers(upstream.headers);
      responseHeaders.delete('connection');
      responseHeaders.delete('content-length');

      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: responseHeaders
      });
    } catch (error) {
      lastError = error;
    }
  }

  return Response.json(
    {
      message: lastError instanceof Error ? lastError.message : 'Failed to reach upstream API'
    },
    {
      status: 502
    }
  );
}
