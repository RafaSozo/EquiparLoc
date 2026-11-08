# Relatório de segurança: site EquiparLoc

- **Data:** 06/11/2026
- **Escopo:** código-fonte do projeto `equipar360` (Next.js 15) e o servidor local em `http://localhost:3000`
- **Tipo:** análise com acesso ao código (caixa-branca) e testes não destrutivos no servidor local
- **Fora do escopo:** hospedagem, domínio `equiparloc.com.br`, e-mail e redes. O site ainda não está publicado, então nada foi testado pela internet.
- **Nota de escala:** os números de gravidade usam a escala CVSS 3.1, de 0 a 10.

## Resumo para a empresa

O site está em **boa situação**. Nenhum problema crítico ou alto foi encontrado.

- **Proteção dos dados:** pedidos de orçamento, contatos e dados de clientes só aparecem para quem entra no painel com senha.
- **Proteção das alterações:** quem não está logado não consegue alterar, apagar nem criar nada. Isso foi testado em todas as 8 rotas de alteração do site.
- **Senha e sessão:** a senha do painel e a chave de sessão são fortes e ficam fora do código.
- **Robôs:** os formulários públicos têm limite de envios contra robôs e de tamanho do texto.

Há **6 pontos a melhorar**, a maioria de ajuste rápido:

- Os mais importantes são ativar os **cabeçalhos de proteção do navegador** e **ajustar o que o "operador comercial" pode fazer no painel**.
- Os outros dependem de quem tem senha do painel ou de como o site for hospedado.

| Gravidade | Quantidade |
|---|---|
| Crítica | 0 |
| Alta | 0 |
| Média | 3 |
| Baixa | 3 |
| Informativa | 5 |

---

## Status das correções (07/11/2026)

| Item | Status | O que foi feito |
|---|---|---|
| ACH-001 | ✅ Corrigido | `next.config.ts` envia 7 cabeçalhos de proteção: CSP com `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS e COOP. O painel e as APIs passaram a usar `no-store`, e o painel tem `noindex`. Conferido no servidor. |
| ACH-002 | ✅ Corrigido | `requireAuth({ permission })` em todas as 12 rotas de escrita. Equipamentos passam por uma lista de campos permitidos (`lib/equipment-input.ts`) e o id é sempre gerado pelo servidor. |
| ACH-003 | ✅ Corrigido no código | A variável `TRUSTED_IP_HEADER` define de qual cabeçalho vem o IP real. **Falta preencher ao publicar** (ex.: `cf-connecting-ip` na Cloudflare). |
| ACH-004 | ✅ Corrigido | `jsonLdHtml()` em `lib/site.ts` troca `<` por `<` nas 3 páginas. |
| ACH-005 | ✅ Corrigido | O bloqueio passou a contar por e-mail e IP (5 erros em 15 min). Há também um teto por conta de 30 erros por hora, somando todos os IPs. |
| ACH-006 | ✅ Corrigido | O PostCSS interno do Next.js foi forçado para 8.5.32 via `overrides`, sem mudar o Next de versão. `npm audit`: 0 vulnerabilidades. A montagem de produção funcionou. |
| INF-01 | ✅ Corrigido | `poweredByHeader: false`. |
| INF-04 | ✅ Corrigido | `picsum.photos` foi removido. |
| INF-03 | ✅ Corrigido | Cópia diária automática em `data/backups/` (últimos 30 dias, ajustável com `BACKUP_DAYS`), com arquivos só do dono (0600). Testado: a cópia do dia foi criada. **Ao publicar:** incluir `data/backups` no backup externo da hospedagem. |
| INF-05 | ✅ Preparado | Em produção, o servidor registra um aviso `[segurança]` se `NEXTAUTH_URL` não for https ou for local, ou se faltar `TRUSTED_IP_HEADER`. **Ao publicar:** definir `NEXTAUTH_URL=https://equiparloc.com.br` e gerar uma `NEXTAUTH_SECRET` nova. |
| INF-02 | ⏳ Pendente | Só faz falta com mais de um servidor ou muito tráfego. Exige um serviço externo (Redis/Upstash). |

**Teste das permissões (07/11/2026):** com um operador de teste temporário, 13 de 13 rotas responderam como esperado. O operador vê e atualiza orçamentos e edita equipamentos. Ele recebe 403 ao criar itens, mexer no blog, apagar ou alterar configurações. Na edição, campos desconhecidos, troca de id e imagem `javascript:` foram descartados. O operador de teste foi removido em seguida.

---

## O que já está bem feito

- **Rotas de alteração protegidas:** todas as rotas que alteram dados exigem login. Teste sem login: 8 de 8 responderam `401`. Apagar exige ser administrador.
- **Login seguro:**
  - A senha é comparada em tempo constante, o que impede descobri-la medindo o tempo de resposta.
  - Depois de 5 erros, o login fica bloqueado por 15 minutos. Testado: na 6ª tentativa aparece "Muitas tentativas".
  - A sessão expira em 12 horas.
