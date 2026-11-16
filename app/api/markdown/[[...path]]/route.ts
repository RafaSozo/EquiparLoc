import { buildPageMarkdown } from '@/lib/agent-content';

export const dynamic = 'force-dynamic';

/**
 * Versão em Markdown de uma página do site. O middleware manda para cá quem pede
 * "Accept: text/markdown" (assistentes de IA); navegadores continuam recebendo HTML.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path: parts = [] } = await params;
  const path = '/' + parts.map((p) => decodeURIComponent(p)).join('/');
  const md = buildPageMarkdown(path);
  return new Response(md ?? '# Página não encontrada\n', {
    status: md ? 200 : 404,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      // A mesma URL também serve HTML: nenhum cache pode misturar as duas versões
      Vary: 'Accept',
      'Cache-Control': 'private, no-store',
    },
  });
}
