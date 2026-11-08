// Limites dos formulários públicos. Usado no servidor (validação) e nos
// formulários do site (atributo maxLength), para os dois ficarem iguais.

export const FIELD_LIMITS = {
  name: 100,
  company: 120,
  email: 120,
  phone: 30,
  equipment: 150,
  location: 150,
  period: 60,
  message: 2000,
  comment: 2000,
} as const;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
