import { useColorScheme } from 'react-native';

import { useStore } from '@/store/store';

import { palette, type ColorScheme, type Colors } from './tokens';

export function useColorSchemeName(): ColorScheme {
  const system = useColorScheme();
  const preference = useStore((s) => s.themePreference);
  if (preference !== 'system') return preference;
  return system === 'dark' ? 'dark' : 'light';
}

export function useColors(): Colors {
  return palette[useColorSchemeName()];
}
