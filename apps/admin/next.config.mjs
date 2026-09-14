import { securityHeaders } from '@dealith/security/public';
export default {
  poweredByHeader: false,
  output: 'standalone',
  transpilePackages: ['@dealith/ui', '@dealith/contracts', '@dealith/config', '@dealith/security'],
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders(process.env.NODE_ENV === 'production') }];
  },
};
