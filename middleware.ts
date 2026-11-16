import { NextRequest, NextResponse } from 'next/server';

/**
 * Assistentes de IA que pedem "Accept: text/markdown" recebem a página em Markdown
 * (bem menor que o HTML). Navegadores pedem text/html e não passam por aqui.
 */
export function middleware(req: NextRequest) {
  const accept = req.headers.get('accept') || '';
  const { pathname } = req.nextUrl;
  // Só páginas públicas: painel, API e arquivos (com extensão) seguem normais
  const isPage = !/^\/(api|admin)(\/|$)/.test(pathname) && !/\.[a-z0-9]+$/i.test(pathname);
  if (!isPage || !accept.includes('text/markdown')) {
    // Avisa caches que a mesma URL tem versão HTML e Markdown
    const res = NextResponse.next();
    res.headers.set('Vary', 'Accept');
    return res;
  }

  const url = req.nextUrl.clone();
  url.pathname = `/api/markdown${pathname === '/' ? '' : pathname}`;
  const res = NextResponse.rewrite(url);
  res.headers.set('Vary', 'Accept');
  return res;
}

// Arquivos internos do Next.js e imagens não passam pelo middleware
export const config = {
  matcher: ['/((?!_next/static|_next/image|images/).*)'],
};
