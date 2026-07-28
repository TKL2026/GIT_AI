/**
 * WhatsApp ne rend qu'un sous-ensemble minimal de mise en forme (gras,
 * italique, barré) — pas les titres Markdown (`#`), ni les tableaux
 * (`|...|`). Le rapport quotidien du copilote est généré en Markdown
 * complet ; ce convertisseur produit un texte lisible dans WhatsApp
 * plutôt que d'afficher les symboles bruts.
 */
export function toWhatsAppText(markdown: string): string {
  const lines = markdown.split('\n').flatMap((line): string[] => {
    const headerMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (headerMatch) {
      return [`*${headerMatch[1]}*`];
    }

    const trimmed = line.trim();
    if (trimmed.startsWith('|')) {
      const cells = trimmed
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0);
      const isSeparatorRow = cells.length > 0 && cells.every((cell) => /^:?-+:?$/.test(cell));
      if (isSeparatorRow) {
        return [];
      }
      return [cells.join(' — ')];
    }

    return [line];
  });

  return lines
    .join('\n')
    .replace(/\*\*(.+?)\*\*/g, '*$1*')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
