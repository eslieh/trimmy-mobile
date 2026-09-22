import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

// Filled rating star — used inline next to rating numbers throughout
// Discovery (result cards, Business Profile, reviews).
export function StarIcon({ size = 14, color = '#F5A623' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2.5l2.9 6.3 6.9.7-5.2 4.7 1.5 6.8-6.1-3.6-6.1 3.6 1.5-6.8L2.2 9.5l6.9-.7L12 2.5z" />
    </Svg>
  );
}
