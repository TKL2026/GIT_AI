import { CloseButton, TextInput, type TextInputProps } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import type { ChangeEvent } from 'react';

/**
 * Ajoute un bouton d'effacement natif quand une valeur est saisie (BUG-002)
 * — sans changer l'API du composant : value/onChange restent contrôlés par
 * l'appelant comme avant.
 */
export function SearchInput({ value, onChange, ...props }: TextInputProps) {
  function clear() {
    onChange?.({ currentTarget: { value: '' } } as ChangeEvent<HTMLInputElement>);
  }

  return (
    <TextInput
      placeholder="Rechercher…"
      leftSection={<IconSearch size={16} />}
      rightSection={value ? <CloseButton size="sm" onClick={clear} aria-label="Effacer la recherche" /> : null}
      w={280}
      value={value}
      onChange={onChange}
      {...props}
    />
  );
}
