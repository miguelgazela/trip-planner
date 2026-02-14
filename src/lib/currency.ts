import { Currency } from '@/types/trip';

const formatters: Record<Currency, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
  EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
  GBP: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
  JPY: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }),
  BRL: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
  CAD: new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }),
  AUD: new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }),
};

export const formatCurrency = (amount: number, currency: Currency): string => {
  return formatters[currency].format(amount);
};

export const totalCost = <T extends { cost?: number }>(items: T[]): number => {
  return items.reduce((sum, item) => sum + (item.cost ?? 0), 0);
};
