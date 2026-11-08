import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, optionalAuth } from '@/lib/api-auth';
import { toPublicPost, isPublished } from '@/lib/public-data';
import { getAllBlogPosts, saveBlogPost } from '@/lib/db';
import { BlogPost } from '@/lib/types';
import { analyzePostSeo, generateCleanSlug } from '@/lib/seo-optimizer';
import { generateSeoWithGemini } from '@/lib/gemini-seo';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const status = searchParams.get('status');
    const query = searchParams.get('q')?.toLowerCase().trim();

    const loggedIn = Boolean(await optionalAuth());
    // Visitantes: só publicados, sem e-mails e sem comentários pendentes
    let posts = loggedIn ? getAllBlogPosts() : getAllBlogPosts().filter(isPublished).map(toPublicPost);

    if (status && status !== 'all') {
      posts = posts.filter((p) => p.status === status);
    }

    if (category && category !== 'Todas') {
      posts = posts.filter((p) => p.category === category);
    }

    if (tag) {
      posts = posts.filter((p) => p.tags && p.tags.includes(tag));
    }

    if (query) {
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.summary.toLowerCase().includes(query) ||
          p.content.toLowerCase().includes(query) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(query)))
      );
    }

    return NextResponse.json({ posts, total: posts.length });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: 'Erro ao buscar artigos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth({ permission: 'blog_manage' });
  if (auth.error) return auth.error;

  try {
    const body = (await req.json()) as Partial<BlogPost> & {
      autoOptimizeSeo?: boolean;
      autoGenerateWithGemini?: boolean;
    };

    if (!body.title || !body.content) {
      return NextResponse.json({ error: 'Título e conteúdo são obrigatórios' }, { status: 400 });
    }

    const id = body.id || `post-${Date.now()}`;
    const slug = body.slug?.trim() ? body.slug : generateCleanSlug(body.title);

    const wordCount = body.content.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(wordCount / 200));
    const readTime = `${minutes} min de leitura`;

    const isDraft = body.status === 'draft';
    const shouldRunGemini = isDraft || body.autoGenerateWithGemini;

    let focusKeyword = body.seo?.focusKeyword || '';
    let metaTitle = body.seo?.metaTitle || '';
    let metaDescription = body.seo?.metaDescription || '';
    let imageAlt = body.imageAlt || '';
    let tags = body.tags || [];
    let summary = body.summary || '';

    // Automatically generate SEO metadatas with Gemini for new drafts or when requested
    if (shouldRunGemini && (!metaTitle || !metaDescription || !imageAlt || tags.length === 0)) {
      const geminiSeo = await generateSeoWithGemini({
        title: body.title,
        content: body.content,
        summary: body.summary,
        category: body.category,
        image: body.image,
        imageAlt: body.imageAlt,
        existingTags: body.tags,
      });

      if (!focusKeyword) focusKeyword = geminiSeo.focusKeyword;
      if (!metaTitle) metaTitle = geminiSeo.metaTitle;
      if (!metaDescription) metaDescription = geminiSeo.metaDescription;
      if (!imageAlt) imageAlt = geminiSeo.imageAlt;
      if (!summary) summary = geminiSeo.summary;
      if (!tags.length) {
        tags = geminiSeo.suggestedTags;
      } else {
        tags = Array.from(new Set([...tags, ...geminiSeo.suggestedTags]));
      }
    }

    // Default fallbacks if not filled
    if (!metaTitle) metaTitle = `${body.title.slice(0, 50)} | EquiparLoc`;
    if (!metaDescription) {
      metaDescription = summary
        ? `${summary.slice(0, 140)}... Consulte locação na EquiparLoc.`
        : `${body.title.slice(0, 120)}. Conheça os diferenciais de locação da EquiparLoc.`;
    }
    if (!imageAlt) imageAlt = `${body.title} - EquiparLoc`;
    if (!summary) summary = body.content.slice(0, 160).replace(/[#*`_]/g, '') + '...';

    const seoAnalysis = analyzePostSeo({
      title: body.title,
      slug,
      content: body.content,
      summary,
      focusKeyword,
      metaTitle,
      metaDescription,
      imageAlt,
    });

    const newPost: BlogPost = {
      id,
      slug,
      title: body.title.trim(),
      status: body.status || 'draft',
      category: body.category || 'Engenharia & Planejamento',
      tags: tags.length ? tags : ['Equipamentos Pesados', 'Obras'],
      readTime,
      viewsCount: 0,
      publishedAt:
        body.publishedAt ||
        new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
      scheduledFor: body.scheduledFor,
      author:
        body.author && typeof body.author === 'object'
          ? body.author
          : {
              name: typeof body.author === 'string' ? body.author : 'Equipe Técnica EquiparLoc',
              role: 'Engenharia e Operações',
            },
      summary,
      content: body.content,
      image: body.image || '/images/hero_heavy_machinery_1793461100728.jpg',
      imageAlt,
      seo: seoAnalysis,
      comments: [],
    };

    const saved = saveBlogPost(newPost);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error('Error saving blog post:', error);
    return NextResponse.json({ error: 'Erro ao salvar artigo' }, { status: 500 });
  }
}
