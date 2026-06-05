import type { MiddlewareHandler } from 'hono';

interface RateLimitRule {
  windowMs: number;
  max: number;
}

// In-memory store for request timestamps: key -> number[] (timestamps)
const store = new Map<string, number[]>();

// Cleanup helper to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of store.entries()) {
    // Keep only timestamps that are newer than 15 minutes
    const validTimestamps = timestamps.filter(t => now - t < 15 * 60 * 1000);
    if (validTimestamps.length === 0) {
      store.delete(key);
    } else {
      store.set(key, validTimestamps);
    }
  }
}, 5 * 60 * 1000).unref?.(); // Run every 5 minutes and allow process exit

const getClientIp = (headers: Headers): string => {
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  return 'unknown';
};

export const rateLimiter = (rules: Record<string, RateLimitRule>): MiddlewareHandler => {
  return async (c, next) => {
    const now = Date.now();
    const remoteIp = getClientIp(c.req.raw.headers);
    const path = c.req.path;

    // Check if there is a specific rule for this path prefix, otherwise use default
    let ruleKey = 'default';
    for (const prefix of Object.keys(rules)) {
      if (prefix !== 'default' && path.startsWith(prefix)) {
        ruleKey = prefix;
        break;
      }
    }

    const rule = rules[ruleKey] || rules['default'];
    if (!rule) {
      return await next();
    }

    // Identify client by IP + rule key to limit separately per endpoint type
    const clientKey = `${remoteIp}:${ruleKey}`;

    let timestamps = store.get(clientKey) || [];

    // Filter out timestamps outside the current window
    timestamps = timestamps.filter(t => now - t < rule.windowMs);

    if (timestamps.length >= rule.max) {
      c.res.headers.set('Retry-After', Math.ceil(rule.windowMs / 1000).toString());
      return c.json(
        {
          error: 'Muitas requisições. Por favor, tente novamente mais tarde.',
          retryAfterSeconds: Math.ceil((rule.windowMs - (now - timestamps[0])) / 1000),
        },
        429
      );
    }

    timestamps.push(now);
    store.set(clientKey, timestamps);

    // Set standard rate limit headers
    c.res.headers.set('X-RateLimit-Limit', rule.max.toString());
    c.res.headers.set('X-RateLimit-Remaining', (rule.max - timestamps.length).toString());

    await next();
  };
};
