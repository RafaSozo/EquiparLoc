import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { generateSeoWithGemini } from '@/lib/gemini-seo';

export async function POST(req: NextRequest) {
  const auth = await requireAuth({ permission: 'blog_manage' });
  if (auth.error) return auth.error;

  try {
    const body = await req.json();

    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json(
        { error: 'Título é obrigatório para gerar metadados com IA' },
        { status: 400 }
      );
    }

    const result = await generateSeoWithGemini({
      title: body.title.trim(),
      content: typeof body.content === 'string' ? body.content : '',
      summary: typeof body.summary === 'string' ? body.summary : undefined,
      category: typeof body.category === 'string' ? body.category : undefined,
      image: typeof body.image === 'string' ? body.image : undefined,
      imageAlt: typeof body.imageAlt === 'string' ? body.imageAlt : undefined,
      existingTags: Array.isArray(body.existingTags) ? body.existingTags : undefined,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in /api/blog/generate-seo:', error);
    return NextResponse.json(
      { error: 'Falha ao processar metadados com IA' },
      { status: 500 }
    );
  }
}
