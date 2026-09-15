import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../theme';

interface IconProps {
  size?: number;
}

export function CheckIcon({ size = 96 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <Circle cx={48} cy={48} r={48} fill="#F5EAFB" />
      <Path
        d="M32 49l11 11 21-23"
        stroke={colors.brand.purple}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
