import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme';

interface IconProps {
  size?: number;
  color?: string;
  filled?: boolean;
}

export function HeartIcon({ size = 20, color = colors.text.primary, filled = false }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
      <Path
        d="M12 20s-7-4.35-9.5-8.5C.87 8.1 2 4.5 5.5 4a4.9 4.9 0 0 1 6.5 2.5A4.9 4.9 0 0 1 18.5 4c3.5.5 4.63 4.1 3 7.5C19 15.65 12 20 12 20z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