- **Segredos fora do código:**
  - A senha (16 caracteres, com maiúsculas, minúsculas e números) e a chave de sessão (43 caracteres) estão só em `.env.local`, que o Git ignora.
  - Em produção, o login fica bloqueado se a chave não for definida.
- **Rascunhos escondidos:** equipamentos e artigos em rascunho não aparecem para visitantes.
- **Comentários do blog:**
  - Entram como "pendente" e só são publicados após aprovação.
  - Aparecem como texto simples, então ninguém consegue injetar código por eles.
- **Formulários públicos** (orçamento, contato, comentários):
  - Têm limite de envios por IP: 5 orçamentos ou 3 comentários a cada 10 minutos.
  - Têm limite de tamanho do pedido e de cada campo.
  - Removem caracteres de controle e validam o e-mail.
- **Banco de dados privado:** o banco (`data/`) fica fora da pasta pública, então não é baixável pelo navegador.
- **PIN do administrador:** é retirado da resposta pública das configurações.
- **Links perigosos bloqueados:** o React 19 bloqueia links `javascript:` nos artigos.

---

## Problemas encontrados

### ACH-001: faltam os cabeçalhos de proteção do navegador

- **Gravidade:** média, CVSS 4.3 (`AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N`)
- **Esforço:** rápido, menos de 1 hora

**O que é:** o servidor não envia os avisos que mandam o navegador se proteger. Faltam:
- `Content-Security-Policy` (limita de onde scripts podem carregar);
- `X-Frame-Options` / `frame-ancestors` (impede que outro site coloque o seu dentro de uma moldura invisível);
- `Strict-Transport-Security` (obriga HTTPS);
- `X-Content-Type-Options`;
- `Referrer-Policy`;
- `Permissions-Policy`.

**Risco:** sem a proteção de moldura, um site malicioso pode carregar o painel `/admin` escondido e induzir um funcionário logado a clicar em algo sem perceber (ataque de "clickjacking").

**Evidência:** `curl -I http://localhost:3000/` não traz nenhum desses cabeçalhos. O `next.config.ts` não tem a função `headers()`.

**Correção:** adicionar `headers()` no `next.config.ts` com esses 6 cabeçalhos. Para o painel, usar `frame-ancestors 'none'`.

### ACH-002: o operador comercial pode fazer mais do que deveria

- **Gravidade:** média, CVSS 5.4 (`AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:L/A:L`)
- **Esforço:** curto, de 2 a 4 horas

**O que é:** a lista de permissões do operador (`lib/auth.ts`) não inclui `blog_manage` nem `fleet_create`. Mesmo assim, as rotas só verificam se a pessoa está logada, sem olhar essas permissões. Por isso o operador consegue:
- criar e editar artigos do blog (`POST /api/blog`, `PUT /api/blog/[id]`);
- criar equipamentos (`POST /api/equipamentos`);
- criar e editar categorias (`POST /api/categorias`, `PUT /api/categorias/[id]`);
- usar a geração de SEO por IA (`POST /api/blog/generate-seo`), que consome a cota da chave do Gemini.

Além disso, `PUT /api/equipamentos/[id]` aceita qualquer campo enviado (`{...existing, ...body}`), sem lista do que pode ser alterado.

**Risco:** se a senha do operador vazar, ou um funcionário agir de má-fé, o blog e o catálogo podem ser alterados. Hoje não existe operador configurado, então o risco só aparece quando um for criado.

**Correção:** criar `requirePermission('blog_manage')` e equivalentes em `lib/api-auth.ts` e usar em cada rota. No `PUT` de equipamento, aceitar apenas os campos conhecidos.

### ACH-003: o limite de envios confia no IP informado pelo próprio visitante

- **Gravidade:** média se não houver proxy, baixa se houver. CVSS 5.3 sem proxy (`AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L`)
- **Esforço:** rápido

**O que é:** `clientIp()` (`lib/rate-limit.ts`) usa primeiro o cabeçalho `x-real-ip`.
- Se a hospedagem tiver um proxy (nginx, Cloudflare, Vercel) que sobrescreve esse cabeçalho, está tudo certo.
- Se o Node ficar exposto direto, qualquer um envia `x-real-ip: 1.2.3.4` com um valor diferente a cada pedido e escapa do limite.

**Risco:** um robô pode enviar milhares de pedidos de orçamento falsos. Isso enche a lista do painel e faz crescer o arquivo `data/database.json`, que é regravado a cada envio.

**Correção:**
- Publicar sempre atrás de um proxy.
- Ler o IP apenas do cabeçalho que a hospedagem garante (na Cloudflare, `cf-connecting-ip`), configurado por variável de ambiente.
- Como reforço, adicionar um desafio anti-robô invisível (Cloudflare Turnstile) nos formulários.

