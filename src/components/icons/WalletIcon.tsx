import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../../theme';

interface IconProps {
  size?: number;
  color?: string;
}

export function WalletIcon({ size = 20, color = colors.text.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x={3} y={7} width={18} height={12} rx={2} stroke={color} strokeWidth={2} />
      <Circle cx={16.5} cy={13} r={1.25} fill={color} />
    </Svg>
  );
}
