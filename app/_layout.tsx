import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function SplashLogo() {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const waveY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 70, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(waveY, { toValue: 0, useNativeDriver: true, tension: 50, friction: 10, delay: 200 }),
    ]).start();
  }, []);

  return (
    <View style={styles.splash}>
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <Text style={styles.splashEmoji}>🏊</Text>
      </Animated.View>
      <Animated.View style={{ transform: [{ translateY: waveY }], opacity }}>
        <Text style={styles.splashTitle}>CPN Live</Text>
        <Text style={styles.splashSub}>Cergy Pontoise Natation</Text>
      </Animated.View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: '#040f18', alignItems: 'center', justifyContent: 'center', gap: 16 },
  splashEmoji: { fontSize: 64, textAlign: 'center' },
  splashTitle: { color: '#e8f0f8', fontSize: 28, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
  splashSub: { color: '#6a8ba5', fontSize: 14, textAlign: 'center', marginTop: 4 },
});
