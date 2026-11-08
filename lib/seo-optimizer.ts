import { BlogPost, PostSeoData, PostSeoChecklist } from './types';

// Portuguese stopwords to strip when auto-optimizing URL slugs
const STOPWORDS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas',
  'um', 'uma', 'uns', 'umas', 'para', 'por', 'com', 'sem', 'sob',
  'sobre', 'como', 'que', 'ao', 'aos', 'se', 'ou', 'e'
]);

/**
 * Creates a clean, URL-friendly kebab-case slug
 */
export function generateCleanSlug(text: string): string {
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '');

  const words = normalized
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STOPWORDS.has(w));

  return words.slice(0, 6).join('-');
}

/**
 * Derives a focus keyword phrase from a title if none is provided
 */
export function deriveFocusKeyword(title: string): string {
  const clean = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '');

  const words = clean.split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return words.slice(0, 3).join(' ');
}

/**
 * Analyzes the SEO health of a blog post and computes a score (0-100) + checklist
 */
export function analyzePostSeo(post: {
  title: string;
  slug?: string;
  content: string;
  summary: string;
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
  imageAlt: string;
}): PostSeoData {
  const keyword = (post.focusKeyword || deriveFocusKeyword(post.title)).toLowerCase().trim();
  const keywordTokens = keyword.split(/\s+/).filter(Boolean);

  const titleLower = (post.title || '').toLowerCase();
  const metaTitleLower = (post.metaTitle || '').toLowerCase();
  const metaDescLower = (post.metaDescription || '').toLowerCase();
  const contentLower = (post.content || '').toLowerCase();
  const imageAltLower = (post.imageAlt || '').toLowerCase();

  // Helper: check if all keyword tokens are present
  const containsKeyword = (text: string) => {
    if (!keyword) return false;
    if (text.includes(keyword)) return true;
    return keywordTokens.every((token) => text.includes(token));
  };

  // 1. Title Checks
  const titleLength = (post.metaTitle || post.title || '').length;
  const titleLengthValid = titleLength >= 40 && titleLength <= 65;
  const keywordInTitle = containsKeyword(titleLower) || containsKeyword(metaTitleLower);

  // 2. Meta Description Checks
  const metaDescLength = (post.metaDescription || '').length;
  const metaDescLengthValid = metaDescLength >= 120 && metaDescLength <= 165;
  const keywordInMetaDesc = containsKeyword(metaDescLower);

  // 3. First Paragraph Check (first 100 words of content)
  const firstParagraph = post.content.split(/\n\s*\n/)[0] || '';
  const keywordInFirstParagraph = containsKeyword(firstParagraph.toLowerCase());

  // 4. Subheadings Check (H2, H3 in markdown)
  const headings = (post.content.match(/^#{2,3}\s+(.+)$/gm) || []).map((h) =>
    h.replace(/^#{2,3}\s+/, '').toLowerCase()
  );
  const subheadingsPresent = headings.length >= 2;
  const keywordInSubheading = headings.some((h) => containsKeyword(h));

  // 5. Content Volume Check
  const wordCount = post.content.trim().split(/\s+/).filter(Boolean).length;
  const contentLengthValid = wordCount >= 300;

  // 6. Image ALT Check
  const imageAltContainsKeyword = imageAltLower.length > 5 && (keyword ? containsKeyword(imageAltLower) : true);

  // 7. Internal Links Check
  const internalLinksPresent =
    contentLower.includes('/locacao') ||
    contentLower.includes('/catalogo') ||
    contentLower.includes('/orcamento') ||
    contentLower.includes('equipar') ||
    contentLower.includes('locacao');

  const checklist: PostSeoChecklist = {
    keywordInTitle,
    keywordInMetaDesc,
    keywordInFirstParagraph,
    keywordInSubheading,
    titleLengthValid,
    metaDescLengthValid,
    contentLengthValid,
    imageAltContainsKeyword,
    subheadingsPresent,
    internalLinksPresent,
  };

  // Compute Score (weighted out of 100)
  let score = 0;
  if (keywordInTitle) score += 15;
  if (titleLengthValid) score += 10;
  if (keywordInMetaDesc) score += 15;
  if (metaDescLengthValid) score += 10;
  if (keywordInFirstParagraph) score += 10;
  if (subheadingsPresent) score += 10;
  if (keywordInSubheading) score += 10;
  if (contentLengthValid) score += 10;
  if (imageAltContainsKeyword) score += 5;
  if (internalLinksPresent) score += 5;

  let readabilityScore: 'Fácil' | 'Médio' | 'Técnico' = 'Médio';
  if (wordCount > 600 && subheadingsPresent) readabilityScore = 'Técnico';
  else if (wordCount < 400) readabilityScore = 'Fácil';

  return {
    focusKeyword: keyword,
    metaTitle: post.metaTitle || (post.title ? `${post.title.slice(0, 50)} | EquiparLoc` : ''),
    metaDescription: post.metaDescription || (post.summary ? post.summary.slice(0, 150) : ''),
    score: Math.min(100, Math.max(0, score)),
    readabilityScore,
    checklist,
  };
}

/**
 * AUTOMATIC SEO CORRECTION ENGINE:
 * Automatically fixes title lengths, builds optimized meta description with focus keyword,
 * creates descriptive image ALT tags, cleans slug, and ensures high search engine performance.
 */
export function autoFixPostSeo(post: BlogPost): BlogPost {
  // 1. Determine focus keyword
  const keyword = post.seo?.focusKeyword?.trim() || deriveFocusKeyword(post.title);

  // 2. Auto-correct Meta Title (ensures 50-60 chars, has keyword, ends with brand suffix)
  let optimizedMetaTitle = post.title.trim();
  if (!optimizedMetaTitle.toLowerCase().includes(keyword.toLowerCase())) {
    optimizedMetaTitle = `${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: ${optimizedMetaTitle}`;
  }
  if (!optimizedMetaTitle.includes('EquiparLoc')) {
    const maxLen = 58 - ' | EquiparLoc'.length;
    optimizedMetaTitle = `${optimizedMetaTitle.slice(0, maxLen).trim()} | EquiparLoc`;
  }
  if (optimizedMetaTitle.length > 65) {
    optimizedMetaTitle = optimizedMetaTitle.slice(0, 62) + '...';
  }

  // 3. Auto-correct Meta Description (ensures 135-160 chars, includes focus keyword and call-to-action)
  let baseExcerpt = (post.summary || post.content.split('\n\n')[0] || '')
    .replace(/[#*`_]/g, '')
    .trim();

  let optimizedMetaDesc = baseExcerpt;
  if (!optimizedMetaDesc.toLowerCase().includes(keyword.toLowerCase())) {
    optimizedMetaDesc = `Guia completo sobre ${keyword}: ${optimizedMetaDesc}`;
  }

  const ctaSuffix = ' Consulte especificações e locação na EquiparLoc.';
  const targetLen = 158;
  if (optimizedMetaDesc.length + ctaSuffix.length <= targetLen) {
    optimizedMetaDesc = `${optimizedMetaDesc.trim()}${ctaSuffix}`;
  } else {
    const allowed = targetLen - ctaSuffix.length - 3;
    optimizedMetaDesc = `${optimizedMetaDesc.slice(0, allowed).trim()}...${ctaSuffix}`;
  }

  // 4. Auto-correct Image Alt
  const optimizedImageAlt = post.imageAlt?.trim()
    ? post.imageAlt
    : `${post.title} - Guia técnico de locação de equipamentos pesados EquiparLoc`;

  // 5. Auto-correct Slug if empty or default
  const optimizedSlug = post.slug?.trim() ? post.slug : generateCleanSlug(post.title);

  // 6. Calculate reading time automatically
  const wordCount = post.content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  const optimizedReadTime = `${minutes} min de leitura`;

  // 7. Ensure subheadings have keyword relevance if missing
  let optimizedContent = post.content;
  if (!optimizedContent.includes('## ')) {
    optimizedContent = `## Análise Técnica e Aplicação de ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}\n\n${optimizedContent}`;
  }

  // 8. Re-run analysis on auto-corrected data
  const updatedSeo = analyzePostSeo({
    title: post.title,
    slug: optimizedSlug,
    content: optimizedContent,
    summary: post.summary,
    focusKeyword: keyword,
    metaTitle: optimizedMetaTitle,
    metaDescription: optimizedMetaDesc,
    imageAlt: optimizedImageAlt,
  });

  return {
    ...post,
    slug: optimizedSlug,
    readTime: optimizedReadTime,
    content: optimizedContent,
    imageAlt: optimizedImageAlt,
    seo: updatedSeo,
    updatedAt: new Date().toISOString(),
  };
}
