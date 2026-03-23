import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../utils/constants';

interface EmptyStateProps {
  icon: string;
  title: string;
  sub?: string;
  compact?: boolean;
}

export default function EmptyState({ icon, title, sub, compact }: EmptyStateProps) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, useNativeDriver: true, tension: 60, friction: 12 }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.wrap, compact && styles.wrapCompact, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
      <Text style={[styles.icon, compact && styles.iconCompact]}>{icon}</Text>
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 52, gap: 12 },
  wrapCompact: { paddingVertical: 28, gap: 8 },
  icon: { fontSize: 44 },
  iconCompact: { fontSize: 32 },
  title: { color: COLORS.text, fontSize: 17, fontWeight: '900', textAlign: 'center' },
  titleCompact: { fontSize: 14 },
  sub: { color: COLORS.muted, fontSize: 13, textAlign: 'center', lineHeight: 19, maxWidth: 280 },
});
