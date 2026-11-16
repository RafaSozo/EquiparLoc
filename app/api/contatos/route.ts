import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { clientIp, hitLimit, tooManyRequests, readJsonLimited, cleanText, tooLong, EMAIL_RE, FIELD_LIMITS as L } from '@/lib/rate-limit';
import { createContactMessage, getContactMessages, getCompanySettings } from '@/lib/db';

/** Lista as mensagens da página Contato (só equipe logada). */
export async function GET() {
  const auth = await requireAuth({ permission: 'quotes_manage' });
  if (auth.error) return auth.error;
  return NextResponse.json({ messages: getContactMessages() });
}

/** Recebe uma mensagem do formulário da página Contato. */
export async function POST(req: NextRequest) {
  try {
    const phoneHint = getCompanySettings().phone;
    // Até 5 mensagens a cada 10 minutos por visitante
    const limit = hitLimit(`contato:${clientIp(req)}`, 5, 10 * 60_000);
    if (limit.limited) {
      return tooManyRequests(
        `Recebemos várias mensagens seguidas deste endereço. Aguarde alguns minutos ou ligue para ${phoneHint}.`,
        limit.retryAfterSec
      );
    }

    const parsed = await readJsonLimited<Record<string, unknown>>(req, 16 * 1024);
    if (parsed.error) return parsed.error;
    const body = parsed.body;

    const longField = (
      [
        ['name', L.name, 'nome'],
        ['email', L.email, 'e-mail'],
        ['phone', L.phone, 'telefone'],
        ['subject', 80, 'assunto'],
        ['equipment', L.equipment, 'equipamento'],
        ['message', L.message, 'mensagem'],
      ] as const
    ).find(([key, max]) => tooLong(body[key], max));
    if (longField) {
      return NextResponse.json(
        { error: `O campo ${longField[2]} passou do limite de ${longField[1]} caracteres.` },
        { status: 400 }
      );
    }

    const name = cleanText(body.name, L.name);
    const email = cleanText(body.email, L.email);
    const phone = cleanText(body.phone, L.phone);
    const message = cleanText(body.message, L.message);

    if (!name) return NextResponse.json({ error: 'Informe seu nome.' }, { status: 400 });
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 });
    if (phone.replace(/\D/g, '').length < 10) {
      return NextResponse.json({ error: 'Informe um telefone com DDD.' }, { status: 400 });
    }
    if (!message) return NextResponse.json({ error: 'Escreva sua mensagem.' }, { status: 400 });

    const created = createContactMessage({
      name,
      email,
      phone,
      subject: cleanText(body.subject, 80) || 'Contato',
      equipment: cleanText(body.equipment, L.equipment) || undefined,
      message,
    });
    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (error) {
    console.error('Erro ao receber mensagem de contato:', error);
    return NextResponse.json({ error: 'Não foi possível enviar a mensagem.' }, { status: 500 });
  }
}
