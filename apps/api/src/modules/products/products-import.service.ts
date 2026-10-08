import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ImportProductRowDto, ImportProductsDto } from './dto/import-products.dto';
import { ImportProductsResultDto } from './dto/import-products-result.dto';

/** Garde-fou volontairement modeste (section 11 : pas de système surdimensionné
 * pour les besoins actuels d'une PME) — un fichier plus gros doit être scindé. */
const MAX_IMPORT_ROWS = 5000;

interface ParsedRow {
  line: number;
  name: string;
  sku: string;
  purchasePrice: number;
  salePrice: number;
  initialStock: number;
  minStock?: number;
  maxStock?: number;
}

interface RowError {
  line: number;
  message: string;
}

@Injectable()
export class ProductsImportService {
  constructor(private readonly prisma: PrismaService) {}

  async import(organizationId: string, dto: ImportProductsDto): Promise<ImportProductsResultDto> {
    if (dto.rows.length > MAX_IMPORT_ROWS) {
      throw new BadRequestException(
        `Ce fichier contient trop de lignes (${dto.rows.length}). La limite est de ${MAX_IMPORT_ROWS} lignes par import : divisez votre fichier en plusieurs imports.`,
      );
    }

    const errors: RowError[] = [];
    const parsedRows: ParsedRow[] = [];
    const seenSkuLines = new Map<string, number>();

    for (const row of dto.rows) {
      const parsed = this.validateRow(row, errors);
      if (!parsed) continue;

      const firstLine = seenSkuLines.get(parsed.sku);
      if (firstLine !== undefined) {
        errors.push({
          line: parsed.line,
          message: `Le SKU "${parsed.sku}" apparaît plusieurs fois dans le fichier (déjà utilisé à la ligne ${firstLine}).`,
        });
        continue;
      }

      seenSkuLines.set(parsed.sku, parsed.line);
      parsedRows.push(parsed);
    }

    if (parsedRows.length === 0) {
      return {
        importedCount: 0,
        rejectedCount: dto.rows.length,
        errors: this.sortErrors(errors),
      };
    }

    const existing = await this.prisma.product.findMany({
      where: { organizationId, sku: { in: parsedRows.map((r) => r.sku) } },
      select: { sku: true },
    });
    const existingSkus = new Set(existing.map((p) => p.sku));

    const toCreate: ParsedRow[] = [];
    for (const row of parsedRows) {
      if (existingSkus.has(row.sku)) {
        errors.push({
          line: row.line,
          message: `Le SKU "${row.sku}" est déjà utilisé par un produit existant.`,
        });
        continue;
      }
      toCreate.push(row);
    }

    let importedCount = 0;
    if (toCreate.length > 0) {
      try {
        await this.prisma.$transaction(async (tx) => {
          for (const row of toCreate) {
            await tx.product.create({
              data: {
                organizationId,
                name: row.name,
                sku: row.sku,
                purchasePrice: row.purchasePrice,
                salePrice: row.salePrice,
                stockQuantity: row.initialStock,
                minStock: row.minStock,
                maxStock: row.maxStock,
              },
            });
          }
        });
        importedCount = toCreate.length;
      } catch {
        errors.push({
          line: 0,
          message:
            "Une erreur inattendue est survenue pendant l'enregistrement : aucun produit n'a été importé. Réessayez.",
        });
        importedCount = 0;
      }
    }

    return {
      importedCount,
      rejectedCount: dto.rows.length - importedCount,
      errors: this.sortErrors(errors),
    };
  }

  private validateRow(row: ImportProductRowDto, errors: RowError[]): ParsedRow | null {
    const { line } = row;

    const name = row.name?.trim();
    if (!name) {
      errors.push({ line, message: 'La désignation du produit est manquante.' });
      return null;
    }

    const sku = row.sku?.trim();
    if (!sku) {
      errors.push({ line, message: 'Le SKU est manquant.' });
      return null;
    }

    const purchasePrice = this.parsePositiveNumber(row.purchasePrice);
    if (purchasePrice === null) {
      errors.push({ line, message: "Le prix d'achat n'est pas un nombre valide." });
      return null;
    }

    const salePrice = this.parsePositiveNumber(row.salePrice);
    if (salePrice === null) {
      errors.push({ line, message: 'Le prix de vente n’est pas un nombre valide.' });
      return null;
    }

    const stock = this.parseOptionalNonNegativeInt(row.initialStock);
    if (!stock.ok) {
      errors.push({ line, message: "Le stock initial n'est pas un nombre entier valide." });
      return null;
    }

    const minStock = this.parseOptionalNonNegativeInt(row.minStock);
    if (!minStock.ok) {
      errors.push({ line, message: 'Le seuil minimum n’est pas un nombre entier valide.' });
      return null;
    }

    const maxStock = this.parseOptionalNonNegativeInt(row.maxStock);
    if (!maxStock.ok) {
      errors.push({ line, message: 'Le seuil maximum n’est pas un nombre entier valide.' });
      return null;
    }

    return {
      line,
      name,
      sku,
      purchasePrice,
      salePrice,
      initialStock: stock.value ?? 0,
      minStock: minStock.value,
      maxStock: maxStock.value,
    };
  }

  private parsePositiveNumber(raw?: string): number | null {
    if (!raw || !raw.trim()) return null;
    const value = Number(raw.trim().replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) return null;
    return value;
  }

  private parseOptionalNonNegativeInt(raw?: string): { ok: true; value: number | undefined } | { ok: false } {
    if (!raw || !raw.trim()) return { ok: true, value: undefined };
    const value = Number(raw.trim());
    if (!Number.isInteger(value) || value < 0) return { ok: false };
    return { ok: true, value };
  }

  private sortErrors(errors: RowError[]): RowError[] {
    return [...errors].sort((a, b) => a.line - b.line);
  }
}
