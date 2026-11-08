import type { Equipment } from './types';

/** O número que define o equipamento na hora de escolher (o que vai grande na placa). */
export interface KeySpec {
  value: string;
  unit: string;
  label: string;
}

const firstNumber = (text?: string) => {
  if (!text) return undefined;
  const m = text.replace(/\./g, '').match(/(\d+(?:,\d+)?)/);
  return m ? parseFloat(m[1].replace(',', '.')) : undefined;
};

const br = (n: number, digits = 1) =>
  n.toLocaleString('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: 0 });

export function keySpec(eq: Equipment): KeySpec {
  const power = eq.specs.power || '';
  const category = eq.category.toLowerCase();

  // Geradores e compressores: potência / vazão (no nome ou na ficha)
  const kva = `${eq.name} ${power}`.match(/(\d+(?:[.,]\d+)?)\s*kva/i);
  if (kva) return { value: br(parseFloat(kva[1].replace(',', '.')), 0), unit: 'kVA', label: 'potência' };
  const pcm = `${eq.name} ${power}`.match(/(\d+(?:[.,]\d+)?)\s*pcm/i);
  if (pcm) return { value: br(parseFloat(pcm[1].replace(',', '.')), 0), unit: 'pcm', label: 'vazão de ar' };

  // Plataformas: altura de trabalho (vem no nome, ex.: "Plataforma ... 16m";
  // o "alcance" da ficha é horizontal e não serve aqui)
  if (category.includes('altura')) {
    const h = eq.name.match(/(\d+(?:,\d+)?)\s*m\b/i);
    if (h) return { value: h[1], unit: 'm', label: 'altura de trabalho' };
  }

  // Demais: peso operacional (em toneladas a partir de 1.000 kg)
  const kg = firstNumber(eq.specs.operatingWeight);
  if (kg) {
    return kg >= 1000
      ? { value: br(kg / 1000), unit: 't', label: 'peso operacional' }
      : { value: br(kg, 0), unit: 'kg', label: 'peso' };
  }

  const n = firstNumber(power);
  return n ? { value: br(n, 0), unit: power.replace(/[\d.,\s@].*$/, '').trim() || '', label: 'potência' } : { value: '—', unit: '', label: '' };
}

/** Equipamento com pronta entrega? (texto livre do cadastro) */
export const isReadyToShip = (eq: Equipment) => /pronta|imediat|\b\d{1,2} ?h\b|hoje/i.test(eq.deliveryTime || '');
