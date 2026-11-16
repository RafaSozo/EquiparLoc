import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { readJsonLimited } from '@/lib/rate-limit';
import { updateContactMessage, deleteContactMessage } from '@/lib/db';
import { CONTACT_STATUS_LABELS, type ContactStatus } from '@/lib/types';

type Ctx = { params: Promise<{ id: string }> };

/** Muda a situação da mensagem ou a anotação interna. */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const auth = await requireAuth({ permission: 'quotes_manage' });
  if (auth.error) return auth.error;

  const parsed = await readJsonLimited<Record<string, unknown>>(req, 8 * 1024);
  if (parsed.error) return parsed.error;
  const { status, note } = parsed.body;

  if (status !== undefined && !(typeof status === 'string' && status in CONTACT_STATUS_LABELS)) {
    return NextResponse.json({ error: 'Situação inválida.' }, { status: 400 });
  }
  const { id } = await params;
  const updated = updateContactMessage(id, {
    status: status as ContactStatus | undefined,
    note: typeof note === 'string' ? note.trim().slice(0, 2000) : undefined,
  });
  if (!updated) return NextResponse.json({ error: 'Mensagem não encontrada.' }, { status: 404 });
  return NextResponse.json(updated);
}

/** Exclui a mensagem (dados pessoais: só o administrador). */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const auth = await requireAuth({ adminOnly: true });
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!deleteContactMessage(id)) return NextResponse.json({ error: 'Mensagem não encontrada.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
