'use client';

import { useEffect } from 'react';
import { useCompany } from '@/lib/company-context';
import { equipmentPath } from '@/lib/site';
import { formatPhone, hoursParts, waHref } from '@/lib/company';

/*
 * WebMCP: ferramentas que assistentes de IA dentro do navegador podem usar nesta página
 * (navigator.modelContext). Só leitura: buscar equipamentos e ver os contatos.
 * Navegadores sem esse recurso simplesmente ignoram.
 */

interface ToolResult {
  content: { type: 'text'; text: string }[];
}

interface ModelContext {
  registerTool: (tool: {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    execute: (input: Record<string, unknown>) => Promise<ToolResult>;
  }) => unknown;
  unregisterTool?: (name: string) => void;
}

interface SearchItem {
  name: string;
  code: string;
  slug: string;
  category: string;
  summary?: string;
}

const text = (t: string): ToolResult => ({ content: [{ type: 'text', text: t }] });

export function AgentTools() {
  const company = useCompany();

  useEffect(() => {
    const mc = (navigator as Navigator & { modelContext?: ModelContext }).modelContext;
    if (!mc?.registerTool) return;
    const origin = window.location.origin;
    const names = ['buscar_equipamentos', 'contato_equiparloc'];

    try {
      mc.registerTool({
        name: names[0],
        description:
          'Busca máquinas e ferramentas para locação no catálogo da EquiparLoc (ex.: "betoneira", "martelo demolidor"). Devolve nome, código, categoria e link de cada equipamento.',
        inputSchema: {
          type: 'object',
          properties: { consulta: { type: 'string', description: 'O que procurar, em português' } },
          required: ['consulta'],
        },
        async execute(input) {
          const q = String(input.consulta || '').trim().slice(0, 100);
          if (!q) return text('Informe o que procurar.');
          const res = await fetch(`/api/search?type=equipment&limit=8&q=${encodeURIComponent(q)}`);
          if (!res.ok) return text('A busca não respondeu. Tente de novo.');
          const data = (await res.json()) as { equipments?: SearchItem[] };
          const list = data.equipments || [];
          if (!list.length) return text(`Nenhum equipamento encontrado para "${q}".`);
          return text(
            list
              .map((e) => `- ${e.name} (código ${e.code}, ${e.category}): ${origin}${equipmentPath(e)}${e.summary ? `. ${e.summary}` : ''}`)
              .join('\n')
          );
        },
      });

      mc.registerTool({
        name: names[1],
        description: 'Telefone, WhatsApp, e-mail, endereço e horário de atendimento da EquiparLoc, e o link para pedir orçamento.',
        inputSchema: { type: 'object', properties: {} },
        async execute() {
          return text(
            [
              `Telefone: ${company.phone}`,
              `WhatsApp: ${formatPhone(company.whatsapp)} (${waHref(company.whatsapp)})`,
              `E-mail: ${company.email}`,
              `Endereço: ${company.address}`,
              ...hoursParts(company.businessHours).map((h) => `Horário: ${h}`),
              `Pedir orçamento: ${origin}/orcamento`,
            ].join('\n')
          );
        },
      });
    } catch {
      // Recurso experimental: se o navegador recusar, o site segue normal
    }

    return () => {
      names.forEach((n) => {
        try {
          mc.unregisterTool?.(n);
        } catch {
          /* nada a fazer */
        }
      });
    };
  }, [company]);

  return null;
}
