/**
 * TrainingHub.tsx
 * Écran d'entrée de la section Training.
 * Présente deux choix : Mesurer (chrono) et Suivi (dashboard athlète).
 */
import React from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CpnLogo } from './CpnLogo';
import { useAppTheme } from '../utils/theme';

type Mode = 'mesurer' | 'suivi';

type ModeCardProps = {
  mode: Mode;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  bullets: string[];
  accent: string;
  onPress: () => void;
};

function ModeCard({ icon, title, subtitle, bullets, accent, onPress }: ModeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] }]}
    >
      <LinearGradient
        colors={[`${accent}18`, `${accent}06`]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={[styles.cardBorder, { borderColor: `${accent}44` }]} />

      <View style={[styles.iconWrap, { backgroundColor: `${accent}22`, borderColor: `${accent}55` }]}>
        <MaterialCommunityIcons name={icon} size={36} color={accent} />
      </View>

      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSub}>{subtitle}</Text>

      <View style={styles.bullets}>
        {bullets.map((b) => (
          <View key={b} style={styles.bulletRow}>
            <MaterialCommunityIcons name="check-circle-outline" size={14} color={accent} />
            <Text style={[styles.bulletText, { color: '#b9ccdd' }]}>{b}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.cta, { backgroundColor: `${accent}22`, borderColor: `${accent}55` }]}>
        <Text style={[styles.ctaText, { color: accent }]}>Accéder →</Text>
      </View>
    </Pressable>
  );
}

type Props = {
  onSelect: (mode: Mode) => void;
};

export default function TrainingHub({ onSelect }: Props) {
  const { palette } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[palette.background, palette.backgroundAlt]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <CpnLogo variant="full" size={48} />
          <View style={[styles.badge, { borderColor: palette.glow, backgroundColor: `${palette.accent}11` }]}>
            <MaterialCommunityIcons name="timer-outline" size={14} color={palette.accent} />
            <Text style={[styles.badgeText, { color: palette.accent }]}>Training</Text>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: palette.text }]}>Espace entraînement</Text>
          <Text style={[styles.heroSub, { color: palette.textMuted }]}>
            Chronométrez une performance ou consultez l'évolution d'un athlète.
          </Text>
        </View>

        {/* Cartes */}
        <ModeCard
          mode="mesurer"
          icon="timer-play-outline"
          title="Mesurer"
          subtitle="Chronométrage en séance"
          bullets={[
            'Chrono précis avec splits automatiques',
            'Bassin · Nage · Distance · Départ',
            'Correction du temps avant sauvegarde',
            'Enregistrement direct en base',
          ]}
          accent={palette.accent}
          onPress={() => onSelect('mesurer')}
        />

        <ModeCard
          mode="suivi"
          icon="chart-line-variant"
          title="Suivi"
          subtitle="Tableau de bord athlète"
          bullets={[
            'Sélection d\'un nageur',
            'Graphique d\'évolution des temps',
            'Filtres par nage · bassin · distance',
            'KPI : meilleur temps, tendance, volume',
          ]}
          accent="#a35eea"
          onPress={() => onSelect('suivi')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, gap: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7,
  },
  badgeText: { fontWeight: '800', fontSize: 12 },
  hero: { gap: 8, marginTop: 4 },
  heroTitle: { fontSize: 30, fontWeight: '900', letterSpacing: 0.3 },
  heroSub: { fontSize: 14, lineHeight: 21 },

  card: {
    borderRadius: 28,
    overflow: 'hidden',
    padding: 22,
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(13,32,53,0.9)',
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 1,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { color: '#e8f0f8', fontSize: 24, fontWeight: '900', letterSpacing: 0.3 },
  cardSub: { color: '#6a8ba5', fontSize: 14, marginTop: -6 },
  bullets: { gap: 8, marginTop: 4 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bulletText: { fontSize: 14, fontWeight: '500' },
  cta: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  ctaText: { fontWeight: '800', fontSize: 14 },
});
