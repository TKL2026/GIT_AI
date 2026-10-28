import { plainToInstance } from "class-transformer";
import { IsOptional, validateSync } from "class-validator";
import {
  IsCalendarDateString,
  IsCalendarMonthString,
} from "./calendar-date.validator";

class TestDateDto {
  @IsOptional()
  @IsCalendarDateString()
  date?: string;
}

class TestMonthDto {
  @IsOptional()
  @IsCalendarMonthString()
  month?: string;
}

function validateDate(date: string): boolean {
  const instance = plainToInstance(TestDateDto, { date });
  return validateSync(instance).length === 0;
}

function validateMonth(month: string): boolean {
  const instance = plainToInstance(TestMonthDto, { month });
  return validateSync(instance).length === 0;
}

describe("IsCalendarDateString", () => {
  it("accepte une date calendaire valide", () => {
    expect(validateDate("2026-10-27")).toBe(true);
  });

  it("accepte le 29 février d'une année bissextile", () => {
    expect(validateDate("2028-02-29")).toBe(true);
  });

  it("rejette une chaîne qui n'a même pas la forme d'une date", () => {
    expect(validateDate("bonjour")).toBe(false);
  });

  it("rejette un mois impossible (13)", () => {
    expect(validateDate("2026-13-45")).toBe(false);
  });

  it("rejette un jour impossible (30 février)", () => {
    expect(validateDate("2026-02-30")).toBe(false);
  });

  it("rejette le 29 février d'une année non bissextile", () => {
    expect(validateDate("2026-02-29")).toBe(false);
  });

  it("rejette le jour 00 et le mois 00", () => {
    expect(validateDate("2026-00-10")).toBe(false);
    expect(validateDate("2026-10-00")).toBe(false);
  });

  it("rejette une date au format DD-MM-YYYY (mauvais ordre)", () => {
    expect(validateDate("27-10-2026")).toBe(false);
  });
});

describe("IsCalendarMonthString", () => {
  it("accepte un mois valide", () => {
    expect(validateMonth("2026-10")).toBe(true);
  });

  it("rejette un mois impossible (13)", () => {
    expect(validateMonth("2026-13")).toBe(false);
  });

  it("rejette un mois 00", () => {
    expect(validateMonth("2026-00")).toBe(false);
  });

  it("rejette une chaîne qui n'a pas la forme YYYY-MM", () => {
    expect(validateMonth("bonjour")).toBe(false);
  });

  it("rejette une date complète passée à la place d'un mois", () => {
    expect(validateMonth("2026-10-27")).toBe(false);
  });
});
