export const safeMessages = Object.freeze({
  UNAUTHENTICATED: 'Authentication is required.',
  FORBIDDEN: 'This action is not permitted.',
  CONFLICT: 'The resource changed. Refresh and try again.',
  RATE_LIMITED: 'Too many requests. Please try again later.',
  NOT_FOUND: 'The requested resource was not found.',
  INVALID_REQUEST: 'The request could not be accepted.',
  TEMPORARILY_UNAVAILABLE: 'This service is temporarily unavailable. Please try again.',
  INTERNAL_ERROR: 'The request could not be completed.',
});

export function securityHeaders(production: boolean) {
  return [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ...(production
      ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
      : []),
  ];
}
export function contentSecurityPolicy(nonce: string, production: boolean): string {
  if (!/^[A-Za-z0-9+/_=-]{16,128}$/.test(nonce)) throw new Error('Invalid CSP nonce');
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${production ? '' : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${production ? '' : ' ws: wss:'}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}
