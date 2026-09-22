import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../theme';

interface IconProps {
  size?: number;
  color?: string;
}

// Sliders/adjustments glyph — Airbnb's filter-sheet trigger icon.
export function FilterIcon({ size = 20, color = colors.text.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7h10M18 7h2" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={15} cy={7} r={2.5} stroke={color} strokeWidth={2} />
      <Path d="M4 17h4M12 17h8" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={9} cy={17} r={2.5} stroke={color} strokeWidth={2} />
    </Svg>
  );
}
