import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../theme';

interface IconProps {
  size?: number;
  color?: string;
}

export function ListIcon({ size = 20, color = colors.text.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={4.5} cy={6} r={1.25} fill={color} />
      <Circle cx={4.5} cy={12} r={1.25} fill={color} />
      <Circle cx={4.5} cy={18} r={1.25} fill={color} />
      <Path d="M9 6h11M9 12h11M9 18h11" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
