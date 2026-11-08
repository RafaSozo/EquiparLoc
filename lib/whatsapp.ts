/** WhatsApp comercial da EquiparLoc (DDI + DDD + número, só dígitos) */
export const WHATSAPP_NUMBER = '5531991970322';

export interface WhatsAppQuote {
  customerName?: string;
  companyName?: string;
  equipmentName?: string;
  rentalPeriod?: string;
  siteLocation?: string;
  needsTransport?: boolean;
  needsOperator?: boolean;
  message?: string;
}

/**
 * Link do WhatsApp com o pedido já escrito a partir do que o cliente preencheu
 * no formulário (só entram os campos preenchidos).
 */
export function whatsappQuoteUrl(q: WhatsAppQuote): string {
  const lines = ['Olá, EquiparLoc! Quero um orçamento de locação.'];
  const add = (label: string, v?: string) => {
    const t = (v || '').trim();
    if (t) lines.push(`${label}: ${t}`);
  };
  add('Nome', q.customerName);
  add('Empresa', q.companyName);
  add('Equipamento', q.equipmentName);
  add('Período', q.rentalPeriod);
  add('Local da obra', q.siteLocation);
  if (q.needsTransport) lines.push('Preciso de frete / entrega na obra.');
  if (q.needsOperator) lines.push('Preciso de operador.');
  add('Observações', q.message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
}
