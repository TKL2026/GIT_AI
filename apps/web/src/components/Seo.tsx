import { useEffect } from 'react';

const SITE_URL = 'https://myuge.pro';
const SITE_NAME = 'UGE';

interface SeoProps {
  title: string;
  description: string;
  /** Chemin canonique depuis la racine du site, ex: "/fonctionnalites". */
  path: string;
  /** JSON-LD optionnel (objet ou tableau d'objets) — uniquement des données réelles, jamais fictives. */
  jsonLd?: object | object[];
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Gestion du <head> par page, sans dépendance externe (pas de react-helmet) —
 * l'app est une SPA sans SSR, donc title/meta/canonical/JSON-LD sont posés au
 * montage de chaque page publique via une manipulation DOM directe, nettoyée
 * au démontage. Les pages privées (dashboard, etc.) n'utilisent pas ce
 * composant : elles restent non indexables (voir robots.txt).
 */
export function Seo({ title, description, path, jsonLd }: SeoProps) {
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : undefined;

  useEffect(() => {
    const previousTitle = document.title;
    const url = `${SITE_URL}${path}`;

    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const canonicalCreated = !canonical;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    let script: HTMLScriptElement | null = null;
    if (jsonLdString) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = jsonLdString;
      document.head.appendChild(script);
    }

    return () => {
      document.title = previousTitle;
      if (canonicalCreated) {
        canonical?.remove();
      }
      if (script) {
        script.remove();
      }
    };
  }, [title, description, path, jsonLdString]);

  return null;
}
