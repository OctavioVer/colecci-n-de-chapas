import { Platform } from 'react-native';

export const palette = {
  light: {
    background: '#F6F4F0',
    surface: '#FFFFFF',
    surfaceMuted: '#EFECE6',
    surfacePressed: '#E6E2DA',
    border: '#E3DED5',
    borderStrong: '#CFC8BC',
    text: '#17181C',
    textSecondary: '#5E6068',
    textTertiary: '#8D8F96',
    primary: '#D9412B',
    primaryPressed: '#BD3521',
    primarySoft: '#FBE7E2',
    onPrimary: '#FFFFFF',
    accent: '#E8A33D',
    accentSoft: '#FCF0DC',
    success: '#1E9E6A',
    successSoft: '#DDF3EA',
    danger: '#C9372C',
    dangerSoft: '#FBE4E2',
    ink: '#1F2430',
    onInk: '#FFFFFF',
    overlay: 'rgba(15, 16, 20, 0.45)',
    shadow: 'rgba(31, 36, 48, 0.10)',
  },
  dark: {
    background: '#0F1013',
    surface: '#1A1B20',
    surfaceMuted: '#23252B',
    surfacePressed: '#2C2E35',
    border: '#2C2E35',
    borderStrong: '#3B3E47',
    text: '#F3F2EF',
    textSecondary: '#A9ABB2',
    textTertiary: '#7C7E86',
    primary: '#FF6A4D',
    primaryPressed: '#F0553A',
    primarySoft: '#3A1E18',
    onPrimary: '#FFFFFF',
    accent: '#F2B45A',
    accentSoft: '#3A2D17',
    success: '#3CC48C',
    successSoft: '#15352A',
    danger: '#FF6B5E',
    dangerSoft: '#3B1C1A',
    ink: '#F3F2EF',
    onInk: '#17181C',
    overlay: 'rgba(0, 0, 0, 0.6)',
    shadow: 'rgba(0, 0, 0, 0.4)',
  },
} as const;

export type ColorScheme = keyof typeof palette;
export type Colors = { [K in keyof (typeof palette)['light']]: string };

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
  pill: 999,
} as const;

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const type = {
  display: { fontFamily: fonts.extrabold, fontSize: 32, lineHeight: 38, letterSpacing: -0.8 },
  title: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.5 },
  heading: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  subheading: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  overline: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14, letterSpacing: 0.8, textTransform: 'uppercase' },
  number: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 32, letterSpacing: -0.8 },
} as const;

export type TypeVariant = keyof typeof type;

export function elevation(colors: Colors, level: 1 | 2 | 3 = 1) {
  const blur = [0, 12, 20, 32][level];
  const y = [0, 4, 8, 16][level];
  return Platform.select({
    web: { boxShadow: `0 ${y / 2}px ${blur}px ${colors.shadow}` },
    default: {
      shadowColor: '#000',
      shadowOpacity: colors.shadow.includes('0.4') ? 0.4 : 0.08,
      shadowRadius: blur / 2,
      shadowOffset: { width: 0, height: y / 2 },
      elevation: level * 2,
    },
  });
}

export const MAX_CONTENT_WIDTH = 640;
