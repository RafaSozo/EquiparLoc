import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { clientIp, hitLimit, tooManyRequests, readJsonLimited, cleanText, tooLong, EMAIL_RE, FIELD_LIMITS as L } from '@/lib/rate-limit';
import { getAllQuotes, createQuote } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAuth({ permission: 'quotes_manage' });
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase();

    let list = getAllQuotes();

    if (status && status !== 'todos') {
      list = list.filter((q) => q.status === status);
    }

    if (search) {
      list = list.filter(
        (q) =>
          q.customerName.toLowerCase().includes(search) ||
          q.companyName?.toLowerCase().includes(search) ||
          q.equipmentName.toLowerCase().includes(search) ||
          q.protocol.toLowerCase().includes(search) ||
          q.email.toLowerCase().includes(search) ||
          q.phone.includes(search)
      );
    }

    return NextResponse.json({ quotes: list, total: list.length });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json({ error: 'Erro ao buscar orçamentos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Até 5 pedidos a cada 10 minutos por visitante
    const limit = hitLimit(`orcamento:${clientIp(req)}`, 5, 10 * 60_000);
    if (limit.limited) {
      return tooManyRequests(
        'Recebemos vários pedidos seguidos deste endereço. Aguarde alguns minutos ou fale pelo telefone (31) 3418-1500.',
        limit.retryAfterSec
      );
    }

    const parsed = await readJsonLimited<Record<string, unknown>>(req, 16 * 1024);
    if (parsed.error) return parsed.error;
    const body = parsed.body;

    const longField = (
      [
        ['customerName', L.name, 'nome'],
        ['companyName', L.company, 'empresa'],
        ['email', L.email, 'e-mail'],
        ['phone', L.phone, 'telefone'],
        ['equipmentName', L.equipment, 'equipamento'],
        ['siteLocation', L.location, 'local da obra'],
        ['rentalPeriod', L.period, 'período'],
        ['message', L.message, 'mensagem'],
      ] as const
    ).find(([key, max]) => tooLong(body[key], max));
    if (longField) {
      return NextResponse.json(
        { error: `O campo ${longField[2]} passou do limite de ${longField[1]} caracteres.` },
        { status: 400 }
      );
    }

    const customerName = cleanText(body.customerName, L.name);
    const email = cleanText(body.email, L.email);
    const phone = cleanText(body.phone, L.phone);
    const equipmentName = cleanText(body.equipmentName, L.equipment);
    const siteLocation = cleanText(body.siteLocation, L.location);

    // Validation
    if (!customerName) {
      return NextResponse.json({ error: 'O nome do solicitante é obrigatório' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'E-mail corporativo válido é obrigatório' }, { status: 400 });
    }
    if (phone.replace(/\D/g, '').length < 10) {
      return NextResponse.json({ error: 'Telefone com DDD válido é obrigatório' }, { status: 400 });
    }
    if (!equipmentName) {
      return NextResponse.json({ error: 'Identificação do equipamento é obrigatória' }, { status: 400 });
    }
    if (!siteLocation) {
      return NextResponse.json({ error: 'Local da obra / entrega é obrigatório' }, { status: 400 });
    }

    const created = createQuote({
      customerName,
      companyName: cleanText(body.companyName, L.company),
      email,
      phone,
      equipmentId: cleanText(body.equipmentId, 60),
      equipmentName,
      rentalPeriod: cleanText(body.rentalPeriod, L.period) || 'Mensal (30 dias)',
      siteLocation,
      needsOperator: Boolean(body.needsOperator),
      needsTransport: Boolean(body.needsTransport),
      message: cleanText(body.message, L.message),
      status: 'novo',
    });

    // Ao visitante, só a confirmação (sem devolver o histórico interno do CRM)
    return NextResponse.json({ id: created.id, protocol: created.protocol, status: created.status }, { status: 201 });
  } catch (error) {
    console.error('Error submitting quote:', error);
    return NextResponse.json({ error: 'Falha ao processar solicitação de orçamento' }, { status: 500 });
  }
}