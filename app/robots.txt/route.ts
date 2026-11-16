import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

/**
 * robots.txt com Content-Signal (https://contentsignals.org):
 * buscadores e respostas de IA podem usar o conteúdo; treinar modelos de IA, não.
 */
export function GET() {
  const body = [
    'User-agent: *',
    'Content-Signal: search=yes, ai-input=yes, ai-train=no',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    `Host: ${SITE_URL}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
