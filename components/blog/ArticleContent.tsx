import React from 'react';
import Link from 'next/link';
import { ArticleBlock, parseInline } from '@/lib/article';

function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((t, i) => {
        if (t.type === 'strong') return <strong key={i} className="font-semibold text-aco">{t.value}</strong>;
        if (t.type === 'link') {
          const isInternal = t.href.startsWith('/') || t.href.startsWith('#');
          const cls = 'font-semibold text-aco underline underline-offset-4 decoration-laranja decoration-2 hover:decoration-aco';
          return isInternal ? (
            <Link key={i} href={t.href} className={cls}>{t.text}</Link>
          ) : (
            <a key={i} href={t.href} target="_blank" rel="noopener noreferrer" className={cls}>{t.text}</a>
          );
        }
        return <React.Fragment key={i}>{t.value}</React.Fragment>;
      })}
    </>
  );
}

export function ArticleContent({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div className="max-w-none text-aco text-sm sm:text-base leading-relaxed space-y-5 pt-4">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'h2':
            return (
              <h2
                key={idx}
                id={block.id}
                className="text-xl sm:text-2xl font-bold text-aco mt-8 mb-3 pt-3 border-t border-concreto scroll-mt-24"
              >
                <Inline text={block.text} />
              </h2>
            );
          case 'h3':
            return (
              <h3 key={idx} id={block.id} className="text-lg font-bold text-aco mt-6 mb-2 scroll-mt-24">
                <Inline text={block.text} />
              </h3>
            );
          case 'ul':
          case 'ol': {
            const ListTag = block.type;
            return (
              <ListTag
                key={idx}
                className={`${block.type === 'ul' ? 'list-disc' : 'list-decimal'} pl-6 space-y-1.5 text-aco-medio marker:text-aco marker:font-bold`}
              >
                {block.items.map((item, i) => (
                  <li key={i}>
                    <Inline text={item} />
                  </li>
                ))}
              </ListTag>
            );
          }
          default:
            return (
              <p key={idx} className="text-aco-medio leading-relaxed">
                <Inline text={block.text} />
              </p>
            );
        }
      })}
    </div>
  );
}
