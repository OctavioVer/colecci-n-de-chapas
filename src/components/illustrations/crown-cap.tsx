import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

export type CapMark = 'star' | 'band' | 'dot' | 'ring' | 'none';

export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const mix = (c: number) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Una chapita vista de arriba: 21 pliegues, como las de verdad. */
export function capSkirt(cx: number, cy: number, outer: number, inner: number): string {
  const points: string[] = [];
  const teeth = 21;
  for (let i = 0; i < teeth * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / teeth - Math.PI / 2;
    points.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return points.join(' ');
}

const STAR = 'M50 33 L54.9 44.2 L67 45.3 L57.8 53.3 L60.6 65.2 L50 58.9 L39.4 65.2 L42.2 53.3 L33 45.3 L45.1 44.2 Z';

export function CapShape({
  x = 0,
  y = 0,
  size = 100,
  color,
  mark = 'none',
  markColor = '#FFFFFF',
  opacity = 1,
}: {
  x?: number;
  y?: number;
  size?: number;
  color: string;
  mark?: CapMark;
  markColor?: string;
  opacity?: number;
}) {
  const s = size / 100;
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
      <Polygon
        points={capSkirt(50, 50, 48, 43)}
        fill={shade(color, -0.22)}
        stroke={shade(color, -0.22)}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Circle cx={50} cy={50} r={38} fill={color} />
      <Circle cx={50} cy={50} r={32} fill="none" stroke={shade(color, 0.3)} strokeOpacity={0.55} strokeWidth={1.5} />
      {mark === 'star' && <Path d={STAR} fill={markColor} />}
      {mark === 'band' && <Rect x={20} y={43} width={60} height={14} rx={3} fill={markColor} />}
      {mark === 'dot' && <Circle cx={50} cy={50} r={11} fill={markColor} />}
      {mark === 'ring' && <Circle cx={50} cy={50} r={17} fill="none" stroke={markColor} strokeWidth={6} />}
      <Ellipse cx={39} cy={34} rx={14} ry={7} fill="#FFFFFF" opacity={0.2} transform="rotate(-30 39 34)" />
    </G>
  );
}

export function CrownCap({
  size = 48,
  color,
  mark = 'none',
  markColor,
}: {
  size?: number;
  color: string;
  mark?: CapMark;
  markColor?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <CapShape color={color} mark={mark} markColor={markColor} />
    </Svg>
  );
}

/** Logo de la app: una chapita con una "V" de Vitrina. */
export function LogoMark({ size = 40, color = '#D9412B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <CapShape color={color} />
      <Path
        d="M35 36 L50 66 L65 36"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
