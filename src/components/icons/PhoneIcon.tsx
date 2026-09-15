import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme';

interface IconProps {
  size?: number;
  color?: string;
}

export function PhoneIcon({ size = 20, color = colors.text.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.6 10.8c1.2 2.4 3.2 4.4 5.6 5.6l1.9-1.9c.2-.2.6-.3.9-.2 1 .3 2 .5 3.1.5.5 0 .9.4.9.9V19c0 .5-.4.9-.9.9C9.9 19.9 4.1 14.1 4.1 6.9c0-.5.4-.9.9-.9h3.3c.5 0 .9.4.9.9 0 1.1.2 2.1.5 3.1.1.3 0 .7-.2.9L6.6 10.8z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
