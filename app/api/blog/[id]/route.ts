import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, optionalAuth } from '@/lib/api-auth';
import { toPublicPost, isPublished } from '@/lib/public-data';
import { getAllBlogPosts, saveBlogPost, deleteBlogPost } from '@/lib/db';
import { BlogPost } from '@/lib/types';
import { analyzePostSeo, autoFixPostSeo, generateCleanSlug } from '@/lib/seo-optimizer';
import { generateSeoWithGemini } from '@/lib/gemini-seo';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const posts = getAllBlogPosts();
    const post = posts.find((p) => p.id === id || p.slug === id);

    const loggedIn = Boolean(await optionalAuth());
    if (!post || (!loggedIn && !isPublished(post))) {
      return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 });
    }

    return NextResponse.json(loggedIn ? post : toPublicPost(post));
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const posts = getAllBlogPosts();
    const existing = posts.find((p) => p.id === id);

    if (!existing) {
      return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 });
    }

    const body = await req.json();

    // Check if user requested 1-click automatic SEO optimization
    if (body.action === 'auto_fix_seo') {
      const fixed = autoFixPostSeo({
        ...existing,
        ...body.post,
      });
      const saved = saveBlogPost(fixed);
      return NextResponse.json(saved);
    }

    // Check if user requested Gemini AI SEO optimization
    if (body.action === 'auto_gemini_seo' || (body.status === 'draft' && body.autoGenerateWithGemini)) {
      const aiResult = await generateSeoWithGemini({
        title: body.title || existing.title,
        content: body.content || existing.content,
        summary: body.summary || existing.summary,
        category: body.category || existing.category,
        image: body.image || existing.image,
        imageAlt: body.imageAlt || existing.imageAlt,
        existingTags: body.tags || existing.tags,
      });

      const updatedTitle = body.title || existing.title;
      const updatedSlug = body.slug ? body.slug : generateCleanSlug(updatedTitle);
      const updatedContent = body.content || existing.content;
      const updatedSummary = aiResult.summary || body.summary || existing.summary;
      const updatedImageAlt = aiResult.imageAlt;
      const updatedTags = Array.from(new Set([...(body.tags || existing.tags || []), ...aiResult.suggestedTags]));

      const seoAnalysis = analyzePostSeo({
        title: updatedTitle,
        slug: updatedSlug,
        content: updatedContent,
        summary: updatedSummary,
        focusKeyword: aiResult.focusKeyword,
        metaTitle: aiResult.metaTitle,
        metaDescription: aiResult.metaDescription,
        imageAlt: updatedImageAlt,
      });

      const updatedPost: BlogPost = {
        ...existing,
        ...body,
        id,
        title: updatedTitle,
        slug: updatedSlug,
        content: updatedContent,
        summary: updatedSummary,
        imageAlt: updatedImageAlt,
        tags: updatedTags,
        seo: seoAnalysis,
        updatedAt: new Date().toISOString(),
      };

      const saved = saveBlogPost(updatedPost);
      return NextResponse.json(saved);
    }

    // Normal update
    const wordCount = (body.content || existing.content).trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(wordCount / 200));
    const readTime = `${minutes} min de leitura`;

    const updatedTitle = body.title !== undefined ? body.title : existing.title;
    const updatedSlug = body.slug ? body.slug : generateCleanSlug(updatedTitle);
    const updatedContent = body.content !== undefined ? body.content : existing.content;
    const updatedSummary = body.summary !== undefined ? body.summary : existing.summary;
    const updatedImageAlt = body.imageAlt !== undefined ? body.imageAlt : existing.imageAlt;

    const seoAnalysis = analyzePostSeo({
      title: updatedTitle,
      slug: updatedSlug,
      content: updatedContent,
      summary: updatedSummary,
      focusKeyword: body.seo?.focusKeyword ?? existing.seo?.focusKeyword ?? '',
      metaTitle: body.seo?.metaTitle ?? existing.seo?.metaTitle ?? `${updatedTitle.slice(0, 50)} | EquiparLoc`,
      metaDescription: body.seo?.metaDescription ?? existing.seo?.metaDescription ?? updatedSummary,
      imageAlt: updatedImageAlt,
    });

    const updatedPost: BlogPost = {
      ...existing,
      ...body,
      id,
      title: updatedTitle,
      slug: updatedSlug,
      content: updatedContent,
      summary: updatedSummary,
      readTime,
      imageAlt: updatedImageAlt,
      seo: seoAnalysis,
      updatedAt: new Date().toISOString(),
    };

    const saved = saveBlogPost(updatedPost);
    return NextResponse.json(saved);
  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json({ error: 'Erro ao atualizar artigo' }, { status: 500 });
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
    const success = deleteBlogPost(id);
    if (!success) {
      return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Artigo excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json({ error: 'Erro ao excluir artigo' }, { status: 500 });
  }
}
