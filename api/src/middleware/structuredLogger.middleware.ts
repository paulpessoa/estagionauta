import type { MiddlewareHandler } from 'hono';

interface HttpRequestLog {
  requestMethod: string;
  requestUrl: string;
  status?: number;
  userAgent?: string;
  remoteIp: string;
  latency?: string;
}

interface GCPStructuredLog {
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  time: string;
  message: string;
  httpRequest?: HttpRequestLog;
  userId?: string;
  error?: string;
}

const getClientIp = (headers: Headers): string => {
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  return 'unknown';
};

export const structuredLogger = (): MiddlewareHandler => {
  return async (c, next) => {
    const start = Date.now();
    const { method, url } = c.req;
    const userAgent = c.req.header('user-agent');
    const remoteIp = getClientIp(c.req.raw.headers);

    await next();

    const duration = Date.now() - start;
    const status = c.res.status;
    const latencyString = `${(duration / 1000).toFixed(3)}s`;

    // Try to retrieve user information if auth middleware has run
    let userId: string | undefined;
    try {
      const user = c.get('user');
      if (user && typeof user === 'object' && 'id' in user) {
        userId = user.id;
      }
    } catch {
      // Ignored if c.get('user') is not set yet
    }

    const severity = status >= 500 ? 'ERROR' : status >= 400 ? 'WARNING' : 'INFO';

    const logEntry: GCPStructuredLog = {
      severity,
      time: new Date().toISOString(),
      message: `${method} ${c.req.path} ${status} - ${duration}ms`,
      httpRequest: {
        requestMethod: method,
        requestUrl: url,
        status,
        userAgent,
        remoteIp,
        latency: latencyString,
      },
    };

    if (userId) {
      logEntry.userId = userId;
    }

    if (c.error) {
      logEntry.error = c.error.stack || c.error.message;
    }

    // Google Cloud Run automatically captures stdout as structured logs when output as JSON
    console.log(JSON.stringify(logEntry));
  };
};
