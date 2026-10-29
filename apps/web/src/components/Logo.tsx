type LogoSize = 'sm' | 'md' | 'lg';
type LogoVariant = 'horizontal' | 'symbol';
type LogoBackground = 'light' | 'dark';

interface LogoProps {
  /** Hauteur du logo. Par défaut 'md' (32px), comme l'ancien composant. */
  size?: LogoSize;
  /** 'horizontal' = logo complet (symbole + mot-symbole « UGE »), 'symbol' = symbole seul. */
  variant?: LogoVariant;
  /** Déclinaison à utiliser selon la couleur du fond derrière le logo. */
  background?: LogoBackground;
}

const HEIGHTS: Record<LogoSize, number> = {
  sm: 26,
  md: 32,
  lg: 44,
};

const SOURCES: Record<LogoVariant, Record<LogoBackground, string>> = {
  horizontal: {
    light: '/brand/uge-logo-horizontal.svg',
    dark: '/brand/uge-logo-horizontal-fond-sombre.svg',
  },
  symbol: {
    light: '/brand/uge-symbole.svg',
    dark: '/brand/uge-symbole-fond-sombre.svg',
  },
};

export function Logo({ size = 'md', variant = 'horizontal', background = 'light' }: LogoProps) {
  const height = HEIGHTS[size];

  return (
    <img
      src={SOURCES[variant][background]}
      alt="UGE"
      height={height}
      style={{ display: 'block', height, width: 'auto' }}
    />
  );
}
