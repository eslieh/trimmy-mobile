import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '../../theme';

interface IconProps {
  size?: number;
  color?: string;
}

export function CalendarIcon({ size = 22, color = colors.text.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={5} width={16} height={16} rx={2} stroke={color} strokeWidth={2} />
      <Path d="M4 10h16" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M8 3v3M16 3v3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
