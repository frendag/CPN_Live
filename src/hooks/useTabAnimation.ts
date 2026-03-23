import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Provides fade + slide transition between tabs.
 * Returns an Animated.Value (0→1) that drives opacity and translateX.
 */
export function useTabAnimation(key: string) {
  const anim = useRef(new Animated.Value(0)).current;
  const prevKey = useRef(key);

  useEffect(() => {
    if (prevKey.current !== key) {
      prevKey.current = key;
      anim.setValue(0);
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 14,
      }).start();
    } else {
      // Initial mount
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [key]);

  const opacity = anim;
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  return { opacity, translateX };
}
