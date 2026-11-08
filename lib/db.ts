import fs from 'fs';
import path from 'path';
import { DatabaseSchema, Equipment, QuoteRequest, BlogPost, CompanySettings, BlogComment, Category, CategoryGroup, CategoryWithCount, HeroSettings, ProductLine, DEFAULT_PRODUCT_LINES } from './types';
import { SERVICOS } from './servicos';
import { namesInBranch } from './category-tree';
import { DEFAULT_HERO } from './hero';
import { analyzePostSeo } from './seo-optimizer';
import catalogoInicial from './catalogo-inicial.json';
import { DATA_DIR } from './data-dir';

const DB_PATH = path.join(DATA_DIR, 'database.json');

const INITIAL_SETTINGS: CompanySettings = {
  companyName: 'EQUIPAR Locação de Equipamentos Ltda.',
  tradeName: 'EquiparLoc',
  cnpj: '57.309.078/0001-00',
  phone: '(31) 3418-1500',
  whatsapp: '5531991970322',
  email: 'comercial@equiparloc.com.br',
  address: 'Av. Elias Antônio Issa, 695 - Candelária, Belo Horizonte - MG, CEP 31570-010',
  businessHours: 'Segunda a Sexta: 08h às 17h | Atendimento de emergência 24h',
  gaMeasurementId: 'G-EQPR360X99',
  adminPin: '1234',
};

// Frota real (59 itens), mantida em lib/catalogo-inicial.json.
// Usada só quando o site sobe sem banco (ex.: primeira publicação).
const INITIAL_EQUIPMENTS: Equipment[] = catalogoInicial.equipments as Equipment[];

const INITIAL_QUOTES: QuoteRequest[] = [
  {
    id: 'orc-1001',
    protocol: 'EQ-2026-1042',
    customerName: 'Carlos Eduardo Mendes',
    companyName: 'Paulista Engenharia & Infraestrutura',
    email: 'carlos.mendes@paulistaeng.com.br',
    phone: '(11) 98765-4321',
    equipmentId: 'eq-01',
    equipmentName: 'Escavadeira Hidráulica 21t sobre Esteiras',
    rentalPeriod: 'Mensal (30 dias)',
    siteLocation: 'Obra Rodoviária SP-330 km 42 - Cajamar / SP',
    needsOperator: false,
    needsTransport: true,
    message: 'Precisamos mobilizar a escavadeira no canteiro até o dia 10 do próximo mês. Obra em 2 turnos de terraplenagem.',
    status: 'novo',
    createdAt: '2026-10-31T09:15:00Z',
    updatedAt: '2026-10-31T09:15:00Z',
    notes: [
      {
        id: 'n1',
        date: '2026-10-31T09:15:00Z',
        author: 'Sistema',
        text: 'Orçamento gerado diretamente pelo catálogo do website.',
      },
    ],
  },
  {
    id: 'orc-1002',
    protocol: 'EQ-2026-1039',
    customerName: 'Mariana Vasconcelos',
    companyName: 'Consórcio Rodoanel Metropolitano',
    email: 'm.vasconcelos@consorciorodo.com.br',
    phone: '(11) 97123-9988',
    equipmentId: 'eq-05',
    equipmentName: 'Rolo Compactador Tandem Vibratório 12t',
    rentalPeriod: 'Longo Prazo (> 6 meses)',
    siteLocation: 'Trecho Norte - Arujá / SP',
    needsOperator: true,
    needsTransport: true,
    message: 'Solicitação para 2 rolos compactadores tandem para etapa de pavimentação asfáltica contínua.',
    status: 'em_atendimento',
    createdAt: '2026-10-30T14:20:00Z',
    updatedAt: '2026-10-30T16:05:00Z',
    notes: [
      {
        id: 'n1',
        date: '2026-10-30T16:05:00Z',
        author: 'Rogério (Comercial)',
        text: 'Contato telefônico realizado com a Engª Mariana. Confirmada a necessidade de operador qualificado.',
      },
    ],
  },
  {
    id: 'orc-1003',
    protocol: 'EQ-2026-1035',
    customerName: 'Renato Faria',
    companyName: 'LogCenter Galpões Modulares',
    email: 'renato@logcenter.com.br',
    phone: '(19) 99344-1234',
    equipmentId: 'eq-03',
    equipmentName: 'Plataforma Elevatória Articulada 16m Diesel',
    rentalPeriod: 'Quinzenal (15 dias)',
    siteLocation: 'Distrito Industrial de Campinas - SP',
    needsOperator: false,
    needsTransport: true,
    message: 'Instalação de tubulações de combate a incêndio em galpão de 14.000m².',
    status: 'proposta_enviada',
    createdAt: '2026-10-29T11:40:00Z',
    updatedAt: '2026-10-29T17:10:00Z',
    notes: [
      {
        id: 'n1',
        date: '2026-10-29T17:10:00Z',
        author: 'Rogério (Comercial)',
        text: 'Proposta comercial enviada por e-mail com seguro de casco incluso. Aguardando validação de compras.',
      },
    ],
  },
  {
    id: 'orc-1004',
    protocol: 'EQ-2026-1028',
    customerName: 'Juliana Prado',
    companyName: 'Silva & Ramos Empreendimentos',
    email: 'juliana.prado@silvaramos.com.br',
    phone: '(11) 98221-5544',
    equipmentId: 'eq-06',
    equipmentName: 'Grupo Gerador Silenciado 150 kVA Trifásico',
    rentalPeriod: 'Mensal (30 dias)',
    siteLocation: 'Obra Residencial Alphaville - Barueri / SP',
    needsOperator: false,
    needsTransport: true,
    message: 'Locação para manter estande e furação de estacas enquanto a concessionária de energia não liga o poste.',
    status: 'concluido',
    createdAt: '2026-10-25T08:30:00Z',
    updatedAt: '2026-10-26T10:00:00Z',
    notes: [
      {
        id: 'n1',
        date: '2026-10-26T10:00:00Z',
        author: 'Rogério (Comercial)',
        text: 'Contrato assinado e equipamento mobilizado no canteiro. Check-in operacional aprovado.',
      },
    ],
  },
  {
    id: 'orc-1005',
    protocol: 'EQ-2026-1019',
    customerName: 'Marcio Toledo',
    companyName: 'Toledo Construções & Reformas',
    email: 'marcio@toledoconstrutora.com.br',
    phone: '(11) 97788-3322',
    equipmentId: 'eq-02',
    equipmentName: 'Retroescavadeira 4x4 Traçada',
    rentalPeriod: 'Semanal (7 dias)',
    siteLocation: 'Zona Leste de São Paulo - SP',
    needsOperator: true,
    needsTransport: false,
    message: 'Solicitação para abertura de fundações.',
    status: 'perdido',
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-22T14:00:00Z',
    notes: [
      {
        id: 'n1',
        date: '2026-10-22T14:00:00Z',
        author: 'Rogério (Comercial)',
        text: 'Cliente optou por adiar o início da obra para o próximo trimestre em razão de licença ambiental pendente.',
      },
    ],
  },
];

