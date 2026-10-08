import { Table } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CopilotMarkdownProps {
  children: string;
}

/**
 * Rendu Markdown unique pour toutes les réponses du Copilote (chat, rapports,
 * résumés) — remark-gfm ajoute le support des tableaux GFM (BUG-009), les
 * balises <table>/<tr>/<td> générées sont mappées sur les primitives Mantine
 * existantes (cohérent avec le reste de l'UI) plutôt que du HTML brut non
 * stylé. N'affecte pas le texte, le gras, les listes, les liens ou le code,
 * déjà rendus correctement par react-markdown sans config supplémentaire.
 */
export function CopilotMarkdown({ children }: CopilotMarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        table: ({ children: tableChildren }) => (
          <Table withTableBorder withColumnBorders my="sm">
            {tableChildren}
          </Table>
        ),
        thead: ({ children: theadChildren }) => <Table.Thead>{theadChildren}</Table.Thead>,
        tbody: ({ children: tbodyChildren }) => <Table.Tbody>{tbodyChildren}</Table.Tbody>,
        tr: ({ children: trChildren }) => <Table.Tr>{trChildren}</Table.Tr>,
        th: ({ children: thChildren }) => <Table.Th>{thChildren}</Table.Th>,
        td: ({ children: tdChildren }) => <Table.Td>{tdChildren}</Table.Td>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
