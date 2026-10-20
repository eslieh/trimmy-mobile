import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../theme';

interface IconProps {
  size?: number;
  color?: string;
}

export function WifiOffIcon({ size = 18, color = colors.feedback.danger }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M2 8.5a15 15 0 0 1 6-3.2M22 8.5A15 15 0 0 0 12 5" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M5.5 12a10 10 0 0 1 3.5-2.2M18.5 12a10 10 0 0 0-3-2" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M9 15.5a5 5 0 0 1 6 0" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={12} cy={19} r={1.4} fill={color} />
      <Path d="M3 3l18 18" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
