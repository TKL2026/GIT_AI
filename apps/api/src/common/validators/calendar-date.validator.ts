import { registerDecorator, ValidationOptions } from "class-validator";

/**
 * Valide qu'une chaîne "YYYY-MM-DD" correspond à une date calendaire
 * réellement existante (rejette "2026-13-45", "2026-02-30", etc.) — une
 * simple expression régulière de forme ne suffit pas : elle laisse passer
 * des combinaisons jour/mois impossibles qui atteignaient ensuite les
 * calculs métier et provoquaient une 500 (voir douala-time.util.ts, qui
 * suppose en entrée une date déjà valide). Construit une date UTC puis
 * vérifie qu'elle correspond exactement aux composants fournis — la
 * technique standard pour détecter le "rollover" silencieux de `Date`
 * (ex: `new Date(2026, 1, 30)` devient le 2 mars).
 */
function isValidCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function IsCalendarDateString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: "isCalendarDateString",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === "string" && isValidCalendarDate(value);
        },
        defaultMessage(): string {
          return `${propertyName} doit être une date calendaire valide au format YYYY-MM-DD.`;
        },
      },
    });
  };
}

/** Même principe pour "YYYY-MM" : rejette un mois hors 01-12 (ex: "2026-13"). */
function isValidCalendarMonth(value: string): boolean {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return false;
  const month = Number(match[2]);
  return month >= 1 && month <= 12;
}

export function IsCalendarMonthString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: "isCalendarMonthString",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === "string" && isValidCalendarMonth(value);
        },
        defaultMessage(): string {
          return `${propertyName} doit être un mois calendaire valide au format YYYY-MM.`;
        },
      },
    });
  };
}
