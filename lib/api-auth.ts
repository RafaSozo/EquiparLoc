import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { getServerAuthSession } from './auth';

type Guard = { session: Session; error?: undefined } | { session?: undefined; error: NextResponse };

/**
 * Exige login no painel para acessar a rota da API.
 * Uso:  const auth = await requireAuth(); if (auth.error) return auth.error;
 * Com `{ adminOnly: true }`, só o administrador passa (operador recebe 403).
 */
export async function requireAuth(options: { adminOnly?: boolean; permission?: string } = {}): Promise<Guard> {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: 'Faça login no painel para continuar.' }, { status: 401 }),
    };
  }
  if (options.adminOnly && session.user.role !== 'admin') {
    return {
      error: NextResponse.json({ error: 'Apenas o administrador pode fazer esta ação.' }, { status: 403 }),
    };
  }
  // Permissão específica do perfil (o administrador tem todas)
  if (
    options.permission &&
    session.user.role !== 'admin' &&
    !(session.user.permissions || []).includes(options.permission)
  ) {
    return {
      error: NextResponse.json({ error: 'Seu perfil não tem permissão para esta ação.' }, { status: 403 }),
    };
  }
  return { session };
}

/** Retorna a sessão, se houver (para rotas públicas que mostram mais dados a quem está logado). */
export async function optionalAuth(): Promise<Session | null> {
  return getServerAuthSession();
}
