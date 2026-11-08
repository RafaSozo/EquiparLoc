import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { updateQuoteStatus, deleteQuote, getDatabase } from '@/lib/db';
import { QuoteStatus } from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth({ permission: 'quotes_manage' });
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const db = getDatabase();
    const item = db.quotes.find((q) => q.id === id);
    if (!item) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth({ permission: 'quotes_manage' });
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, noteText, author } = body;

    const validStatuses: QuoteStatus[] = ['novo', 'em_atendimento', 'proposta_enviada', 'concluido', 'perdido'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }

    const updated = updateQuoteStatus(id, status, noteText, author || 'Atendente');
    if (!updated) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating quote:', error);
    return NextResponse.json({ error: 'Erro ao atualizar orçamento' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth({ adminOnly: true });
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const success = deleteQuote(id);
    if (!success) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Orçamento removido com sucesso' });
  } catch (error) {
    console.error('Error deleting quote:', error);
    return NextResponse.json({ error: 'Erro ao excluir orçamento' }, { status: 500 });
  }
}
