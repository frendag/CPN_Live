import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { setupNotifications } from '../src/utils/notifications';
import { AppThemeProvider } from '../src/utils/theme';
import { loadAthletes } from '../src/utils/athletesCache';

// ─── Logo SVG-like dessiné en RN ─────────────────────────────────────────────
function CpnLogoMark({ size = 72 }: { size?: number }) {
  const s = size / 100;
  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <View style={{
        position: 'absolute', inset: 0, borderRadius: size * 0.22,
        backgroundColor: '#001a33',
        shadowColor: '#FF0000', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
      }} />
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: size * 0.22,
        backgroundColor: '#0055AA', borderBottomLeftRadius: size * 0.22,
        borderBottomRightRadius: size * 0.22, opacity: 0.85,
      }} />
      <View style={{
        position: 'absolute', left: size * 0.15, top: size * 0.12,
        width: size * 0.7, height: size * 0.5,
        borderColor: '#FF0000', borderTopWidth: 3.5 * s * 2,
        borderRightWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0,
        transform: [{ rotate: '-18deg' }], borderRadius: 2,
      }} />
      <View style={{ position: 'absolute', bottom: size * 0.05, alignSelf: 'center' }}>
        <Text style={{ color: '#fff', fontSize: size * 0.18, fontWeight: '900', letterSpacing: 1 }}>CPN</Text>
      </View>
    </View>
  );
}

// ─── Étapes d'initialisation ─────────────────────────────────────────────────
// Chaque étape a un poids relatif (somme = 100)
const INIT_STEPS = [
  { key: 'theme',    label: 'Chargement du thème',          pct: 10 },
  { key: 'notifs',   label: 'Configuration notifications',   pct: 20 },
  { key: 'athletes', label: 'Chargement des athlètes',       pct: 55 },
  { key: 'ui',       label: 'Préparation de l\'interface',   pct: 15 },
] as const;

type StepKey = typeof INIT_STEPS[number]['key'];

// ─── SplashScreen ─────────────────────────────────────────────────────────────
interface SplashProps {
  pct: number;
  stepLabel: string;
  completedSteps: StepKey[];
}

