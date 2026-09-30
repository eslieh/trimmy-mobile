import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../theme';

interface IconProps {
  size?: number;
  color?: string;
}

// ID badge — used for the Team row (staff roles/permissions), distinct from
// UsersIcon (Customers row) even though both are "people" concepts.
export function BadgeIcon({ size = 20, color = colors.text.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 3.5h10a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2z"
        stroke={color}
        strokeWidth={2}
      />
      <Path d="M9 3.5V6h6V3.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={12} cy={11.5} r={2} stroke={color} strokeWidth={2} />
      <Path d="M8.5 17c.6-1.6 2-2.5 3.5-2.5s2.9.9 3.5 2.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
