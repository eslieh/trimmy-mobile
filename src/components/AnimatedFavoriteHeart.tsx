import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { HeartIcon } from './icons/HeartIcon';
import { colors, springs } from '../theme';

interface AnimatedFavoriteHeartProps {
  filled: boolean;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
}

// Drop-in replacement for a plain HeartIcon at favorite-toggle sites — pops
// with an overshoot spring when it becomes filled, rather than the color
// just snapping. Shared by BusinessResultCard, BusinessResultCardLarge, and
// Business Profile's hero favorite button.
export function AnimatedFavoriteHeart({
  filled,
  size = 18,
  activeColor = colors.brand.pink,
  inactiveColor = colors.white,
}: AnimatedFavoriteHeartProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (filled) {
      scale.value = withSequence(withSpring(1.3, springs.bouncy), withSpring(1, springs.bouncy));
    }
  }, [filled, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <HeartIcon size={size} color={filled ? activeColor : inactiveColor} filled={filled} />
    </Animated.View>
  );
}
