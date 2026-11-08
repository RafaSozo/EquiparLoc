import { NextRequest, NextResponse } from 'next/server';
import { incrementPostViews, getAllBlogPosts } from '@/lib/db';
import { clientIp, hitLimit } from '@/lib/rate-limit';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const posts = getAllBlogPosts();
    const post = posts.find((p) => p.id === id || p.slug === id);

    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
    }

    // Conta no máximo 1 visualização por visitante por artigo a cada 6 horas
    // (recarregar a página ou um robô repetindo o pedido não infla o número)
    const { limited } = hitLimit(`views:${post.slug}:${clientIp(req)}`, 1, 6 * 60 * 60_000);
    const views = limited ? post.viewsCount ?? post.views ?? 0 : incrementPostViews(post.slug);
    return NextResponse.json({ views });
  } catch (error) {
    console.error('Error incrementing views:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
