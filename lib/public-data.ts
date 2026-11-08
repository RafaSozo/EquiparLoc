import type { BlogPost } from './types';

/**
 * Versão pública de um artigo: só comentários aprovados e sem o e-mail de quem comentou.
 * Use sempre que o artigo for enviado ao navegador de visitantes.
 */
export function toPublicPost(post: BlogPost): BlogPost {
  return {
    ...post,
    comments: (post.comments || [])
      .filter((c) => c.status === 'approved')
      .map((c) => ({ ...c, authorEmail: '' })),
  };
}

export const isPublished = (post: BlogPost) => !post.status || post.status === 'published';
