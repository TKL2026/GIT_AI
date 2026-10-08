import { describe, expect, it } from 'vitest';
import { isValidCameroonPhone } from './phone';

describe('isValidCameroonPhone', () => {
  it('accepte un numéro local à 9 chiffres', () => {
    expect(isValidCameroonPhone('670000000')).toBe(true);
  });

  it('accepte un numéro avec indicatif 237 (12 chiffres)', () => {
    expect(isValidCameroonPhone('237670000000')).toBe(true);
  });

  it('accepte un numéro formaté avec espaces et "+"', () => {
    expect(isValidCameroonPhone('+237 67 00 00 000')).toBe(true);
  });

  it('BUG-008 : rejette un numéro manifestement trop court comme "123"', () => {
    expect(isValidCameroonPhone('123')).toBe(false);
  });

  it('rejette un numéro à 8 chiffres (ni 9 local ni 12 avec indicatif)', () => {
    expect(isValidCameroonPhone('12345678')).toBe(false);
  });

  it('rejette un numéro avec un indicatif différent de 237', () => {
    expect(isValidCameroonPhone('221670000000')).toBe(false);
  });
});
