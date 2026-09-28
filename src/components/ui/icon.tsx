import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import type { Colors } from '@/theme/tokens';
import { useColors } from '@/theme/use-theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export interface IconProps {
  name: IconName;
  size?: number;
  color?: keyof Colors;
  /** Color directo (hex), tiene prioridad sobre `color`. */
  tint?: string;
}

export function Icon({ name, size = 20, color = 'text', tint }: IconProps) {
  const colors = useColors();
  return <Ionicons name={name} size={size} color={tint ?? colors[color]} />;
}
