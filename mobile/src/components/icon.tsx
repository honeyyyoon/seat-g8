import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { Text } from '@/components/text';

type SFSymbol = Extract<SymbolViewProps['name'], string>;
type Weight = Extract<SymbolViewProps['weight'], string>;

const FALLBACK: Partial<Record<SFSymbol, string>> = {
  magnifyingglass: '⌕',
  'chevron.right': '›',
  'chevron.down': '⌄',
  'arrow.down': '↓',
  checkmark: '✓',
  minus: '−',
  plus: '+',
  map: '⌖',
  exclamationmark: '!',
  'arrow.uturn.backward': '↺',
  'line.3.horizontal': '≡',
};

type Props = { name: SFSymbol; size?: number; color: string; weight?: Weight };

export function Icon({ name, size = 16, color, weight = 'semibold' }: Props) {
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      weight={weight}
      fallback={<Text style={{ fontSize: size, lineHeight: size + 2, color }}>{FALLBACK[name] ?? ''}</Text>}
    />
  );
}
