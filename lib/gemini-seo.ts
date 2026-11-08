import { GoogleGenAI, Type } from '@google/genai';
import { deriveFocusKeyword } from './seo-optimizer';

export interface GeminiSeoInput {
  title: string;
  content: string;
  summary?: string;
  category?: string;
  image?: string;
  imageAlt?: string;
  existingTags?: string[];
}

export interface GeminiSeoResult {
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
  imageAlt: string;
  suggestedTags: string[];
  summary: string;
  source: 'gemini' | 'heuristic';
}

/**
 * Generates SEO meta-title, meta-description, image alt text, and suggested tags
 * using Gemini 3.8 Flash via @google/genai server-side SDK.
 * Includes automatic heuristic fallback if API key is not configured or on network issue.
 */
export async function generateSeoWithGemini(input: GeminiSeoInput): Promise<GeminiSeoResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Fallback heuristic function
  const runHeuristicFallback = (): GeminiSeoResult => {
    const focusKeyword = deriveFocusKeyword(input.title);
    const cleanTitle = input.title.replace(/\s*\|.*$/, '').trim();
    const metaTitle = `${cleanTitle.slice(0, 48)} | EquiparLoc`;

    let metaDescription = '';
    if (input.summary && input.summary.length >= 80) {
      metaDescription = input.summary.slice(0, 140).trim();
    } else {
      const firstPara = input.content
        .split('\n\n')
        .find((p) => p.trim() && !p.startsWith('#') && !p.startsWith('-')) || input.title;
      metaDescription = firstPara.slice(0, 130).trim();
    }
    if (!metaDescription.toLowerCase().includes('equipar')) {
      metaDescription = `${metaDescription}. Consulte locação técnica na EquiparLoc.`.slice(0, 155);
    }

    const imageAlt =
      input.imageAlt && input.imageAlt.length > 10
        ? input.imageAlt
        : `${cleanTitle} - Maquinário pesado para obras | EquiparLoc`;

    const suggestedTags = Array.from(
      new Set([
        ...(input.existingTags || []),
        input.category || 'Equipamentos Pesados',
        'Locação de Máquinas',
        'Engenharia Civil',
        'Segurança Operacional',
      ])
    ).slice(0, 5);

    const summary =
      input.summary && input.summary.length >= 30
        ? input.summary
        : input.content.slice(0, 150).replace(/[#*`_]/g, '').trim() + '...';

    return {
      focusKeyword,
      metaTitle,
      metaDescription,
      imageAlt,
      suggestedTags,
      summary,
      source: 'heuristic',
    };
  };

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return runHeuristicFallback();
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `Analise o seguinte rascunho de postagem técnica para o blog da EquiparLoc (empresa líder em locação de equipamentos pesados e máquinas industriais):

TÍTULO DO ARTIGO: "${input.title}"
CATEGORIA: "${input.category || 'Engenharia & Planejamento'}"
TAGS EXISTENTES: ${input.existingTags?.length ? input.existingTags.join(', ') : 'Nenhuma'}
IMAGEM ATUAL: ${input.image || 'Fotografia de maquinário pesado'}
TEXTO ALT ATUAL: "${input.imageAlt || ''}"

CONTEÚDO DO ARTIGO (Trecho):
"""
${input.content.slice(0, 2500)}
"""

Gere os metadados técnicos de SEO seguindo estritamente as regras:
- focusKeyword: A melhor palavra-chave em português (2 a 4 termos) de maior interesse para quem aluga máquinas.
- metaTitle: 45 a 60 caracteres no máximo, deve conter a palavra-chave e terminar com " | EquiparLoc".
- metaDescription: 130 a 155 caracteres no máximo, persuasiva, com a palavra-chave e chamada para locação/contato na EquiparLoc.
- imageAlt: Texto alternativo descritivo e acessível para a imagem destacada, detalhando a máquina e sua aplicação.
- suggestedTags: Array com 4 a 6 tags técnicas altamente relevantes (ex: "Escavadeiras", "Terraplenagem", "NR-12").
- summary: Resumo executivo de 1 a 2 frases para os cards de listagem no portal.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'Você é o motor de inteligência artificial da EquiparLoc, encarregado de otimizar SEO, metadados, acessibilidade de imagens e tags para posts do setor de engenharia e locação pesada.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            focusKeyword: {
              type: Type.STRING,
              description: 'Palavra-chave principal de foco para SEO (2 a 4 termos)',
            },
            metaTitle: {
              type: Type.STRING,
              description: 'Meta-título otimizado para o Google (45 a 60 caracteres)',
            },
            metaDescription: {
              type: Type.STRING,
              description: 'Meta-descrição convincente com CTA (130 a 155 caracteres)',
            },
            imageAlt: {
              type: Type.STRING,
              description: 'Texto alternativo ALT acessível e descritivo da imagem',
            },
            suggestedTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Array de 4 a 6 tags técnicas sugeridas para o artigo',
            },
            summary: {
              type: Type.STRING,
              description: 'Resumo executivo de 1 a 2 frases para o card do artigo',
            },
          },
          required: ['focusKeyword', 'metaTitle', 'metaDescription', 'imageAlt', 'suggestedTags', 'summary'],
        },
      },
    });

    const rawText = response.text?.trim();
    if (!rawText) {
      return runHeuristicFallback();
    }

    const parsed = JSON.parse(rawText) as GeminiSeoResult;

    return {
      focusKeyword: parsed.focusKeyword || deriveFocusKeyword(input.title),
      metaTitle: parsed.metaTitle || `${input.title.slice(0, 48)} | EquiparLoc`,
      metaDescription:
        parsed.metaDescription ||
        `${input.title.slice(0, 100)}. Conheça os diferenciais de locação da EquiparLoc.`,
      imageAlt: parsed.imageAlt || `${input.title} - EquiparLoc`,
      suggestedTags: Array.isArray(parsed.suggestedTags) && parsed.suggestedTags.length > 0
        ? parsed.suggestedTags
        : ['Equipamentos Pesados', 'Construção Civil'],
      summary: parsed.summary || input.content.slice(0, 150) + '...',
      source: 'gemini',
    };
  } catch (error) {
    console.error('Error in generateSeoWithGemini, using heuristic fallback:', error);
    return runHeuristicFallback();
  }
}