const INITIAL_BLOG: BlogPost[] = [
  {
    id: 'post-01',
    slug: 'como-dimensionar-escavadeira-hidraulica-para-obra',
    title: 'Como dimensionar a escavadeira hidráulica correta para sua obra de terraplenagem',
    status: 'published',
    category: 'Engenharia & Planejamento',
    tags: ['Escavadeiras', 'Terraplenagem', 'Produtividade', 'Cálculo de Ciclo'],
    readTime: '5 min de leitura',
    viewsCount: 1420,
    publishedAt: '28 de Outubro de 2026',
    author: {
      name: 'Eng. Maurício Santos',
      role: 'Especialista em Frotas e Engenharia Mecânica (CREA)',
    },
    summary: 'Entenda os critérios de capacidade de caçamba, alcance vertical, tipo de solo e ciclo de basculamento para evitar subdimensionamento ou ociosidade no canteiro.',
    content: `O dimensionamento correto do maquinário de escavação é um dos fatores mais críticos para o cumprimento do cronograma físico-financeiro de qualquer obra de terraplenagem.

A escolha entre uma escavadeira de 14t, 21t ou 36t não deve se basear apenas na disponibilidade imediata, mas no equilíbrio entre:

## 1. Volume de corte e prazo diário de operação
Calcule a taxa horária de escavação em m³/h multiplicada pela densidade aparente do solo. Solos compactos ou com presença de matacões exigem dentes reforçados de penetração e forças de desagregação superiores a 140 kN. Dimensionar a capacidade volumétrica da caçamba (geralmente entre 1,00 m³ e 1,40 m³ para modelos de 21 toneladas) evita a sobrecarga térmica dos circuitos hidráulicos.

## 2. Ciclo de giro e compatibilidade com caminhões basculantes
O tempo de ciclo padrão de uma escavadeira moderna de 21 toneladas varia entre 16 e 22 segundos, dependendo do ângulo de giro até a caçamba do caminhão (ideal de 45° a 90°). É fundamental que a caçamba da escavadeira preencha a capacidade volumétrica da caçamba do caminhão trucado ou traçado em no máximo 4 a 6 passadas contínuas. Ciclos com mais de 7 passadas geram filas de espera no bota-fora e reduzem a eficiência da frota rodoviária.

## 3. Consumo específico de diesel vs. modos de trabalho inteligentes
Modelos equipados com modos operacionais automáticos (Eco / Power) ajustam o regime de rotação do motor em função da pressão de carga hidráulica, reduzindo o consumo específico para faixas entre 14 e 18 litros/hora em regime contínuo. 

Na EquiparLoc, nossa equipe de engenharia analisa os parâmetros topográficos e de solo do seu projeto para indicar a máquina com melhor relação custo-benefício por metro cúbico movimentado. Consulte nosso [catálogo de escavadeiras](/locacao) para cotar modelos de pronta mobilização.`,
    image: '/images/hero/hero-miniescavadeira.jpg',
    imageAlt: 'Miniescavadeira sobre esteiras em obra',
    seo: analyzePostSeo({
      title: 'Como dimensionar a escavadeira hidráulica correta para sua obra de terraplenagem',
      slug: 'como-dimensionar-escavadeira-hidraulica-para-obra',
      content: 'O dimensionamento correto do maquinário de escavação...',
      summary: 'Entenda os critérios de capacidade de caçamba, alcance vertical, tipo de solo e ciclo de basculamento para evitar subdimensionamento ou ociosidade no canteiro.',
      focusKeyword: 'escavadeira hidráulica terraplenagem',
      metaTitle: 'Como dimensionar escavadeira hidráulica para terraplenagem | EquiparLoc',
      metaDescription: 'Guia técnico de dimensionamento de escavadeiras hidráulicas para obras de terraplenagem: cálculo de ciclo, consumo e caçamba. Consulte locação na EquiparLoc.',
      imageAlt: 'Miniescavadeira sobre esteiras em obra',
    }),
    comments: [
      {
        id: 'comm-101',
        authorName: 'Engº Fernando Rezende',
        authorEmail: 'fernando@rezendeinfra.com.br',
        content: 'Excelente artigo técnico! O ponto sobre a quantidade de passadas no caminhão basculante é onde a maioria das obras perde produtividade sem perceber.',
        createdAt: '2026-10-29T14:30:00Z',
        status: 'approved',
        reply: 'Obrigado Fernando! Manter a proporção correta entre caçamba e basculante é essencial para otimizar os horímetros das duas pontas da frota.',
        replyAuthor: 'Eng. Maurício Santos (EquiparLoc)',
        replyAt: '2026-10-29T16:00:00Z',
      },
    ],
  },
  {
    id: 'post-02',
    slug: 'seguranca-em-trabalho-em-altura-requisitos-nr18-para-plataformas-elevatorias',
    title: 'Segurança em trabalho em altura: requisitos NR-18 e NR-35 para plataformas elevatórias',
    status: 'published',
    category: 'Segurança Operacional',
    tags: ['NR-18', 'NR-35', 'Trabalho em Altura', 'Plataformas', 'Checklist'],
    readTime: '6 min de leitura',
    viewsCount: 980,
    publishedAt: '21 de Outubro de 2026',
    author: {
      name: 'Rodrigo Lima',
      role: 'Técnico em Segurança do Trabalho e Instrutor Operacional',
    },
    summary: 'Checklist obrigatório de pré-uso, inspeção visual, ancoragem de cinto com talabarte duplo e critérios de interdição preventiva em operações aéreas.',
    content: `O uso de Plataformas Móveis sobre Trabalho em Altura (PTA/PEMT) reduziu expressivamente os acidentes na construção civil quando comparado a andaimes tubulares convencionais. No entanto, a operação exige estrita observância das normas regulamentadoras NR-18 e NR-35.

## 1. Itens obrigatórios no checklist diário de pré-uso
Antes do primeiro içamento da jornada, o operador habilitado deve checar:
- Teste de comandos de solo e comandos do cesto antes da elevação de pessoal.
- Verificação do sensor de inclinação sonoro e do limitador de carga calibrado contra sobrepeso.
- Teste operacional da válvula de descida de emergência (bomba manual ou auxiliar elétrica).
- Inspeção rigorosa da integridade das mangueiras hidráulicas contra vazamentos e trincas.

## 2. Ponto de ancoragem e equipamento de proteção individual
O operador e os ajudantes no cesto devem estar conectados exclusivamente aos pontos de ancoragem estruturais homologados pelo fabricante da plataforma móvel, utilizando cinto tipo paraquedista com talabarte duplo ou trava-quedas retrátil. É expressamente proibida a fixação de talabartes em estruturas externas ao cesto (como pilares ou vigas metálicas).

## 3. Delimitação e isolamento do raio de manobra
O perímetro de atuação da lança ou tesoura deve ser isolado com cones e fita zebrada para impedir a circulação de operários no nível do solo sob a área de projeção de carga suspensa.

Todas as plataformas locadas pela EquiparLoc passam por inspeção de 40 pontos com emissão de ART e checklist digital assinado antes de cada saída do pátio central. Veja as opções disponíveis em nosso [catálogo de plataformas](/locacao?cat=Trabalho+em+Altura).`,
    image: '/images/hero/hero-miniescavadeira-basculante.jpg',
    imageAlt: 'Miniescavadeira e minidumper trabalhando em obra',
    seo: analyzePostSeo({
      title: 'Segurança em trabalho em altura: requisitos NR-18 e NR-35 para plataformas elevatórias',
      slug: 'seguranca-em-trabalho-em-altura-requisitos-nr18-para-plataformas-elevatorias',
      content: 'O uso de Plataformas Móveis sobre Trabalho em Altura...',
      summary: 'Checklist obrigatório de pré-uso, inspeção visual, ancoragem de cinto com talabarte duplo e critérios de interdição preventiva em operações aéreas.',
      focusKeyword: 'segurança plataformas elevatórias NR-18',
      metaTitle: 'Segurança em Plataformas Elevatórias: Requisitos NR-18 | EquiparLoc',
      metaDescription: 'Requisitos de segurança para plataformas elevatórias segundo NR-18 e NR-35: checklist diário, ancoragem e isolamento. Consulte locação na EquiparLoc.',
      imageAlt: 'Miniescavadeira e minidumper trabalhando em obra',
    }),
    comments: [],
  },
  {
    id: 'post-03',
    slug: 'locacao-vs-compra-de-maquinario-pesado-analise-de-custo-operacional',
    title: 'Locação vs. Compra de maquinário pesado: análise de custo operacional e disponibilidade',
    status: 'published',
    category: 'Gestão Financeira',
    tags: ['CAPEX vs OPEX', 'Gestão Financeira', 'Depreciação', 'Contratos de Locação'],
    readTime: '4 min de leitura',
    viewsCount: 1250,
    publishedAt: '15 de Outubro de 2026',
    author: {
      name: 'Equipe Financeira EquiparLoc',
      role: 'Consultores de Gestão de Ativos e Planejamento de Custos',
    },
    summary: 'Avaliação comparativa entre CAPEX e OPEX, depreciação acelerada, custos de manutenção preventiva e o impacto no fluxo de caixa corporativo.',
    content: `Empresas de engenharia e construtoras buscam cada vez mais a terceirização estratégica de frotas pesadas. A locação transforma custos fixos de depreciação e manutenção preventiva em custos operacionais (OPEX) diretamente apropriados a cada centro de custo de obra.

## 1. Liberação de capital de giro e capacidade de endividamento
A aquisição de ativos pesados imobiliza limites de crédito bancário (Finame, CDC ou leasing) que poderiam ser utilizados para viabilizar insumos ou reforçar o caixa operacional. Na locação, o desembolso mensal acompanha a curva real de faturamento da medição.

## 2. Risco zero de depreciação acelerada e ociosidade de pátio
Após o término do contrato da obra, o equipamento próprio frequentemente permanece parado gerando custos de seguro, vigilância e manutenção de baterias e mangueiras ressecadas. Na locação, a desmobilização é imediata ao concluir a etapa contratual.

## 3. Frota sempre com horímetro novo e manutenção coberta
Em caso de ocorrência mecânica que não possa ser sanada no canteiro em até 24 horas, realizamos a substituição integral da máquina sem custos adicionais de mobilização.

Solicite uma análise comparativa de viabilidade com nossa equipe através da página de [solicitação de orçamento](/orcamento).`,
    image: '/images/hero/hero-obra-escavadeira-betoneira.jpg',
    imageAlt: 'Canteiro de obras com escavadeira, betoneira e gerador',
    seo: analyzePostSeo({
      title: 'Locação vs. Compra de maquinário pesado: análise de custo operacional e disponibilidade',
      slug: 'locacao-vs-compra-de-maquinario-pesado-analise-de-custo-operacional',
      content: 'Empresas de engenharia e construtoras buscam cada vez mais...',
      summary: 'Avaliação comparativa entre CAPEX e OPEX, depreciação acelerada, custos de manutenção preventiva e o impacto no fluxo de caixa corporativo.',
      focusKeyword: 'locação vs compra maquinário pesado',
      metaTitle: 'Locação vs. Compra de Maquinário Pesado: Custos OPEX | EquiparLoc',
      metaDescription: 'Análise financeira comparativa entre locação e compra de máquinas pesadas: vantagens de OPEX, depreciação zero e suporte. EquiparLoc.',
      imageAlt: 'Canteiro de obras com escavadeira, betoneira e gerador',
    }),
    comments: [],
  },
];

