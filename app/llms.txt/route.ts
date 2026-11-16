import { buildLlmsTxt } from '@/lib/agent-content';

export const dynamic = 'force-dynamic';

/** Resumo do site para assistentes de IA (https://llmstxt.org). */
export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
