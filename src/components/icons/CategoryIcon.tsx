import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../theme';
import type { BusinessCategory } from '../../types/business';

interface CategoryIconProps {
  category: BusinessCategory;
  size?: number;
  color?: string;
}

// Thin outline icons for the business categories (same stroke style as the
// rest of components/icons), shown in IconBubbles on Explore.
export function CategoryIcon({ category, size = 24, color = colors.brand.pink }: CategoryIconProps) {
  const stroke = { stroke: color, strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {category === 'barbershop' ? (
        // Scissors
        <>
          <Circle cx={6} cy={6.5} r={2.5} {...stroke} />
          <Circle cx={6} cy={17.5} r={2.5} {...stroke} />
          <Path d="M8.2 7.8L20 18M8.2 16.2L20 6" {...stroke} />
        </>
      ) : category === 'hair_salon' ? (
        // Comb
        <>
          <Path d="M4 9.5h16v3H4z" {...stroke} />
          <Path d="M6 12.5V18M9 12.5V17M12 12.5V18M15 12.5V17M18 12.5V18" {...stroke} />
        </>
      ) : category === 'nail_salon' ? (
        // Fingertip with a polished nail
        <>
          <Path d="M8 21V8a4 4 0 0 1 8 0v13" {...stroke} />
          <Path d="M10 9.5a2 2 0 0 1 4 0V12a2 2 0 0 1-4 0z" {...stroke} />
        </>
      ) : category === 'spa' ? (
        // Lotus
        <>
          <Path d="M12 19c-3.5 0-7-2.5-8-6 2.5-.5 5.5.5 8 3 2.5-2.5 5.5-3.5 8-3-1 3.5-4.5 6-8 6z" {...stroke} />
          <Path d="M12 16c-1.5-1.5-2.5-3.5-2.5-6 0-2 1-3.8 2.5-5 1.5 1.2 2.5 3 2.5 5 0 2.5-1 4.5-2.5 6z" {...stroke} />
        </>
      ) : category === 'beauty' ? (
        // Lipstick
        <>
          <Path d="M9 13h6v8H9z" {...stroke} />
          <Path d="M10 13V7.5L14 5v8" {...stroke} />
        </>
      ) : (
        // Sparkle
        <Path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" {...stroke} />
      )}
    </Svg>
  );
}
