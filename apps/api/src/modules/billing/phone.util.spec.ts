import { BadRequestException } from '@nestjs/common';
import { normalizeCameroonPhone } from './phone.util';

describe('normalizeCameroonPhone', () => {
  it('accepte un numéro local à 9 chiffres et ajoute l\'indicatif', () => {
    expect(normalizeCameroonPhone('670000000')).toBe('237670000000');
  });

  it('accepte un numéro déjà au format 237XXXXXXXXX', () => {
    expect(normalizeCameroonPhone('237670000000')).toBe('237670000000');
  });

  it('retire les espaces et le "+" avant de normaliser', () => {
    expect(normalizeCameroonPhone('+237 67 00 00 000')).toBe('237670000000');
  });

  it('lève une BadRequestException pour un numéro trop court', () => {
    expect(() => normalizeCameroonPhone('12345')).toThrow(BadRequestException);
  });

  it('lève une BadRequestException pour un indicatif incorrect', () => {
    expect(() => normalizeCameroonPhone('221670000000')).toThrow(BadRequestException);
  });
});
