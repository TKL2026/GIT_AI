import { BadRequestException } from '@nestjs/common';

/**
 * Normalise un numéro camerounais vers le format attendu par CamPay :
 * indicatif sans "+", 12 chiffres au total (ex: "237670000000").
 * Accepte en entrée "+237 6XX XXX XXX", "237670000000" ou "670000000".
 */
export function normalizeCameroonPhone(input: string): string {
  const digits = input.replace(/\D/g, '');

  if (digits.length === 9) {
    return `237${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('237')) {
    return digits;
  }

  throw new BadRequestException(
    'Numéro de téléphone invalide (format attendu : 6XXXXXXXX ou 2376XXXXXXXX).',
  );
}
