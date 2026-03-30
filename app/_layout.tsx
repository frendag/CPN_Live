import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { setupNotifications } from '../src/utils/notifications';
import { AppThemeProvider } from '../src/utils/theme';

// ─── Logo SVG-like dessiné en RN ─────────────────────────────────────────────
function CpnLogoMark({ size = 72 }: { size?: number }) {
  const s = size / 100;
  // Mini icône : vague + courbe (rendu via View stylisés)
  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {/* Fond arrondi */}
      <View style={{
        position: 'absolute', inset: 0, borderRadius: size * 0.22,
        backgroundColor: '#001a33',
        shadowColor: '#FF0000', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
      }} />
      {/* Vague bleue */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: size * 0.22,
        backgroundColor: '#0055AA', borderBottomLeftRadius: size * 0.22,
        borderBottomRightRadius: size * 0.22, opacity: 0.85,
      }} />
      {/* Courbe rouge simulée par un dégradé diagonal */}
      <View style={{
        position: 'absolute', left: size*0.15, top: size*0.12,
        width: size*0.7, height: size*0.5,
        borderColor: '#FF0000', borderTopWidth: 3.5 * s * 2,
        borderRightWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0,
        transform: [{ rotate: '-18deg' }], borderRadius: 2,
      }} />
      {/* Texte CPN */}
      <View style={{ position:'absolute', bottom: size*0.05, alignSelf:'center' }}>
        <Text style={{ color:'#fff', fontSize: size*0.18, fontWeight:'900', letterSpacing:1 }}>CPN</Text>
      </View>
    </View>
  );
}

function SplashScreen() {
  const scale   = useRef(new Animated.Value(0.75)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(20)).current;
  const barX    = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,  { toValue: 1, useNativeDriver: true, tension: 65, friction: 8 }),
      Animated.timing(opacity,{ toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, tension: 55, friction: 10, delay: 120 }),
    ]).start(() => {
      // Barre animée en loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(barX, { toValue: 1, duration: 1400, useNativeDriver: true }),
          Animated.timing(barX, { toValue: -1, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  const barTranslate = barX.interpolate({
    inputRange: [-1, 1], outputRange: ['-110%', '110%'],
  });

  return (
    <View style={styles.splash}>
      {/* Logo mark */}
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <CpnLogoMark size={100} />
      </Animated.View>

      {/* Textes */}
      <Animated.View style={{ transform: [{ translateY: slideY }], opacity, alignItems: 'center', gap: 4 }}>
        <Text style={styles.splashTitle}>CERGY PONTOISE</Text>
        <View style={styles.splashLine} />
        <Text style={styles.splashNata}>NATATION</Text>
        <Text style={styles.splashAnalytics}>Analytics</Text>
      </Animated.View>

      {/* Barre de chargement */}
      <Animated.View style={{ opacity, marginTop: 36 }}>
        <View style={styles.loaderTrack}>
          <Animated.View
            style={[styles.loaderFill, { transform: [{ translateX: barTranslate }] }]}
          />
        </View>
        <Text style={styles.loaderLabel}>Initialisation…</Text>
      </Animated.View>
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    setupNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1, backgroundColor: '#001a33',
    alignItems: 'center', justifyContent: 'center', gap: 20,
  },
  splashTitle: {
    color: '#FFFFFF', fontSize: 26, fontWeight: '900',
    letterSpacing: 2, fontStyle: 'italic', textAlign: 'center',
  },
  splashLine: { width: 200, height: 2, backgroundColor: '#FF0000', opacity: 0.85 },
  splashNata: {
    color: '#FF0000', fontSize: 20, fontWeight: '700',
    letterSpacing: 8, textAlign: 'center',
  },
  splashAnalytics: {
    color: '#FFD54A', fontSize: 14, fontWeight: '800',
    letterSpacing: 2, textAlign: 'center',
  },
  loaderTrack: {
    width: 200, height: 3, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2, overflow: 'hidden',
  },
  loaderFill: {
    position: 'absolute', width: '55%', height: '100%',
    backgroundColor: '#FF0000', borderRadius: 2,
  },
  loaderLabel: {
    marginTop: 12, color: '#FFD54A', fontSize: 9,
    letterSpacing: 4, textTransform: 'uppercase', opacity: 0.8, textAlign: 'center',
  },
});
