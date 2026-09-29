import { Center, Group, Pagination, Skeleton, Table, Text, UnstyledButton } from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconSelector } from '@tabler/icons-react';
import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  textAlign?: 'left' | 'right' | 'center';
  /** Si fourni, la colonne devient triable (clic sur l'en-tête). */
  sortValue?: (row: T) => string | number;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  /** Active la pagination client si fourni. */
  pageSize?: number;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  emptyMessage = 'Aucune donnée pour le moment.',
  pageSize,
  onRowClick,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const column = columns.find((c) => c.key === sortKey);
    if (!column?.sortValue) return rows;
    const sorted = [...rows].sort((a, b) => {
      const va = column.sortValue!(a);
      const vb = column.sortValue!(b);
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [rows, sortKey, sortAsc, columns]);

  const pageCount = pageSize ? Math.max(1, Math.ceil(sortedRows.length / pageSize)) : 1;
  const currentPage = Math.min(page, pageCount);
  const pagedRows = pageSize
    ? sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedRows;

  function handleSort(column: DataTableColumn<T>) {
    if (!column.sortValue) return;
    if (sortKey === column.key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(column.key);
      setSortAsc(true);
    }
    setPage(1);
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, row: T) {
    if (!onRowClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onRowClick(row);
    }
  }

  const headerRow = (
    <Table.Tr>
      {columns.map((column) => (
        <Table.Th key={column.key} style={{ textAlign: column.textAlign ?? 'left' }}>
          {column.sortValue ? (
            <UnstyledButton onClick={() => handleSort(column)}>
              <Group gap={4} justify={column.textAlign === 'right' ? 'flex-end' : 'flex-start'} wrap="nowrap">
                <Text fw={600} size="sm">
                  {column.label}
                </Text>
                {sortKey === column.key ? (
                  sortAsc ? (
                    <IconChevronUp size={14} />
                  ) : (
                    <IconChevronDown size={14} />
                  )
                ) : (
                  <IconSelector size={14} opacity={0.4} />
                )}
              </Group>
            </UnstyledButton>
          ) : (
            column.label
          )}
        </Table.Th>
      ))}
    </Table.Tr>
  );

  if (isLoading) {
    const skeletonRowCount = pageSize ?? 5;
    return (
      <Table.ScrollContainer minWidth={600}>
        <Table verticalSpacing="sm">
          <Table.Thead>{headerRow}</Table.Thead>
          <Table.Tbody>
            {Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
              <Table.Tr key={rowIndex}>
                {columns.map((column) => (
                  <Table.Td key={column.key}>
                    <Skeleton height={14} width={column.textAlign === 'right' ? '60%' : '80%'} ml={column.textAlign === 'right' ? 'auto' : 0} />
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
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
    <>
      <style>{`
        tr.data-table-row-clickable:focus-visible {
          outline: 2px solid var(--mantine-color-emerald-6);
          outline-offset: -2px;
        }
      `}</style>
      <Table.ScrollContainer minWidth={600}>
        <Table verticalSpacing="sm" highlightOnHover>
          <Table.Thead>{headerRow}</Table.Thead>
          <Table.Tbody>
            {pagedRows.map((row) => (
              <Table.Tr
                key={rowKey(row)}
                className={onRowClick ? 'data-table-row-clickable' : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={onRowClick ? (event) => handleRowKeyDown(event, row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? 'button' : undefined}
                style={onRowClick ? { cursor: 'pointer' } : undefined}
              >
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
      {pageSize && pageCount > 1 && (
        <Group justify="flex-end" mt="md">
          <Pagination total={pageCount} value={currentPage} onChange={setPage} size="sm" />
        </Group>
      )}
    </>
  );
}