### ACH-004: textos do painel entram sem escape no código de SEO (JSON-LD)

- **Gravidade:** baixa, CVSS 4.8 (`AV:N/AC:L/PR:H/UI:R/S:C/C:L/I:L/A:N`)
- **Esforço:** rápido, 15 minutos

**O que é:** as páginas de produto, de artigo e o layout colocam dados no bloco `<script type="application/ld+json">` com `JSON.stringify` puro. Isso acontece em:
- `app/catalogo/[slug]/page.tsx`
- `app/blog/[slug]/page.tsx`
- `app/layout.tsx`

O `JSON.stringify` não troca o caractere `<`. Se um título de produto ou de artigo contiver `</script><script>...`, esse código passa a rodar no navegador de todos os visitantes.

**Risco:** só quem tem login no painel consegue gravar esses textos, por isso a gravidade é baixa. Ainda assim, transforma uma senha vazada em ataque contra os clientes.

**Correção:** usar `JSON.stringify(jsonLd).replace(/</g, '\\u003c')` nos três lugares.

### ACH-005: qualquer pessoa que saiba o e-mail do administrador pode bloquear o login dele

- **Gravidade:** baixa, CVSS 3.7 (`AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:L`)
- **Esforço:** curto

**O que é:** o bloqueio após 5 erros é por e-mail, não por e-mail e IP. Quem souber o e-mail do administrador pode errar 5 vezes de propósito a cada 15 minutos e impedir que ele entre.

**Atenuante:** o e-mail do administrador não aparece em nenhum arquivo do site e não é o e-mail comercial público. Isso foi verificado.

**Correção:**
- Contar as tentativas por e-mail e IP juntos.
- Manter também um limite global mais alto, por exemplo 50 por hora, para frear ataques distribuídos.

### ACH-006: vulnerabilidade conhecida no PostCSS

- **Gravidade:** baixa
- **Esforço:** rápido

**O que é:** `npm audit` aponta 1 vulnerabilidade alta no `postcss` (escape de `</style>` e leitura de arquivo por source map) e 1 moderada no `next`, causada por esse mesmo `postcss`.

**Risco na prática:** baixo. O PostCSS só processa o CSS do próprio projeto durante a montagem do site e nunca recebe dados de visitantes.

**Correção:** `npm audit fix` ou atualizar `postcss` e `next` para a versão corrigida, depois testar a montagem do site.

---

## Informativos (sem risco direto)

- **INF-01: versão do Next.js exposta.** O cabeçalho `X-Powered-By: Next.js` revela a tecnologia. Correção: `poweredByHeader: false` no `next.config.ts`.
- **INF-02: limites que reiniciam com o servidor.** Os limites de envio e de login ficam na memória: zeram quando o servidor reinicia e não são compartilhados se houver mais de uma instância. Se o tráfego crescer, levar para um armazenamento compartilhado, como Redis ou Upstash.
- **INF-03: dados pessoais num arquivo sem backup (LGPD).** Nomes, telefones e e-mails de clientes ficam em `data/database.json`, um único arquivo sem cópia automática. Recomendado:
  - backup diário criptografado;
  - permissão de leitura só para o usuário do servidor;
  - um prazo para apagar pedidos antigos.
- **INF-04: domínio de imagem sem uso.** `next.config.ts` libera imagens de `picsum.photos`, que não é mais usado. Remover diminui o que o otimizador de imagens aceita buscar.
- **INF-05: ajustes obrigatórios ao publicar.** `NEXTAUTH_URL` está como `http://localhost:3000` e precisa virar `https://equiparloc.com.br`. Gerar também uma `NEXTAUTH_SECRET` nova para produção, diferente da usada no computador.

---

## Plano de correção

**Imediato (24 a 48 h):**
1. Cabeçalhos de proteção e `poweredByHeader: false` (ACH-001, INF-01)
2. Escape do JSON-LD (ACH-004)
3. Remover `picsum.photos` (INF-04)
4. `npm audit fix` e teste de montagem (ACH-006)

**Curto prazo (1 a 4 semanas):**
1. Permissões por rota e lista de campos permitidos no `PUT` (ACH-002)
2. Bloqueio de login por e-mail e IP (ACH-005)
3. IP real vindo do proxy da hospedagem e anti-robô nos formulários (ACH-003)
4. Antes de publicar: `NEXTAUTH_URL`, chave nova e HTTPS (INF-05)

**Longo prazo:**
1. Trocar o arquivo JSON por um banco de dados (por exemplo Supabase/Postgres), com backup automático e controle de acesso (INF-02, INF-03)
2. Login em duas etapas no painel
3. Depois de publicar, repetir esta análise com testes pela internet: domínio, TLS e portas abertas