// Categorias iniciais da frota (mesmo arquivo do catálogo inicial).
const INITIAL_CATEGORIES: Category[] = catalogoInicial.categories as Category[];

function buildCategoriesFromEquipments(equipments: Equipment[]): Category[] {
  const categories = [...INITIAL_CATEGORIES];
  for (const eq of equipments) {
    if (eq.category && !categories.some((c) => c.name === eq.category)) {
      categories.push({
        id: `cat-${slugify(eq.category)}`,
        name: eq.category,
        group: 'maquinas',
        description: '',
        image: eq.image || '',
        order: categories.length + 1,
      });
    }
  }
  return categories;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * Atualiza bancos antigos para a versão com linhas de produto editáveis.
 * Na primeira vez cria as linhas padrão e transforma os serviços que eram fixos no
 * código (lib/servicos.ts) em categorias da linha "Serviços", editáveis no painel.
 * Devolve true se mudou algo (para gravar).
 */
/** Fotos antigas geradas por IA, trocadas por fotos reais. */
const REPLACED_IMAGES: Record<string, string> = {
  '/images/cat_escavadeira_1793461101073.jpg': '/images/hero/hero-miniescavadeira.jpg',
  '/images/cat_plataforma_1793461101024.jpg': '/images/hero/hero-miniescavadeira-basculante.jpg',
  '/images/hero_heavy_machinery_1793461100728.jpg': '/images/hero/hero-obra-escavadeira-betoneira.jpg',
  '/images/cat_retroescavadeira_1793461100792.jpg': '/images/produtos/aluguel-retroescavadeira-compacta-jcb-1cx.jpg',
  '/images/cat_gerador_1793461141901.jpg': '/images/produtos/aluguel-gerador-5-5-kva-toyama-td6000cx.jpg',
  '/images/cat_compactador_1793461140543.jpg': '/images/hero/hero-compactador.jpg',
  '/images/cat_minicarregadeira_1793461141803.jpg': '/images/produtos/aluguel-minicarregadeira-new-holland-l170.jpg',
  '/images/cat_manipulador_1793461103170.jpg': '/images/hero/hero-miniescavadeira-basculante.jpg',
};

/** Atualiza fotos removidas e o horário antigo em bancos já existentes. */
function upgradeContent(db: DatabaseSchema): boolean {
  let changed = false;
  const before = JSON.stringify(db);
  let after = before;
  for (const [from, to] of Object.entries(REPLACED_IMAGES)) after = after.split(from).join(to);
  if (after !== before) {
    Object.assign(db, JSON.parse(after));
    changed = true;
  }
  if (db.settings?.businessHours?.includes('07h30 às 18h00')) {
    db.settings.businessHours = db.settings.businessHours.replace('07h30 às 18h00', '08h às 17h');
    changed = true;
  }
  return changed;
}

function upgradeDatabase(db: DatabaseSchema): boolean {
  const contentChanged = upgradeContent(db);
  if (Array.isArray(db.productLines) && db.productLines.length) return contentChanged;
  db.productLines = DEFAULT_PRODUCT_LINES.map((l) => ({ ...l }));
  if (!db.categories.some((c) => c.group === 'servicos')) {
    const maxOrder = db.categories.reduce((max, c) => Math.max(max, c.order), 0);
    SERVICOS.forEach((sv, i) => {
      const id = `cat-${slugify(sv.nome)}`;
      if (db.categories.some((c) => c.id === id || c.name.toLowerCase() === sv.nome.toLowerCase())) return;
      db.categories.push({
        id,
        name: sv.nome,
        group: 'servicos',
        description: sv.resumo,
        image: sv.imagem,
        order: maxOrder + i + 1,
        content: [...sv.paragrafos, sv.informe].join('\n\n'),
        highlights: [...sv.itens],
      });
    });
  }
  return true;
}

// In-memory cache for fast runtime response
let memoryDb: DatabaseSchema | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

const BACKUP_PATH = `${DB_PATH}.bak`;

/** Lê e valida o arquivo do banco. Devolve null se estiver ausente, vazio ou corrompido. */
function readDatabaseFile(file: string): DatabaseSchema | null {
  try {
    if (!fs.existsSync(file)) return null;
    const parsed = JSON.parse(fs.readFileSync(file, 'utf-8')) as DatabaseSchema;
    if (!parsed || !Array.isArray(parsed.equipments) || !Array.isArray(parsed.quotes)) return null;
    return parsed;
  } catch (e) {
    console.error(`Erro ao ler ${file}:`, e);
    return null;
  }
}

export function getDatabase(): DatabaseSchema {
  if (memoryDb) {
    return memoryDb;
  }

  ensureDataDir();

  if (fs.existsSync(DB_PATH)) {
    const parsed = readDatabaseFile(DB_PATH) ?? readDatabaseFile(BACKUP_PATH);
    if (!parsed) {
      // NUNCA substituir um banco existente pelos dados de exemplo: isso apagaria
      // orçamentos, categorias e edições. Falha alto para alguém investigar.
      throw new Error(
        `Não foi possível ler ${DB_PATH} nem a cópia de segurança. O arquivo foi mantido intacto; verifique-o manualmente.`
      );
    }
    // Bancos antigos não tinham categorias cadastradas: cria a partir do padrão
    // e de qualquer categoria já usada nos equipamentos.
    let changed = false;
    if (!Array.isArray(parsed.categories)) {
      parsed.categories = buildCategoriesFromEquipments(parsed.equipments || []);
      changed = true;
    }
    if (upgradeDatabase(parsed)) changed = true;
    memoryDb = parsed;
    if (changed) saveDatabase(parsed);
    return memoryDb;
  }

  // Primeiro uso (arquivo ainda não existe): cria com os dados iniciais
  const initialData: DatabaseSchema = {
    categories: INITIAL_CATEGORIES,
    equipments: INITIAL_EQUIPMENTS,
    quotes: INITIAL_QUOTES,
    blogPosts: INITIAL_BLOG,
    settings: INITIAL_SETTINGS,
  };
  upgradeDatabase(initialData);

  saveDatabase(initialData);
  memoryDb = initialData;
  return initialData;
}

/*
 * Cópia diária: na primeira gravação de cada dia, guarda a versão anterior do banco
 * em data/backups/database-AAAA-MM-DD.json e mantém os últimos BACKUP_DAYS dias.
 * Arquivos com permissão só do dono (0600) no Linux. Para proteger contra perda do
 * servidor, copie a pasta data/backups para fora dele (ex.: backup da hospedagem).
 */
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const BACKUP_DAYS = Math.max(1, Number(process.env.BACKUP_DAYS) || 30);

function dailySnapshot() {
  try {
    if (!fs.existsSync(DB_PATH)) return;
    const day = new Date().toISOString().slice(0, 10);
    const target = path.join(BACKUP_DIR, `database-${day}.json`);
    if (fs.existsSync(target)) return;
    fs.mkdirSync(BACKUP_DIR, { recursive: true, mode: 0o700 });
    fs.copyFileSync(DB_PATH, target);
    fs.chmodSync(target, 0o600);
    const old = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => /^database-\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .sort()
      .slice(0, -BACKUP_DAYS);
    for (const f of old) fs.rmSync(path.join(BACKUP_DIR, f), { force: true });
  } catch (e) {
    console.error('Não foi possível criar a cópia diária do banco:', e);
  }
}

export function saveDatabase(data: DatabaseSchema): void {
  ensureDataDir();
  memoryDb = data;
  dailySnapshot();
  try {
    // Gravação atômica: escreve num arquivo temporário e só então troca pelo oficial.
    // Assim ninguém lê um arquivo pela metade, e uma queda no meio não corrompe o banco.
    const tmp = `${DB_PATH}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), { encoding: 'utf-8', mode: 0o600 });
    if (fs.existsSync(DB_PATH)) {
      fs.copyFileSync(DB_PATH, BACKUP_PATH); // cópia da versão anterior
    }
    try {
      fs.renameSync(tmp, DB_PATH);
    } catch {
      // No Windows a troca pode falhar se outro processo estiver lendo o arquivo:
      // grava direto (a cópia .bak acima garante a recuperação).
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
      fs.rmSync(tmp, { force: true });
    }
  } catch (e) {
    console.error('Error saving database file:', e);
  }
}

// Linhas de produto (máquinas, ferramentas, serviços...)
export function getProductLines(): ProductLine[] {
  const db = getDatabase();
  return [...(db.productLines || DEFAULT_PRODUCT_LINES)].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export function saveProductLine(input: Partial<ProductLine> & { name: string }): ProductLine {
  const db = getDatabase();
  const lines = (db.productLines ||= DEFAULT_PRODUCT_LINES.map((l) => ({ ...l })));
  const name = input.name.trim().slice(0, 40);
  if (!name) throw new CategoryError('Informe o nome da linha.');
  if (lines.some((l) => l.id !== input.id && l.name.toLowerCase() === name.toLowerCase())) {
    throw new CategoryError(`Já existe uma linha chamada "${name}".`);
  }
  const kind = input.kind === 'servico' ? 'servico' : 'locacao';
  const description = (input.description || '').trim().slice(0, 200);
  const existing = input.id ? lines.find((l) => l.id === input.id) : undefined;
  if (existing) {
    existing.name = name;
    existing.kind = kind;
    existing.description = description;
    if (Number.isFinite(Number(input.order)) && input.order !== undefined) existing.order = Number(input.order);
    saveDatabase(db);
    return existing;
  }
  let id = slugify(name) || `linha-${Date.now()}`;
  if (lines.some((l) => l.id === id)) id = `${id}-${Date.now()}`;
  const created: ProductLine = {
    id,
    name,
    kind,
    description,
    order: lines.reduce((max, l) => Math.max(max, l.order), 0) + 1,
  };
  lines.push(created);
  saveDatabase(db);
  return created;
}

/** Exclui a linha. Se tiver categorias, elas vão para a linha `moveTo`. */
export function deleteProductLine(id: string, moveTo?: string): void {
  const db = getDatabase();
  const lines = db.productLines || [];
  const line = lines.find((l) => l.id === id);
  if (!line) throw new CategoryError('Linha não encontrada.');
  if (lines.length <= 1) throw new CategoryError('O catálogo precisa de pelo menos uma linha.');
  const inUse = db.categories.filter((c) => c.group === id);
  if (inUse.length) {
    const target = moveTo ? lines.find((l) => l.id === moveTo && l.id !== id) : undefined;
    if (!target) {
      throw new CategoryError(`A linha "${line.name}" tem ${inUse.length} categoria(s). Escolha para qual linha elas vão.`);
    }
    inUse.forEach((c) => (c.group = target.id));
  }
  db.productLines = lines.filter((l) => l.id !== id);
  saveDatabase(db);
}

// Helper methods for Categories
export function getAllCategories(): Category[] {
  const db = getDatabase();
  return [...db.categories].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

/** Categorias com a contagem de itens ativos. `onlyWithItems` esconde as vazias (uso no site). */
export function getCategoriesWithCount(onlyWithItems = false): CategoryWithCount[] {
  const db = getDatabase();
  const all = getAllCategories();
  const list = all.map((c) => {
    // A categoria principal conta também os itens das subcategorias
    const names = namesInBranch(c.name, all);
    return {
      ...c,
      count: db.equipments.filter((eq) => names.has(eq.category) && eq.status === 'active').length,
    };
  });
  return onlyWithItems ? list.filter((c) => c.count > 0) : list;
}

export class CategoryError extends Error {}

export function saveCategory(raw: Partial<Category> & { name: string }): Category {
  const db = getDatabase();
  // A contagem de itens é calculada na leitura: nunca grava no banco
  const { count: _count, ...input } = raw as Partial<CategoryWithCount> & { name: string };
  const name = input.name.trim();
  if (!name) throw new CategoryError('Informe o nome da categoria.');

  const duplicate = db.categories.find(
    (c) => c.id !== input.id && c.name.toLowerCase() === name.toLowerCase()
  );
  if (duplicate) throw new CategoryError(`Já existe uma categoria chamada "${duplicate.name}".`);

  const index = input.id ? db.categories.findIndex((c) => c.id === input.id) : -1;

  // Categoria principal (só um nível de subcategoria, como no WordPress simples)
  let parentId: string | undefined;
  const lines = getProductLines();
  let group: CategoryGroup = lines.some((l) => l.id === input.group) ? (input.group as string) : lines[0]?.id || 'maquinas';
  if (input.parentId) {
    const parent = db.categories.find((c) => c.id === input.parentId);
    if (!parent) throw new CategoryError('A categoria principal escolhida não existe mais.');
    if (parent.id === input.id) throw new CategoryError('Uma categoria não pode ficar dentro dela mesma.');
    if (parent.parentId) {
      throw new CategoryError(`"${parent.name}" já é uma subcategoria. Escolha uma categoria principal.`);
    }
    if (input.id && db.categories.some((c) => c.parentId === input.id)) {
      throw new CategoryError('Esta categoria tem subcategorias, por isso não pode virar subcategoria.');
    }
    parentId = parent.id;
    group = parent.group; // a subcategoria fica na mesma linha da principal
  }

  if (index >= 0) {
    const previous = db.categories[index];
    const updated: Category = {
      ...previous,
      ...input,
      name,
      group,
      parentId,
      order: Number.isFinite(Number(input.order)) ? Number(input.order) : previous.order,
    };
    if (!parentId) delete updated.parentId;
    db.categories[index] = updated;
    // Subcategorias acompanham a linha (máquinas/ferramentas) da principal
    db.categories.forEach((c) => {
      if (c.parentId === updated.id) c.group = updated.group;
    });
    // Renomear a categoria atualiza os equipamentos que usam o nome antigo
    if (previous.name !== name) {
      db.equipments.forEach((eq) => {
        if (eq.category === previous.name) eq.category = name;
      });
    }
    saveDatabase(db);
    return updated;
  }

  let id = `cat-${slugify(name) || Date.now()}`;
  if (db.categories.some((c) => c.id === id)) id = `${id}-${Date.now()}`;
  const maxOrder = db.categories.reduce((max, c) => Math.max(max, c.order), 0);
  const created: Category = {
    id,
    name,
    group,
    ...(parentId ? { parentId } : {}),
    description: input.description?.trim() || '',
    image: input.image || '',
    ...(input.content?.trim() ? { content: input.content.trim() } : {}),
    ...(input.highlights?.length ? { highlights: input.highlights.map((h) => h.trim()).filter(Boolean) } : {}),
    order: Number.isFinite(Number(input.order)) && input.order !== undefined ? Number(input.order) : maxOrder + 1,
  };
  db.categories.push(created);
  saveDatabase(db);
  return created;
}

/**
 * Exclui a categoria. Se ela tiver itens, eles vão para `moveTo` (outra categoria),
 * como o WordPress faz ao mandar os posts para "Sem categoria".
 */
export function deleteCategory(id: string, moveTo?: string): void {
  const db = getDatabase();
  const category = db.categories.find((c) => c.id === id);
  if (!category) throw new CategoryError('Categoria não encontrada.');
  const inUse = db.equipments.filter((eq) => eq.category === category.name);
  if (inUse.length > 0) {
    const target = moveTo ? db.categories.find((c) => c.name === moveTo && c.id !== id) : undefined;
    if (!target) {
      throw new CategoryError(
        `A categoria "${category.name}" tem ${inUse.length} ${inUse.length === 1 ? 'item' : 'itens'}. Escolha para qual categoria mover os produtos.`
      );
    }
    inUse.forEach((eq) => (eq.category = target.name));
  }
  db.categories = db.categories.filter((c) => c.id !== id);
  // Como no WordPress: as subcategorias da excluída viram categorias principais
  db.categories.forEach((c) => {
    if (c.parentId === id) delete c.parentId;
  });
  saveDatabase(db);
}

// Helper methods for Equipments
export function getAllEquipments(): Equipment[] {
  const db = getDatabase();
  return db.equipments;
}

export function getEquipmentBySlug(slug: string): Equipment | undefined {
  const db = getDatabase();
  return db.equipments.find((eq) => eq.slug === slug);
}

export function getEquipmentById(id: string): Equipment | undefined {
  const db = getDatabase();
  return db.equipments.find((eq) => eq.id === id);
}

export function saveEquipment(eq: Equipment): Equipment {
  const db = getDatabase();
  const index = db.equipments.findIndex((item) => item.id === eq.id);
  if (index >= 0) {
    db.equipments[index] = eq;
  } else {
    db.equipments.unshift(eq);
  }
  saveDatabase(db);
  return eq;
}

export function deleteEquipment(id: string): boolean {
  const db = getDatabase();
  const initialLength = db.equipments.length;
  db.equipments = db.equipments.filter((eq) => eq.id !== id);
  if (db.equipments.length !== initialLength) {
    saveDatabase(db);
    return true;
  }
  return false;
}

// Helper methods for Quotes
export function getAllQuotes(): QuoteRequest[] {
  const db = getDatabase();
  return db.quotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createQuote(data: Omit<QuoteRequest, 'id' | 'protocol' | 'createdAt' | 'updatedAt' | 'notes'>): QuoteRequest {
  const db = getDatabase();
  const count = db.quotes.length + 1043;
  const protocol = `EQ-2026-${count}`;
  const id = `orc-${Date.now()}`;
  const now = new Date().toISOString();

  const newQuote: QuoteRequest = {
    ...data,
    id,
    protocol,
    createdAt: now,
    updatedAt: now,
    notes: [
      {
        id: `note-${Date.now()}`,
        date: now,
        author: 'Sistema',
        text: 'Solicitação de orçamento registrada com sucesso.',
      },
    ],
  };

  db.quotes.unshift(newQuote);
  saveDatabase(db);
  return newQuote;
}

export function updateQuoteStatus(id: string, status: QuoteRequest['status'], noteText?: string, author: string = 'Atendente'): QuoteRequest | null {
  const db = getDatabase();
  const quote = db.quotes.find((q) => q.id === id);
  if (!quote) return null;

  quote.status = status;
  quote.updatedAt = new Date().toISOString();
  if (noteText) {
    quote.notes.push({
      id: `note-${Date.now()}`,
      date: new Date().toISOString(),
      author,
      text: noteText,
    });
  }

  saveDatabase(db);
  return quote;
}

export function deleteQuote(id: string): boolean {
  const db = getDatabase();
  const prev = db.quotes.length;
  db.quotes = db.quotes.filter((q) => q.id !== id);
  if (db.quotes.length !== prev) {
    saveDatabase(db);
    return true;
  }
  return false;
}

// Helper methods for Blog
export function getAllBlogPosts(): BlogPost[] {
  const db = getDatabase();
  return db.blogPosts;
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  const db = getDatabase();
  return db.blogPosts.find((p) => p.slug === slug);
}

export function saveBlogPost(post: BlogPost): BlogPost {
  const db = getDatabase();
  const index = db.blogPosts.findIndex((p) => p.id === post.id);
  
  const computedSeo = post.seo || analyzePostSeo({
    title: post.title,
    slug: post.slug,
    content: post.content,
    summary: post.summary,
    focusKeyword: '',
    metaTitle: post.title,
    metaDescription: post.summary,
    imageAlt: post.imageAlt || post.title,
  });

  const postToSave: BlogPost = {
    ...post,
    seo: computedSeo,
    comments: post.comments || [],
    tags: post.tags || [],
    status: post.status || 'published',
    viewsCount: post.viewsCount ?? 0,
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    db.blogPosts[index] = postToSave;
  } else {
    db.blogPosts.unshift(postToSave);
  }
  saveDatabase(db);
  return postToSave;
}

export function incrementPostViews(slug: string): number {
  const db = getDatabase();
  const post = db.blogPosts.find((p) => p.slug === slug);
  if (post) {
    post.viewsCount = (post.viewsCount || 0) + 1;
    saveDatabase(db);
    return post.viewsCount;
  }
  return 0;
}

export function addPostComment(
  slug: string,
  commentData: { authorName: string; authorEmail: string; content: string }
): BlogComment | null {
  const db = getDatabase();
  const post = db.blogPosts.find((p) => p.slug === slug);
  if (!post) return null;

  const newComment: BlogComment = {
    id: `comm-${Date.now()}`,
    authorName: commentData.authorName.trim(),
    authorEmail: commentData.authorEmail.trim(),
    content: commentData.content.trim(),
    createdAt: new Date().toISOString(),
    status: 'pending', // Requires admin approval
  };

  if (!post.comments) post.comments = [];
  post.comments.unshift(newComment);
  saveDatabase(db);
  return newComment;
}

export function updateCommentStatus(
  postId: string,
  commentId: string,
  status: 'approved' | 'pending' | 'spam',
  reply?: string,
  replyAuthor: string = 'Equipe EquiparLoc'
): BlogComment | null {
  const db = getDatabase();
  const post = db.blogPosts.find((p) => p.id === postId);
  if (!post || !post.comments) return null;

  const comment = post.comments.find((c) => c.id === commentId);
  if (!comment) return null;

  comment.status = status;
  if (reply !== undefined) {
    comment.reply = reply;
    comment.replyAuthor = replyAuthor;
    comment.replyAt = new Date().toISOString();
  }

  saveDatabase(db);
  return comment;
}

export function deletePostComment(postId: string, commentId: string): boolean {
  const db = getDatabase();
  const post = db.blogPosts.find((p) => p.id === postId);
  if (!post || !post.comments) return false;

  const prevLen = post.comments.length;
  post.comments = post.comments.filter((c) => c.id !== commentId);
  if (post.comments.length !== prevLen) {
    saveDatabase(db);
    return true;
  }
  return false;
}

export function deleteBlogPost(id: string): boolean {
  const db = getDatabase();
  const prev = db.blogPosts.length;
  db.blogPosts = db.blogPosts.filter((p) => p.id !== id);
  if (db.blogPosts.length !== prev) {
    saveDatabase(db);
    return true;
  }
  return false;
}

// Helper methods for Settings
export function getCompanySettings(): CompanySettings {
  const db = getDatabase();
  return db.settings;
}

export function updateCompanySettings(settings: Partial<CompanySettings>): CompanySettings {
  const db = getDatabase();
  db.settings = { ...db.settings, ...settings };
  saveDatabase(db);
  return db.settings;
}

// Abertura (hero) da página inicial
export function getHeroSettings(): HeroSettings {
  const db = getDatabase();
  return { ...DEFAULT_HERO, ...(db.hero || {}) };
}

export function saveHeroSettings(hero: HeroSettings): HeroSettings {
  const db = getDatabase();
  db.hero = hero;
  saveDatabase(db);
  return hero;
}
