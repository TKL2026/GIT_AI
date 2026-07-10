import { Center, Loader, Table, Text } from '@mantine/core';
import type { ReactNode } from 'react';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  textAlign?: 'left' | 'right' | 'center';
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  emptyMessage = 'Aucune donnée pour le moment.',
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <Center py="xl">
        <Loader size="sm" />
      </Center>
    );
  }

  if (rows.length === 0) {
    return (
      <Center py="xl">
        <Text c="dimmed" size="sm">
          {emptyMessage}
        </Text>
      </Center>
    );
  }

  return (
    <Table.ScrollContainer minWidth={600}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {columns.map((column) => (
              <Table.Th key={column.key} style={{ textAlign: column.textAlign ?? 'left' }}>
                {column.label}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={rowKey(row)}>
              {columns.map((column) => (
                <Table.Td key={column.key} style={{ textAlign: column.textAlign ?? 'left' }}>
                  {column.render(row)}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
