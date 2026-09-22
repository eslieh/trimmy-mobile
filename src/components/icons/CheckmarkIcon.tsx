import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme';

interface IconProps {
  size?: number;
  color?: string;
}

// Bare inline checkmark for "selected" indicators (list rows, etc.) — distinct
// from CheckIcon, which is a fixed circular success badge.
export function CheckmarkIcon({ size = 18, color = colors.brand.purple }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 13l5 5 9-11" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
