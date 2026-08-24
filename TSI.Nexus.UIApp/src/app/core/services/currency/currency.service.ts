import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  constructor() {}

  formatCurrencyBRL(value?: any): string {
    const number = Number(value);
    if (isNaN(number) || value === undefined || value === null) {
      return 'R$ 0,00';
    }
    return number.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  parseCurrencyBRL(value: string | number | undefined | null): number {
    if (typeof value === 'number') {
      return value;
    }

    if (!value) {
      return 0;
    }

    let clean = String(value).replace(/[^0-9,.-]+/g, '');
    const lastComma = clean.lastIndexOf(',');

    if (lastComma !== -1) {
      clean =
        clean.slice(0, lastComma).replace(/,/g, '') +
        '.' +
        clean.slice(lastComma + 1);
    }

    clean = clean.replace(/(?!^)-/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  }
}
