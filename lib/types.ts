/** Nome da categoria (as categorias são cadastradas no painel CRM). */
export type EquipmentCategory = string;

/** Identificador da linha de produto (ex.: "maquinas", "ferramentas", "servicos"). */
export type CategoryGroup = string;

/** Tipo da linha: itens para alugar (página Locação) ou serviços prestados (página Serviços). */
export type ProductLineKind = 'locacao' | 'servico';

/** Linha de produto, editável no painel (ex.: Máquinas pesadas, Ferramentas, Serviços). */
export interface ProductLine {
  /** Identificador fixo (não muda ao renomear) */
  id: string;
  name: string;
  /** Frase curta que aparece no site acima das categorias da linha */
  description: string;
  kind: ProductLineKind;
  order: number;
}

/** Dados do menu e do rodapé do site (montados no servidor). */
export interface MenuCategory {
  name: string;
  count: number;
  group: CategoryGroup;
}

export interface SiteMenu {
  /** Linhas de locação, na ordem do painel */
  lines: { id: string; name: string }[];
  /** Categorias principais das linhas de locação com itens no site */
  categories: MenuCategory[];
  /** Serviços (categorias das linhas do tipo Serviço) */
  services: { slug: string; name: string; summary: string; image: string }[];
}

export const PRODUCT_LINE_KIND_LABELS: Record<ProductLineKind, string> = {
  locacao: 'Locação',
  servico: 'Serviço',
};

/** Linhas iniciais (bancos antigos recebem estas na primeira leitura). */
export const DEFAULT_PRODUCT_LINES: ProductLine[] = [
  { id: 'maquinas', name: 'Máquinas pesadas', description: '', kind: 'locacao', order: 1 },
  { id: 'ferramentas', name: 'Ferramentas', description: '', kind: 'locacao', order: 2 },
  { id: 'servicos', name: 'Serviços', description: 'Além da locação, fazemos o serviço com equipe e máquinas próprias.', kind: 'servico', order: 3 },
];

export interface Category {
  id: string;
  /** Nome exibido e gravado em cada equipamento (ex.: "Terraplenagem & Escavação") */
  name: string;
  group: CategoryGroup;
  /** Categoria principal desta (vazio = é uma categoria principal). Só um nível de subcategoria. */
  parentId?: string;
  description: string;
  image: string;
  /** Ordem de exibição (menor aparece primeiro) */
  order: number;
  /** Texto completo (parágrafos separados por linha em branco). Usado na página Serviços. */
  content?: string;
  /** Lista "o que está incluído", um item por linha */
  highlights?: string[];
}

/** Categoria com a quantidade de itens ativos (para exibição no site) */
export interface CategoryWithCount extends Category {
  count: number;
}

export interface TechnicalSpecs {
  operatingWeight: string; // Peso Operacional
  power: string; // Potência
  bucketCapacity?: string; // Capacidade da Caçamba / Carga
  maxReach?: string; // Alcance Horizontal / Altura
  maxDigDepth?: string; // Profundidade de Escavação
  fuelType: string; // Combustível (Diesel S10, Elétrico, etc.)
  fuelTankCapacity?: string; // Capacidade do Tanque
  dimensions?: string; // Dimensões (C x L x A)
  additional?: Record<string, string>;
}

export interface Equipment {
  id: string;
  code: string;
  name: string;
  slug: string;
  category: EquipmentCategory;
  image: string;
  gallery: string[];
  status: 'active' | 'draft';
  isFeatured: boolean;
  summary: string;
  description: string;
  specs: TechnicalSpecs;
  features: string[];
  applications: string[];
  safetyNotes: string;
  deliveryTime: string;
}

export type QuoteStatus = 'novo' | 'em_atendimento' | 'proposta_enviada' | 'concluido' | 'perdido';

export interface QuoteNote {
  id: string;
  date: string;
  author: string;
  text: string;
}

export interface QuoteRequest {
  id: string;
  protocol: string;
  customerName: string;
  companyName?: string;
  email: string;
  phone: string;
  equipmentId?: string;
  equipmentName: string;
  rentalPeriod: string;
  siteLocation: string;
  needsOperator: boolean;
  needsTransport: boolean;
  message?: string;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
  notes: QuoteNote[];
}

export type PostStatus = 'published' | 'draft' | 'scheduled';

export interface PostSeoChecklist {
  keywordInTitle: boolean;
  keywordInMetaDesc: boolean;
  keywordInFirstParagraph: boolean;
  keywordInSubheading: boolean;
  titleLengthValid: boolean;
  metaDescLengthValid: boolean;
  contentLengthValid: boolean;
  imageAltContainsKeyword: boolean;
  subheadingsPresent: boolean;
  internalLinksPresent: boolean;
}

export interface PostSeoData {
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalUrl?: string;
  score: number;
  readabilityScore: 'Fácil' | 'Médio' | 'Técnico';
  checklist: PostSeoChecklist;
}

export interface BlogComment {
  id: string;
  authorName: string;
  authorEmail: string;
  content: string;
  createdAt: string;
  date?: string;
  status: 'pending' | 'approved' | 'spam';
  reply?: string;
  replyAuthor?: string;
  replyAt?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  status: PostStatus;
  category: string;
  tags: string[];
  readTime: string;
  views?: number;
  viewsCount?: number;
  publishedAt: string;
  scheduledFor?: string;
  updatedAt?: string;
  author:
    | {
        name: string;
        role: string;
        avatar?: string;
      }
    | string;
  summary: string;
  content: string;
  image: string;
  imageAlt: string;
  seo: PostSeoData;
  comments: BlogComment[];
  featured?: boolean;
}

export interface CompanySettings {
  companyName: string;
  tradeName: string;
  cnpj: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  businessHours: string;
  gaMeasurementId: string;
  adminPin: string;
}

export interface DatabaseSchema {
  /** Linhas de produto (máquinas, ferramentas, serviços...). Bancos antigos não têm. */
  productLines?: ProductLine[];
  categories: Category[];
  equipments: Equipment[];
  quotes: QuoteRequest[];
  blogPosts: BlogPost[];
  settings: CompanySettings;
  /** Abertura da página inicial, editável no painel */
  hero?: HeroSettings;
}

/** Abertura (hero) da página inicial */
export interface HeroSettings {
  /** Linha pequena acima do título */
  eyebrow: string;
  title: string;
  text: string;
  /** Caminho da foto de fundo (/images/hero/... ou /api/midia/hero/...) */
  image: string;
  imageAlt: string;
  /** Parte da foto que fica sempre visível ao recortar */
  focus: 'left' | 'center' | 'right';
  primaryLabel: string;
  secondaryLabel: string;
  /** Mostra o calendário de locação ao lado do título */
  showBoard: boolean;
}
