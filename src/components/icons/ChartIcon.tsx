import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme';

interface IconProps {
  size?: number;
  color?: string;
}

export function ChartIcon({ size = 22, color = colors.text.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 20V10M12 20V4M20 20v-6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
