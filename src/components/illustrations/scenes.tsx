import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

import { useColors } from '@/theme/use-theme';

import { CapShape, type CapMark } from './crown-cap';

/**
 * Ilustraciones del onboarding y de los estados vacíos. Están dibujadas con
 * formas simples para que pesen poco y se adapten al modo claro y oscuro.
 */

const CAPS: { color: string; mark: CapMark; markColor?: string }[] = [
  { color: '#D9412B', mark: 'star' },
  { color: '#2F6FDB', mark: 'band' },
  { color: '#E8A33D', mark: 'dot', markColor: '#1F2430' },
  { color: '#1E9E7A', mark: 'ring' },
  { color: '#1F2430', mark: 'star', markColor: '#E8A33D' },
  { color: '#8A4FD8', mark: 'band' },
  { color: '#F0F0F0', mark: 'dot', markColor: '#D9412B' },
  { color: '#C0392B', mark: 'ring', markColor: '#F7D774' },
  { color: '#3AA3D8', mark: 'star' },
];

export function InventoryScene({ width = 300 }: { width?: number }) {
  const c = useColors();
  return (
    <Svg width={width} height={width * 0.8} viewBox="0 0 300 240">
      <Circle cx={150} cy={125} r={110} fill={c.primarySoft} />
      <Rect x={70} y={20} width={160} height={210} rx={26} fill={c.surface} stroke={c.border} strokeWidth={2} />
      <Rect x={88} y={38} width={70} height={9} rx={4.5} fill={c.text} />
      <Rect x={88} y={53} width={46} height={7} rx={3.5} fill={c.textTertiary} opacity={0.6} />
      {CAPS.slice(0, 6).map((cap, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        return (
          <G key={i}>
            <Rect x={86 + col * 44} y={74 + row * 60} width={40} height={52} rx={10} fill={c.surfaceMuted} />
            <CapShape x={90 + col * 44} y={78 + row * 60} size={32} {...cap} />
            <Rect x={92 + col * 44} y={115 + row * 60} width={24} height={4} rx={2} fill={c.textTertiary} opacity={0.5} />
          </G>
        );
      })}
      <Rect x={86} y={196} width={128} height={18} rx={9} fill={c.surfaceMuted} />
      <G>
        <Circle cx={236} cy={60} r={26} fill={c.primary} />
        <Path d="M236 49 V71 M225 60 H247" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" />
      </G>
      <G>
        <Rect x={28} y={150} width={78} height={44} rx={14} fill={c.ink} />
        <Rect x={40} y={162} width={30} height={7} rx={3.5} fill={c.onInk} opacity={0.6} />
        <Rect x={40} y={175} width={52} height={9} rx={4.5} fill={c.onInk} />
      </G>
    </Svg>
  );
}

export function FieldsScene({ width = 300 }: { width?: number }) {
  const c = useColors();
  const rows = [
    { w: 44, pill: 70, color: c.primary },
    { w: 30, pill: 92, color: '#2F6FDB' },
    { w: 56, pill: 54, color: '#1E9E7A' },
    { w: 36, pill: 80, color: c.accent },
  ];
  return (
    <Svg width={width} height={width * 0.8} viewBox="0 0 300 240">
      <Circle cx={150} cy={125} r={110} fill={c.accentSoft} />
      <Rect x={58} y={30} width={184} height={190} rx={24} fill={c.surface} stroke={c.border} strokeWidth={2} />
      <CapShape x={76} y={44} size={40} color="#D9412B" mark="star" />
      <Rect x={124} y={52} width={80} height={9} rx={4.5} fill={c.text} />
      <Rect x={124} y={67} width={52} height={7} rx={3.5} fill={c.textTertiary} opacity={0.6} />
      {rows.map((r, i) => (
        <G key={i}>
          <Rect x={76} y={102 + i * 28} width={r.w} height={7} rx={3.5} fill={c.textTertiary} opacity={0.7} />
          <Rect x={140} y={97 + i * 28} width={r.pill} height={17} rx={8.5} fill={r.color} opacity={0.18} />
          <Rect x={148} y={102 + i * 28} width={r.pill - 16} height={7} rx={3.5} fill={r.color} />
        </G>
      ))}
      <G>
        <Rect x={196} y={170} width={80} height={36} rx={18} fill={c.ink} />
        <Path d="M214 188 H226 M220 182 V194" stroke={c.onInk} strokeWidth={3.5} strokeLinecap="round" />
        <Rect x={233} y={184} width={30} height={8} rx={4} fill={c.onInk} />
      </G>
      <G>
        <Circle cx={60} cy={186} r={22} fill={c.accent} />
        <Path d="M51 195 L53 187 L65 175 L71 181 L59 193 Z" fill="#FFFFFF" />
      </G>
    </Svg>
  );
}

