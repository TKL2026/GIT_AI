import { TextInput, type TextInputProps } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

export function SearchInput(props: TextInputProps) {
  return (
    <TextInput
      placeholder="Rechercher…"
      leftSection={<IconSearch size={16} />}
      w={280}
      {...props}
    />
  );
}
