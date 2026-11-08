import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { clientIp, hitLimit, tooManyRequests, readJsonLimited, cleanText, tooLong, EMAIL_RE, FIELD_LIMITS as L } from '@/lib/rate-limit';
import { addPostComment, updateCommentStatus, deletePostComment, getAllBlogPosts } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Até 3 comentários a cada 10 minutos por visitante
    const limit = hitLimit(`comentario:${clientIp(req)}`, 3, 10 * 60_000);
    if (limit.limited) {
      return tooManyRequests('Você enviou vários comentários seguidos. Aguarde alguns minutos e tente de novo.', limit.retryAfterSec);
    }

    const parsed = await readJsonLimited<Record<string, unknown>>(req, 8 * 1024);
    if (parsed.error) return parsed.error;
    const raw = parsed.body;

    if (tooLong(raw.authorName, L.name) || tooLong(raw.authorEmail, L.email)) {
      return NextResponse.json({ error: 'Nome ou e-mail longo demais.' }, { status: 400 });
    }
    if (tooLong(raw.content, L.comment)) {
      return NextResponse.json({ error: `O comentário pode ter no máximo ${L.comment} caracteres.` }, { status: 400 });
    }
    const body = {
      authorName: cleanText(raw.authorName, L.name),
      authorEmail: cleanText(raw.authorEmail, L.email),
      content: cleanText(raw.content, L.comment),
    };

    if (!body.authorName) {
      return NextResponse.json({ error: 'Informe seu nome completo' }, { status: 400 });
    }
    if (!EMAIL_RE.test(body.authorEmail)) {
      return NextResponse.json({ error: 'Informe um e-mail válido' }, { status: 400 });
    }
    if (body.content.length < 5) {
      return NextResponse.json({ error: 'O comentário deve conter pelo menos 5 caracteres' }, { status: 400 });
    }

    const posts = getAllBlogPosts();
    const post = posts.find((p) => p.id === id || p.slug === id);
    if (!post || (post.status && post.status !== 'published')) {
      return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 });
    }

    const comment = addPostComment(post.slug, {
      authorName: body.authorName,
      authorEmail: body.authorEmail,
      content: body.content,
    });

    return NextResponse.json({
      success: true,
      message: 'Comentário enviado para moderação com sucesso!',
      comment: comment ? { ...comment, authorEmail: '' } : comment,
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Erro ao processar comentário' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth({ permission: 'blog_manage' });
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();
    const { commentId, status, reply, replyAuthor } = body;

    if (!commentId || !status) {
      return NextResponse.json({ error: 'ID do comentário e status são obrigatórios' }, { status: 400 });
    }

    const updated = updateCommentStatus(id, commentId, status, reply, replyAuthor);
    if (!updated) {
      return NextResponse.json({ error: 'Comentário não encontrado' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Erro ao atualizar comentário' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth({ permission: 'blog_manage' });
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'commentId é obrigatório' }, { status: 400 });
    }

    const success = deletePostComment(id, commentId);
    if (!success) {
      return NextResponse.json({ error: 'Comentário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Comentário excluído' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Erro ao excluir comentário' }, { status: 500 });
  }
}
