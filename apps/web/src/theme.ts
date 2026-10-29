import {
  Badge,
  Button,
  Card,
  createTheme,
  Modal,
  Table,
  Tabs,
  type MantineColorsTuple,
} from '@mantine/core';

const emerald: MantineColorsTuple = [
  '#ecfdf5',
  '#d1fae5',
  '#a7f3d0',
  '#6ee7b7',
  '#34d399',
  '#10b981',
  '#059669',
  '#047857',
  '#065f46',
  '#064e3b',
];

// Palette de marque UGE (charte « Pivot », index 6 = Émeraude UGE #0B7A55).
const uge: MantineColorsTuple = [
  '#EFF8F5',
  '#DAF1E9',
  '#B7E6D6',
  '#88D7BD',
  '#4DCBA1',
  '#1FAD7E',
  '#0B7A55',
  '#096244',
  '#074B34',
  '#053625',
];

// Vert "succès" volontairement distinct de la marque (charte : "le vert de
// marque ne doit pas servir de couleur succès") — reprend le vert natif de
// Mantine, déjà utilisé tel quel (color="green") dans la quasi-totalité des
// notifications de succès existantes.
const success: MantineColorsTuple = [
  '#ebfbee',
  '#d3f9d8',
  '#b2f2bb',
  '#8ce99a',
  '#69db7c',
  '#51cf66',
  '#40c057',
  '#37b24d',
  '#2f9e44',
  '#2b8a3e',
];

const amber: MantineColorsTuple = [
  '#fffbeb',
  '#fef3c7',
  '#fde68a',
  '#fcd34d',
  '#fbbf24',
  '#f59e0b',
  '#d97706',
  '#b45309',
  '#92400e',
  '#78350f',
];

const red: MantineColorsTuple = [
  '#fef2f2',
  '#fee2e2',
  '#fecaca',
  '#fca5a5',
  '#f87171',
  '#ef4444',
  '#dc2626',
  '#b91c1c',
  '#991b1b',
  '#7f1d1d',
];

const blue: MantineColorsTuple = [
  '#eff6ff',
  '#dbeafe',
  '#bfdbfe',
  '#93c5fd',
  '#60a5fa',
  '#3b82f6',
  '#2563eb',
  '#1d4ed8',
  '#1e40af',
  '#1e3a8a',
];

export const theme = createTheme({
  primaryColor: 'uge',
  colors: {
    uge,
    // Conservée pour les usages ponctuels déjà en place dans l'app
    // (accents non liés au bouton/état principal) — hors périmètre de ce
    // changement de couleur principale, qui ne porte que sur `primaryColor`.
    emerald,
    amber,
    // Alias couleurs sémantiques, chacun sur une palette distincte de la
    // marque : "warning" reprend l'ambre défini pour l'accent, "success"
    // est le vert natif Mantine (voir plus haut) pour ne jamais se
    // confondre avec le vert de marque UGE.
    success,
    warning: amber,
    error: red,
    info: blue,
  },
  defaultRadius: 'lg',
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: {
    fontWeight: '600',
  },
  components: {
    Card: Card.extend({
      defaultProps: {
        withBorder: true,
        radius: 'lg',
        shadow: 'xs',
      },
    }),
    Button: Button.extend({
      defaultProps: {
        radius: 'md',
        fw: 600,
      },
    }),
    Badge: Badge.extend({
      defaultProps: {
        radius: 'sm',
      },
    }),
    Table: Table.extend({
      defaultProps: {
        highlightOnHover: true,
        verticalSpacing: 'sm',
      },
    }),
    Tabs: Tabs.extend({
      defaultProps: {
        radius: 'md',
      },
    }),
    Modal: Modal.extend({
      defaultProps: {
        radius: 'lg',
        overlayProps: { backgroundOpacity: 0.55, blur: 3 },
      },
    }),
  },
});
