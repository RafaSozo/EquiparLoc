import { NextRequest, NextResponse } from 'next/server';
import { getAllEquipments, getAllBlogPosts } from '@/lib/db';
import { Equipment, BlogPost } from '@/lib/types';

// Helper to remove accents and lower-case
function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // 'all' | 'equipment' | 'blog'
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const normQuery = normalize(query);
    const queryTokens = normQuery.split(/\s+/).filter((t) => t.length > 0);

    const allEquipments = getAllEquipments().filter((e) => e.status === 'active');
    const allPosts = getAllBlogPosts().filter((p) => p.status === 'published');

    // Popular suggestions if query is empty or short
    const popularSuggestions = [
      'Betoneira 400 litros',
      'Placa vibratória',
      'Martelo demolidor',
      'Gerador de energia',
      'Minicarregadeira',
      'Cortadora de piso',
      'Motobomba',
    ];

    if (!normQuery) {
      return NextResponse.json({
        query: '',
        total: 0,
        equipments: allEquipments.slice(0, 4).map((eq) => ({
          id: eq.id,
          code: eq.code,
          name: eq.name,
          slug: eq.slug,
          category: eq.category,
          image: eq.image,
          summary: eq.summary,
          specs: {
            operatingWeight: eq.specs.operatingWeight,
            power: eq.specs.power,
            bucketCapacity: eq.specs.bucketCapacity,
            maxReach: eq.specs.maxReach,
            fuelType: eq.specs.fuelType,
          },
          availability: 'disponivel',
          matchedHighlights: [],
        })),
        blogPosts: allPosts.slice(0, 3).map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          category: p.category,
          readTime: p.readTime,
          publishedAt: p.publishedAt,
          image: p.image,
          summary: p.summary,
          matchedHighlights: [],
        })),
        suggestions: popularSuggestions,
      });
    }

    // Match & Score Equipments
    const scoredEquipments: Array<{ equipment: Equipment; score: number; highlights: string[] }> = [];

    for (const eq of allEquipments) {
      let score = 0;
      const highlights: string[] = [];

      const normName = normalize(eq.name);
      const normCode = normalize(eq.code);
      const normCategory = normalize(eq.category);
      const normSummary = normalize(eq.summary);
      const normSpecs = normalize(
        `${eq.specs.operatingWeight} ${eq.specs.power} ${eq.specs.bucketCapacity || ''} ${eq.specs.maxReach || ''} ${eq.specs.fuelType}`
      );
      const normFeatures = normalize(eq.features.join(' '));
      const normApplications = normalize(eq.applications.join(' '));

      // Exact code match
      if (normCode.includes(normQuery)) {
        score += 120;
        highlights.push(`Código: ${eq.code}`);
      }

      // Name exact or token matches
      if (normName === normQuery) {
        score += 100;
        highlights.push(eq.name);
      } else if (normName.includes(normQuery)) {
        score += 60;
        highlights.push(eq.name);
      }

      // Category match
      if (normCategory.includes(normQuery)) {
        score += 40;
        highlights.push(`Categoria: ${eq.category}`);
      }

      // Specs match
      if (normSpecs.includes(normQuery)) {
        score += 35;
        highlights.push('Especificação técnica correspondente');
      }

      // Token-based matching
      let tokensMatched = 0;
      for (const token of queryTokens) {
        if (normName.includes(token)) {
          score += 20;
          tokensMatched++;
        }
        if (normCategory.includes(token)) {
          score += 15;
          tokensMatched++;
        }
        if (normSpecs.includes(token)) {
          score += 15;
          tokensMatched++;
        }
        if (normFeatures.includes(token) || normApplications.includes(token)) {
          score += 10;
          tokensMatched++;
        }
        if (normSummary.includes(token)) {
          score += 5;
        }
      }

      if (score > 0 && tokensMatched >= Math.min(queryTokens.length, 1)) {
        scoredEquipments.push({ equipment: eq, score, highlights });
      }
    }

    // Match & Score Blog Posts
    const scoredPosts: Array<{ post: BlogPost; score: number; highlights: string[] }> = [];

    for (const post of allPosts) {
      let score = 0;
      const highlights: string[] = [];

      const normTitle = normalize(post.title);
      const normCategory = normalize(post.category);
      const normSummary = normalize(post.summary);
      const normTags = normalize(post.tags.join(' '));
      const normContent = normalize(post.content.slice(0, 1000));

      if (normTitle.includes(normQuery)) {
        score += 80;
        highlights.push(post.title);
      }
      if (normCategory.includes(normQuery)) {
        score += 35;
        highlights.push(`Categoria: ${post.category}`);
      }
      if (normTags.includes(normQuery)) {
        score += 30;
        highlights.push('Tag correspondente');
      }

      for (const token of queryTokens) {
        if (normTitle.includes(token)) score += 20;
        if (normCategory.includes(token)) score += 15;
        if (normTags.includes(token)) score += 10;
        if (normSummary.includes(token) || normContent.includes(token)) score += 5;
      }

      if (score > 0) {
        scoredPosts.push({ post, score, highlights });
      }
    }

    // Sort by score descending
    scoredEquipments.sort((a, b) => b.score - a.score);
    scoredPosts.sort((a, b) => b.score - a.score);

    const filteredEquipments = (type === 'blog' ? [] : scoredEquipments.slice(0, limit)).map((item) => {
      const eq = item.equipment;
      return {
        id: eq.id,
        code: eq.code,
        name: eq.name,
        slug: eq.slug,
        category: eq.category,
        image: eq.image,
        summary: eq.summary,
        specs: {
          operatingWeight: eq.specs.operatingWeight,
          power: eq.specs.power,
          bucketCapacity: eq.specs.bucketCapacity,
          maxReach: eq.specs.maxReach,
          fuelType: eq.specs.fuelType,
        },
        availability: 'disponivel' as const,
        matchedHighlights: item.highlights,
      };
    });

    const filteredPosts = (type === 'equipment' ? [] : scoredPosts.slice(0, limit)).map((item) => {
      const p = item.post;
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        category: p.category,
        readTime: p.readTime,
        publishedAt: p.publishedAt,
        image: p.image,
        summary: p.summary,
        matchedHighlights: item.highlights,
      };
    });

    // Dynamic suggested alternative terms if low results
    const matchingSuggestions = popularSuggestions.filter((s) =>
      normalize(s).includes(normQuery)
    );
    const finalSuggestions =
      matchingSuggestions.length > 0
        ? matchingSuggestions
        : popularSuggestions.slice(0, 4);

    return NextResponse.json({
      query,
      total: filteredEquipments.length + filteredPosts.length,
      equipments: filteredEquipments,
      blogPosts: filteredPosts,
      suggestions: finalSuggestions,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Erro ao executar busca' }, { status: 500 });
  }
}
