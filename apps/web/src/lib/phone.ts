/**
 * Validation UX uniquement — miroir de la règle stricte appliquée côté
 * backend (voir apps/api/src/modules/billing/phone.util.ts#normalizeCameroonPhone) :
 * exactement 9 chiffres (numéro local) ou exactement 12 chiffres commençant
 * par 237 (indicatif Cameroun déjà inclus). Ne remplace jamais la validation
 * backend — BUG-008.
 */
export function isValidCameroonPhone(input: string): boolean {
  const digits = input.replace(/\D/g, '');
  return digits.length === 9 || (digits.length === 12 && digits.startsWith('237'));
}