function SplashScreen({ pct, stepLabel, completedSteps }: SplashProps) {
  const scale   = useRef(new Animated.Value(0.75)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(20)).current;

  // Barre de progression animée (width interpolée sur pct)
  const barWidth = useRef(new Animated.Value(0)).current;
  const labelOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,  { toValue: 1, useNativeDriver: true, tension: 65, friction: 8 }),
      Animated.timing(opacity,{ toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, tension: 55, friction: 10, delay: 120 }),
      Animated.timing(labelOpacity, { toValue: 1, duration: 600, delay: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  // Animer la barre quand pct change
  useEffect(() => {
    Animated.timing(barWidth, {
      toValue: pct,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const barWidthPct = barWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  // Couleur de la barre : rouge → orange → vert selon avancement
  const barColor = pct < 40 ? '#FF0000' : pct < 80 ? '#FF8C00' : '#00C9A7';

  return (
    <View style={styles.splash}>
      {/* Logo */}
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <CpnLogoMark size={100} />
      </Animated.View>

      {/* Textes titre */}
      <Animated.View style={{ transform: [{ translateY: slideY }], opacity, alignItems: 'center', gap: 4 }}>
        <Text style={styles.splashTitle}>CERGY PONTOISE</Text>
        <View style={styles.splashLine} />
        <Text style={styles.splashNata}>NATATION</Text>
        <Text style={styles.splashAnalytics}>Analytics</Text>
      </Animated.View>

      {/* Zone de progression */}
      <Animated.View style={[styles.progressZone, { opacity: labelOpacity }]}>

        {/* Barre de progression avec pourcentage */}
        <View style={styles.progressHeader}>
          <Text style={styles.progressStepLabel} numberOfLines={1}>{stepLabel}</Text>
          <Text style={styles.progressPct}>{pct}%</Text>
        </View>

        <View style={styles.loaderTrack}>
          <Animated.View
            style={[styles.loaderFill, { width: barWidthPct, backgroundColor: barColor }]}
          />
        </View>

        {/* Liste des étapes défilantes */}
        <View style={styles.stepsList}>
          {INIT_STEPS.map((step) => {
            const done = completedSteps.includes(step.key);
            const active = stepLabel === step.label;
            return (
              <View key={step.key} style={styles.stepRow}>
                <Text style={[
                  styles.stepDot,
                  done  && { color: '#00C9A7' },
                  active && !done && { color: '#FFD54A' },
                ]}>
                  {done ? '✓' : active ? '›' : '·'}
                </Text>
                <Text style={[
                  styles.stepText,
                  done  && styles.stepTextDone,
                  active && !done && styles.stepTextActive,
                ]}>
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

// ─── RootLayout ───────────────────────────────────────────────────────────────
export default function RootLayout() {
  const [ready, setReady]             = useState(false);
  const [pct, setPct]                 = useState(0);
  const [stepLabel, setStepLabel]     = useState(INIT_STEPS[0].label);
  const [completed, setCompleted]     = useState<StepKey[]>([]);

  const markDone = (key: StepKey, nextPct: number, nextLabel?: string) => {
    setCompleted((prev) => [...prev, key]);
    setPct(nextPct);
    if (nextLabel) setStepLabel(nextLabel);
  };

  useEffect(() => {
    let mounted = true;

    async function init() {
      // Étape 1 : Thème (synchrone, juste un tick)
      setPct(INIT_STEPS[0].pct);
      setStepLabel(INIT_STEPS[1].label);
      await new Promise((r) => setTimeout(r, 80));
      if (!mounted) return;
      markDone('theme', INIT_STEPS[0].pct + INIT_STEPS[1].pct, INIT_STEPS[2].label);

      // Étape 2 : Notifications
      await setupNotifications().catch(() => {});
      if (!mounted) return;
      markDone('notifs', INIT_STEPS[0].pct + INIT_STEPS[1].pct, INIT_STEPS[2].label);

      // Étape 3 : Cache athlètes (la plus longue — cold start uWSGI)
      await loadAthletes().catch(() => {});
      if (!mounted) return;
      const afterAthletes = INIT_STEPS[0].pct + INIT_STEPS[1].pct + INIT_STEPS[2].pct;
      markDone('athletes', afterAthletes, INIT_STEPS[3].label);

      // Étape 4 : UI (tick final)
      await new Promise((r) => setTimeout(r, 120));
      if (!mounted) return;
      markDone('ui', 100, 'Prêt !');

      // Petit délai pour que l'animation 100% soit visible
      await new Promise((r) => setTimeout(r, 300));
      if (!mounted) return;
      setReady(true);
    }

    init();
    return () => { mounted = false; };
  }, []);

  if (!ready) {
    return (
      <SafeAreaProvider>
        <SplashScreen pct={pct} stepLabel={stepLabel} completedSteps={completed} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  splash: {
    flex: 1, backgroundColor: '#001a33',
    alignItems: 'center', justifyContent: 'center', gap: 24,
  },

  // Titre
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

  // Zone de progression
  progressZone: {
    width: 240, gap: 10,
  },
  progressHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  progressStepLabel: {
    color: '#FFD54A', fontSize: 9, fontWeight: '700',
    letterSpacing: 2, textTransform: 'uppercase', flex: 1,
  },
  progressPct: {
    color: '#FFD54A', fontSize: 11, fontWeight: '900',
    letterSpacing: 1, marginLeft: 8,
  },
  loaderTrack: {
    width: '100%', height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2, overflow: 'hidden',
  },
  loaderFill: {
    height: '100%', borderRadius: 2,
  },

  // Liste des étapes
  stepsList: {
    gap: 5, marginTop: 8,
  },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  stepDot: {
    color: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: '900', width: 14,
    textAlign: 'center',
  },
  stepText: {
    color: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: '500',
    letterSpacing: 0.3,
  },
  stepTextDone: {
    color: '#00C9A7', textDecorationLine: 'line-through',
  },
  stepTextActive: {
    color: '#FFD54A', fontWeight: '700',
  },
});
