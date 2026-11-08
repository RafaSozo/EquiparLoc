'use client';

// Google Analytics 4 event dispatcher helper
export function trackEvent(eventName: string, params: Record<string, string | number | boolean> = {}) {
  try {
    if (typeof window !== 'undefined') {
      const anyWindow = window as unknown as { gtag?: (type: string, name: string, data: Record<string, unknown>) => void };
      if (typeof anyWindow.gtag === 'function') {
        anyWindow.gtag('event', eventName, params);
      }
      // Log for client-side visibility & validation
      console.log(`[GA4 Event: ${eventName}]`, params);
    }
  } catch (e) {
    console.warn('Analytics event dispatch error:', e);
  }
}

export function trackWhatsAppClick(equipmentName?: string, code?: string) {
  trackEvent('whatsapp_conversion', {
    event_category: 'contact',
    event_label: equipmentName || 'Contato Geral',
    equipment_code: code || 'GERAL',
  });
}

export function trackQuoteSubmission(equipmentName: string, protocol: string) {
  trackEvent('generate_lead', {
    event_category: 'quote',
    event_label: equipmentName,
    value: 1,
    protocol,
  });
}