export function SearchScene({ width = 300 }: { width?: number }) {
  const c = useColors();
  return (
    <Svg width={width} height={width * 0.8} viewBox="0 0 300 240">
      <Circle cx={150} cy={125} r={110} fill={c.successSoft} />
      <G>
        <Rect x={46} y={26} width={72} height={26} rx={13} fill={c.ink} />
        <Rect x={58} y={36} width={48} height={7} rx={3.5} fill={c.onInk} />
        <Rect x={124} y={26} width={60} height={26} rx={13} fill={c.surface} stroke={c.border} strokeWidth={2} />
        <Rect x={136} y={36} width={36} height={7} rx={3.5} fill={c.textSecondary} />
        <Rect x={190} y={26} width={64} height={26} rx={13} fill={c.ink} />
        <Rect x={202} y={36} width={40} height={7} rx={3.5} fill={c.onInk} />
      </G>
      {CAPS.map((cap, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const match = i === 0 || i === 4 || i === 8;
        return (
          <CapShape key={i} x={70 + col * 56} y={66 + row * 54} size={48} {...cap} opacity={match ? 1 : 0.25} />
        );
      })}
      <G>
        <Circle cx={220} cy={170} r={34} fill="none" stroke={c.text} strokeWidth={9} />
        <Circle cx={220} cy={170} r={29} fill={c.surface} opacity={0.35} />
        <Line x1={244} y1={194} x2={268} y2={218} stroke={c.text} strokeWidth={12} strokeLinecap="round" />
      </G>
    </Svg>
  );
}

export function ExcelScene({ width = 300 }: { width?: number }) {
  const c = useColors();
  const green = '#1D7A46';
  return (
    <Svg width={width} height={width * 0.8} viewBox="0 0 300 240">
      <Circle cx={150} cy={125} r={110} fill={c.surfaceMuted} />
      <G>
        <Rect x={22} y={52} width={120} height={140} rx={16} fill={c.surface} stroke={c.border} strokeWidth={2} />
        <Rect x={22} y={52} width={120} height={28} rx={16} fill={green} />
        <Rect x={22} y={66} width={120} height={14} fill={green} />
        {[0, 1, 2, 3].map((r) => (
          <G key={r}>
            {[0, 1, 2].map((col) => (
              <Rect
                key={col}
                x={32 + col * 36}
                y={92 + r * 24}
                width={col === 0 ? 30 : 26}
                height={8}
                rx={4}
                fill={c.textTertiary}
                opacity={0.55}
              />
            ))}
            <Line x1={22} y1={110 + r * 24} x2={142} y2={110 + r * 24} stroke={c.border} strokeWidth={1.5} />
          </G>
        ))}
        <Path d="M36 60 L48 74 M48 60 L36 74" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" />
      </G>
      <G>
        <Circle cx={160} cy={122} r={20} fill={c.primary} />
        <Path d="M151 122 H168 M162 115 L169 122 L162 129" stroke="#FFFFFF" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </G>
      <CapShape x={192} y={56} size={60} {...CAPS[0]} />
      <CapShape x={222} y={104} size={56} {...CAPS[1]} />
      <CapShape x={186} y={146} size={58} {...CAPS[3]} />
    </Svg>
  );
}

export function CommunityScene({ width = 300 }: { width?: number }) {
  const c = useColors();
  return (
    <Svg width={width} height={width * 0.8} viewBox="0 0 300 240">
      <Circle cx={150} cy={125} r={110} fill={c.primarySoft} />
      <G>
        <Circle cx={80} cy={96} r={34} fill={c.ink} />
        <Circle cx={80} cy={86} r={12} fill={c.onInk} />
        <Path d="M60 116 C64 102 96 102 100 116" fill={c.onInk} />
      </G>
      <G>
        <Circle cx={220} cy={96} r={34} fill={c.accent} />
        <Circle cx={220} cy={86} r={12} fill="#FFFFFF" />
        <Path d="M200 116 C204 102 236 102 240 116" fill="#FFFFFF" />
      </G>
      <Path d="M122 84 C140 70 160 70 178 84" stroke={c.text} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Path d="M171 76 L179 85 L168 88" stroke={c.text} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M178 112 C160 126 140 126 122 112" stroke={c.text} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Path d="M129 120 L121 111 L132 108" stroke={c.text} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <CapShape x={104} y={146} size={50} {...CAPS[2]} />
      <CapShape x={146} y={150} size={50} {...CAPS[5]} />
      <G>
        <Rect x={196} y={160} width={72} height={30} rx={15} fill={c.surface} stroke={c.border} strokeWidth={2} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Path
            key={i}
            d={`M${210 + i * 11} 169 l2.2 4.6 5 .6 -3.7 3.4 1 5 -4.5-2.5 -4.5 2.5 1-5 -3.7-3.4 5-.6z`}
            fill={i < 4 ? c.accent : c.border}
          />
        ))}
      </G>
    </Svg>
  );
}

export function EmptyBoxScene({ width = 180 }: { width?: number }) {
  const c = useColors();
  return (
    <Svg width={width} height={width * 0.75} viewBox="0 0 180 135">
      <Circle cx={90} cy={70} r={62} fill={c.surfaceMuted} />
      <Path d="M40 62 L90 44 L140 62 L90 80 Z" fill={c.borderStrong} />
      <Path d="M40 62 L90 80 L90 124 L40 106 Z" fill={c.surface} stroke={c.border} strokeWidth={2} />
      <Path d="M140 62 L90 80 L90 124 L140 106 Z" fill={c.surfacePressed} stroke={c.border} strokeWidth={2} />
      <CapShape x={66} y={10} size={48} color={c.primary} mark="star" />
    </Svg>
  );
}
