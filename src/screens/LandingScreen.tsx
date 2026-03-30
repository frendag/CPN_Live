import React from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CpnLogo } from '../components/CpnLogo';
import { AccentName, THEME_ACCENTS, ThemeMode, useAppTheme } from '../utils/theme';

function RouteOrb({
  label,
  subtitle,
  icon,
  onPress,
  accent,
}: {
  label: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  accent: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.orbWrap}>
      <LinearGradient
        colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.03)']}
        style={styles.orbOuter}
      >
        <View style={[styles.orbGlow, { shadowColor: accent, borderColor: `${accent}55` }]} />
        <View style={[styles.orbInner, { borderColor: `${accent}66` }]}>
          <MaterialCommunityIcons name={icon} size={42} color={accent} />
          <Text style={styles.orbTitle}>{label}</Text>
          <Text style={styles.orbSub}>{subtitle}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function SettingPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function LandingScreen() {
  const router = useRouter();
  const { palette, preference, setMode, setAccentName } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[palette.background, palette.backgroundAlt, '#020814']} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <CpnLogo variant="full" size={54} />
          <View style={[styles.badge, { borderColor: palette.glow, backgroundColor: `${palette.accent}11` }]}>
            <Text style={[styles.badgeText, { color: palette.accent }]}>Swim Performance Hub</Text>
          </View>
        </View>

        <View style={styles.heroBlock}>
          <Text style={[styles.heroTitle, { color: palette.text }]}>Pilotage CPN</Text>
          <Text style={[styles.heroSub, { color: palette.textMuted }]}>
            Accès rapide aux indicateurs, à la compétition live et aux performances d'entraînement.
          </Text>
        </View>

        <View style={styles.orbsRow}>
          <RouteOrb label="KPI" subtitle="Athlètes & tendances" icon="chart-line" onPress={() => router.push('/kpi')} accent={palette.accent} />
          <RouteOrb label="Compétition" subtitle="Programme & résultats" icon="trophy-outline" onPress={() => router.push('/competition')} accent={palette.accent} />
          <RouteOrb label="Trainning" subtitle="Chrono & splits" icon="timer-outline" onPress={() => router.push('/training')} accent={palette.accent} />
        </View>

        <View style={[styles.panel, { backgroundColor: palette.surface, borderColor: palette.cardBorder }]}> 
          <Text style={[styles.panelTitle, { color: palette.text }]}>Thème utilisateur</Text>
          <Text style={[styles.panelSub, { color: palette.textMuted }]}>Préférences enregistrées localement sur le mobile / la tablette.</Text>

          <Text style={[styles.groupLabel, { color: palette.textMuted }]}>Mode</Text>
          <View style={styles.pillRow}>
            {(['dark', 'light', 'system'] as ThemeMode[]).map((mode) => (
              <SettingPill key={mode} label={mode} active={preference.mode === mode} onPress={() => setMode(mode)} />
            ))}
          </View>

          <Text style={[styles.groupLabel, { color: palette.textMuted, marginTop: 16 }]}>Accent</Text>
          <View style={styles.accentRow}>
            {(Object.keys(THEME_ACCENTS) as AccentName[]).map((name) => (
              <Pressable
                key={name}
                onPress={() => setAccentName(name)}
                style={[
                  styles.accentDot,
                  { backgroundColor: THEME_ACCENTS[name], borderColor: preference.accentName === name ? '#fff' : 'transparent' },
                ]}
              />
            ))}
          </View>
        </View>

        <View style={[styles.footerCard, { backgroundColor: palette.surfaceHigh, borderColor: palette.cardBorder }]}> 
          <CpnLogo variant="mark" size={34} />
          <Text style={[styles.footerText, { color: palette.textMuted }]}>CPN • Centre de pilotage mobile natation</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 22, gap: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  badge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  heroBlock: { gap: 8, marginTop: 10 },
  heroTitle: { fontSize: 32, fontWeight: '900', letterSpacing: 0.5 },
  heroSub: { fontSize: 15, lineHeight: 22 },
  orbsRow: { gap: 18, marginTop: 8 },
  orbWrap: { alignItems: 'center' },
  orbOuter: {
    width: '100%', borderRadius: 38, padding: 2,
  },
  orbGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 38,
    borderWidth: 1,
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  orbInner: {
    minHeight: 138,
    borderRadius: 36,
    borderWidth: 1,
    backgroundColor: 'rgba(5,15,29,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 22,
  },
  orbTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
  orbSub: { color: '#b4c8da', fontSize: 13 },
  panel: { borderRadius: 24, borderWidth: 1, padding: 18 },
  panelTitle: { fontSize: 20, fontWeight: '800' },
  panelSub: { marginTop: 6, fontSize: 13, lineHeight: 18 },
  groupLabel: { marginTop: 14, marginBottom: 8, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)' },
  pillActive: { backgroundColor: 'rgba(255,255,255,0.16)' },
  pillText: { color: '#a9bfd2', textTransform: 'capitalize', fontWeight: '700' },
  pillTextActive: { color: '#fff' },
  accentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  accentDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2 },
  footerCard: { borderRadius: 20, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  footerText: { fontSize: 13, fontWeight: '600' },
});
