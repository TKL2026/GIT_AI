/** Déclenche le téléchargement navigateur d'un Blob reçu de l'API (même
 * séquence que le modèle CSV d'import, appliquée ici à un blob distant). */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
