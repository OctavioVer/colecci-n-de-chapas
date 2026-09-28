import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { type, type Colors, type TypeVariant } from '@/theme/tokens';
import { useColors } from '@/theme/use-theme';

export interface TextProps extends RNTextProps {
  variant?: TypeVariant;
  color?: keyof Colors;
  align?: 'left' | 'center' | 'right';
}

export function Text({ variant = 'body', color = 'text', align, style, ...props }: TextProps) {
  const colors = useColors();
  return (
    <RNText
      {...props}
      style={[type[variant], { color: colors[color] }, align && { textAlign: align }, style]}
    />
  );
}
