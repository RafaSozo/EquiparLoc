import { MetadataRoute } from 'next';
import { getAllEquipments, getAllBlogPosts, getCategoriesWithCount } from '@/lib/db';
import { SITE_URL, parsePtBrDate, categoryPath, equipmentPath } from '@/lib/site';

// Sempre gerado com os dados atuais do CRM
export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/locacao`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/servicos`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/localizacao`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/orcamento`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/empresa`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/contato`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/privacidade`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Uma página por grupo de equipamentos
  const categoryRoutes: MetadataRoute.Sitemap = getCategoriesWithCount(true).map((c) => ({
    url: `${baseUrl}${categoryPath(c.name)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.88,
  }));

  const equipmentRoutes: MetadataRoute.Sitemap = getAllEquipments()
    .filter((e) => e.status === 'active')
    .map((eq) => ({
      url: `${baseUrl}${equipmentPath(eq)}`,
      changeFrequency: 'weekly',
      priority: 0.85,
      images: [`${baseUrl}${eq.image}`],
    }));

  // Apenas artigos publicados (rascunhos e agendados ficam fora)
  const blogRoutes: MetadataRoute.Sitemap = getAllBlogPosts()
    .filter((p) => !p.status || p.status === 'published')
    .map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: parsePtBrDate(post.updatedAt) || parsePtBrDate(post.publishedAt),
      changeFrequency: 'monthly',
      priority: 0.75,
      images: post.image.startsWith('http') ? [post.image] : [`${baseUrl}${post.image}`],
    }));

  return [...staticRoutes, ...categoryRoutes, ...equipmentRoutes, ...blogRoutes];
}
