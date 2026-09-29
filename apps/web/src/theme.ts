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
  primaryColor: 'emerald',
  colors: {
    emerald,
    amber,
    // Alias couleurs sémantiques : "success" partage la teinte de marque
    // (le vert émeraude joue déjà ce rôle visuellement), "warning" reprend
    // l'ambre défini pour l'accent — pas de palette redondante à maintenir.
    success: emerald,
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
