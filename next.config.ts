import type {NextConfig} from 'next';

const isDev = process.env.NODE_ENV !== 'production';

/*
 * Política de conteúdo: o site só carrega scripts, estilos e fontes de si mesmo.
 * 'unsafe-inline' em script é exigido pelo Next.js para a hidratação (sem nonce);
 * 'unsafe-eval' e ws: só no modo de desenvolvimento.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
  // Mapa do Google na página Localização (só carrega quando o visitante clica)
  'frame-src https://www.google.com https://maps.google.com',
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Painel e APIs nunca ficam em cache compartilhado
      { source: '/admin/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      // (as fotos de /api/midia ficam fora: elas podem ficar em cache)
      { source: '/api/:path((?!midia/).*)', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
  // Links antigos /equipamentos/... passam a abrir a página do catálogo
  async redirects() {
    return [
      { source: '/equipamentos/:slug', destination: '/catalogo/:slug', permanent: true },
      { source: '/equipamentos', destination: '/locacao', permanent: true },
      // Menu novo: "Sobre" virou "Empresa"
      { source: '/sobre', destination: '/empresa', permanent: true },
    ];
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
