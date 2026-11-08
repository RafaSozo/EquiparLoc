import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { timingSafeEqual, createHash } from 'crypto';

/*
 * Login do painel administrativo.
 *
 * Usuários e senhas ficam SOMENTE em variáveis de ambiente (arquivo .env.local
 * no computador / painel da hospedagem em produção), nunca no código:
 *
 *   ADMIN_EMAIL, ADMIN_PASSWORD          -> administrador (acesso total)
 *   OPERADOR_EMAIL, OPERADOR_PASSWORD    -> operador comercial (opcional)
 *   NEXTAUTH_SECRET                      -> chave que assina a sessão
 */

const IS_PROD = process.env.NODE_ENV === 'production';

const ADMIN_PERMISSIONS = [
  'fleet_view',
  'fleet_edit',
  'fleet_create',
  'fleet_delete',
  'quotes_manage',
  'blog_manage',
  'settings_manage',
  'metrics_view',
];
const OPERADOR_PERMISSIONS = ['fleet_view', 'fleet_edit', 'quotes_manage', 'blog_view', 'metrics_view'];

interface ConfiguredUser {
  email: string;
  password: string;
  user: {
    id: string;
    name: string;
    role: 'admin' | 'operador';
    title: string;
    permissions: string[];
  };
}

function configuredUsers(): ConfiguredUser[] {
  const users: ConfiguredUser[] = [];
  const env = process.env;
  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    users.push({
      email: env.ADMIN_EMAIL.trim().toLowerCase(),
      password: env.ADMIN_PASSWORD,
      user: {
        id: 'usr_admin',
        name: env.ADMIN_NAME || 'Administrador',
        role: 'admin',
        title: 'Administrador',
        permissions: ADMIN_PERMISSIONS,
      },
    });
  }
  if (env.OPERADOR_EMAIL && env.OPERADOR_PASSWORD) {
    users.push({
      email: env.OPERADOR_EMAIL.trim().toLowerCase(),
      password: env.OPERADOR_PASSWORD,
      user: {
        id: 'usr_operador',
        name: env.OPERADOR_NAME || 'Operador comercial',
        role: 'operador',
        title: 'Atendimento comercial',
        permissions: OPERADOR_PERMISSIONS,
      },
    });
  }
  return users;
}

/** Compara senhas em tempo constante (evita descobrir a senha medindo o tempo de resposta). */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/*
 * Limite de tentativas (proteção contra força bruta), em duas camadas:
 * - 5 erros por e-mail + IP a cada 15 minutos: trava quem está tentando,
 *   sem permitir que um estranho bloqueie o administrador de outro lugar;
 * - 30 erros por e-mail a cada hora, somando todos os IPs: freia ataques distribuídos.
 */
const PER_IP = { max: 5, windowMs: 15 * 60 * 1000 };
const PER_ACCOUNT = { max: 30, windowMs: 60 * 60 * 1000 };
const failedAttempts = new Map<string, { count: number; first: number }>();

function isLocked(key: string, rule: { max: number; windowMs: number }): boolean {
  const entry = failedAttempts.get(key);
  if (!entry) return false;
  if (Date.now() - entry.first > rule.windowMs) {
    failedAttempts.delete(key);
    return false;
  }
  return entry.count >= rule.max;
}

function registerFailure(key: string, rule: { windowMs: number }) {
  const entry = failedAttempts.get(key);
  if (!entry || Date.now() - entry.first > rule.windowMs) failedAttempts.set(key, { count: 1, first: Date.now() });
  else entry.count += 1;
}

/** IP do visitante a partir dos cabeçalhos do pedido de login (mesma regra de lib/rate-limit). */
function loginIp(headers: Record<string, unknown> | undefined): string {
  const get = (name: string) => {
    const v = headers?.[name];
    return typeof v === 'string' ? v : Array.isArray(v) ? String(v[0]) : '';
  };
  const trusted = process.env.TRUSTED_IP_HEADER?.trim().toLowerCase();
  if (trusted) return get(trusted).split(',')[0].trim() || 'desconhecido';
  const real = get('x-real-ip').trim();
  if (real) return real;
  const parts = get('x-forwarded-for').split(',').map((p) => p.trim()).filter(Boolean);
  return parts[parts.length - 1] || 'desconhecido';
}

function resolveSecret(): string | undefined {
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret && !secret.includes('equipar-360-jwt-secret')) return secret;
  if (IS_PROD) {
    // Em produção a chave é obrigatória: sem ela qualquer um poderia forjar uma sessão.
    console.error('[auth] Defina NEXTAUTH_SECRET nas variáveis de ambiente. O login do painel está bloqueado.');
    return undefined;
  }
  return 'dev-only-secret-troque-em-producao';
}

/** Em produção, avisa no registro do servidor sobre configurações que deixam o site vulnerável. */
function checkProductionConfig() {
  if (!IS_PROD) return;
  const url = process.env.NEXTAUTH_URL || '';
  const avisos: string[] = [];
  if (!url) avisos.push('NEXTAUTH_URL não definida (use https://equiparloc.com.br).');
  else if (!url.startsWith('https://') || /localhost|127\.0\.0\.1/.test(url))
    avisos.push(`NEXTAUTH_URL="${url}" deve ser o endereço público com https.`);
  if (!process.env.TRUSTED_IP_HEADER)
    avisos.push('TRUSTED_IP_HEADER não definida: o limite de envios dos formulários pode ser burlado.');
  for (const a of avisos) console.error(`[segurança] ${a}`);
}
checkProductionConfig();

export const AUTH_LOCKED_MESSAGE = 'Muitas tentativas. Aguarde 15 minutos e tente de novo.';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'EquiparLoc',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials, req) {
        const email = credentials?.email?.trim().toLowerCase() || '';
        const password = credentials?.password || '';
        if (!email || !password) return null;

        const ipKey = `ip:${email}:${loginIp(req?.headers as Record<string, unknown> | undefined)}`;
        const accountKey = `conta:${email}`;
        if (isLocked(ipKey, PER_IP) || isLocked(accountKey, PER_ACCOUNT)) {
          throw new Error(AUTH_LOCKED_MESSAGE);
        }

        const match = configuredUsers().find((u) => u.email === email && safeEqual(u.password, password));
        if (!match) {
          registerFailure(ipKey, PER_IP);
          registerFailure(accountKey, PER_ACCOUNT);
          return null;
        }

        failedAttempts.delete(ipKey);
        return { ...match.user, email: match.email };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 12 * 60 * 60, // 12 horas
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.title = user.title;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || '';
        // Sem papel definido, trata como operador (menor privilégio)
        session.user.role = token.role === 'admin' ? 'admin' : 'operador';
        session.user.title = (token.title as string) || '';
        session.user.permissions = (token.permissions as string[]) || [];
      }
      return session;
    },
  },
  secret: resolveSecret(),
  pages: {
    signIn: '/admin',
    error: '/admin',
  },
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}

/** Indica se há algum usuário configurado (para orientar na tela de login). */
export function hasConfiguredUsers(): boolean {
  return configuredUsers().length > 0;
}
