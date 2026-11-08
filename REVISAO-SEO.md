# Revisão de SEO, navegação e acessibilidade – EquiparLoc

Data: 05/11/2026

## ✅ O que foi corrigido

### SEO técnico
| Problema | Correção |
|---|---|
| **Contato** e **Orçamento** usavam o título/descrição da home (páginas "use client" não exportam metadata) | Criados `app/contato/layout.tsx` e `app/orcamento/layout.tsx` com título e descrição próprios |
| Nenhuma página tinha **URL canônica** | `canonical` em todas as páginas públicas (respeita `seo.canonicalUrl` dos posts) |
| Imagens de compartilhamento (Open Graph) com URL relativa ou ausente | `metadataBase` no layout + imagem padrão em todas as páginas |
| Título da home sem palavra-chave ("EquiparLoc \| Locações...") | "Locação de Máquinas Pesadas e Ferramentas para Obras \| EquiparLoc" (sem cidade: a empresa não informa região de atendimento) |
| H1 da home só com o slogan ("A FORÇA QUE MOVE A SUA OBRA.") | H1 agora inclui "Locação de máquinas e ferramentas para obra" + slogan |
| Sem **favicon** | Ícone "EQ" gerado (`app/icon.tsx`, `app/apple-icon.tsx`) + `manifest` |
| **Rascunhos** de equipamentos e posts abriam pelo link e entravam no sitemap / home | Rascunhos/agendados agora dão 404, saem do sitemap, da home e da listagem |
| Páginas geradas no build: edições feitas no CRM não apareceriam no site publicado e o catálogo poderia sair sem conteúdo no HTML | Páginas com dados do CRM passam a renderizar a cada acesso (`force-dynamic`) |
| Sitemap com datas sempre "agora" e sem imagens | Datas reais dos artigos, imagens incluídas, só conteúdo publicado |

### Dados estruturados (Schema.org)
- **Empresa**: Organization + WebSite (com caixa de busca do Google → `/catalogo?q=`), URLs absolutas, CNPJ. Sem endereço nem área atendida.
- **Equipamentos**: removido `price: 0` (o Google entenderia como "grátis") e incluídos especificações, galeria e **trilha de navegação (breadcrumb)**.
- **Artigos**: `BlogPosting` com datas reais (antes estavam fixas no código), autor, breadcrumb.

### Blog
- **Bug grave**: quando o título "## ..." era seguido de texto na linha de baixo, o parágrafo inteiro virava título (H2 gigante). Corrigido com novo leitor de conteúdo (`lib/article.ts`).
- Links `[texto](/url)` apareciam como texto cru → agora são links de verdade (links internos ajudam o SEO).
- Listas (`- item`, `1. item`) agora são listas reais (antes eram blocos em fonte de código).
- `**negrito**` funciona.
- Data publicada com `<time datetime>`.
- Erro no console (diferença servidor × navegador) nos botões de compartilhar corrigido.

### Navegação e acessibilidade
- **Links para o "Painel CRM" removidos** do topo, menu mobile e rodapé (expunham a área administrativa a visitantes e robôs). O painel continua em `/admin`.
- Todos os campos dos formulários (contato, orçamento, modal, comentários) agora ligados ao seu rótulo (leitores de tela e clique no rótulo).
- Campos de busca com rótulo acessível.
- Ordem dos títulos corrigida (Sobre, rodapé, artigo) – sem pular de H2 para H4.
- Menus rotulados ("Menu principal"), logo com nome acessível, endereço com `<address>`.
- Telefones no formato internacional (`tel:+553134181500`) – funciona em qualquer celular.
- Rodapé com 2 colunas no tablet e link "Contato" na navegação.

## ⚠️ Precisa da sua ação

1. **Contatos**: atualizados com os dados reais (CNPJ 57.309.078/0001-00, (31) 3418-1500, WhatsApp (31) 99197-0322, comercial@equiparloc.com.br).
2. **Domínio**: o site assume `https://equiparloc.com.br`. Ao publicar, defina a variável `APP_URL` com o domínio real.
3. **Google Search Console**: depois de publicar, cadastre o domínio e envie `https://SEU-DOMINIO/sitemap.xml`.

## 💡 Próximas melhorias recomendadas (maior impacto)

1. **Páginas por categoria com URL própria** (ex.: `/catalogo/categoria/terraplenagem`) – hoje as categorias são `?cat=`, que o Google não trata como páginas separadas. É a maior oportunidade para buscas como "aluguel de escavadeira".
2. **Perguntas frequentes (FAQ)** nas páginas de equipamento, com schema FAQ.
3. **Imagens**: os JPGs têm 0,5–1 MB cada; a pasta `src/assets/images` é uma cópia não usada (5,6 MB) e pode ser apagada.
5. Logo real em arquivo (SVG/PNG) para substituir o "EQ" gerado.
6. Google Analytics: o ID fica em Configurações do CRM – conferir se está preenchido.
