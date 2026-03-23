import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/constants';
import { Avatar } from './Atoms';

// Podium visuel premium — affiché optionnellement dans HomeScreen si des résultats finaux existent
interface PodiumEntry {
  rank: number;
  nom: string;
  temps: string;
  points?: string | number;
  epreuve: string;
}

interface Props {
  entries: PodiumEntry[];
  title?: string;
}

function PodiumBar({ entry, delay }: { entry: PodiumEntry; delay: number }) {
  const scaleY = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleY, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10, delay }),
      Animated.timing(fadeIn, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const cfg = {
    1: { h: 90,  medal: '🥇', bg: ['#5d4a00', '#3d3000'] as const, accent: COLORS.rank1Text, label: '1er' },
    2: { h: 65,  medal: '🥈', bg: ['#2a3540', '#1a2530'] as const, accent: COLORS.rank2Text, label: '2e' },
    3: { h: 50,  medal: '🥉', bg: ['#3d2010', '#2a1508'] as const, accent: COLORS.rank3Text, label: '3e' },
  }[entry.rank] || { h: 40, medal: '🏅', bg: ['#0d2035', '#091a2c'] as const, accent: COLORS.muted, label: `${entry.rank}e` };

  return (
    <Animated.View style={[styles.barWrap, { opacity: fadeIn }]}>
      <View style={styles.barTop}>
        <Avatar name={entry.nom} size={38} />
        <Text style={[styles.barName, { color: cfg.accent }]} numberOfLines={1}>{entry.nom}</Text>
        <Text style={styles.barTemps}>{entry.temps}</Text>
        {entry.points ? <Text style={styles.barPts}>{entry.points} pts</Text> : null}
      </View>
      <Animated.View style={{ transform: [{ scaleY }], transformOrigin: 'bottom' }}>
        <LinearGradient colors={cfg.bg} style={[styles.barBlock, { height: cfg.h }]}>
          <Text style={styles.barMedal}>{cfg.medal}</Text>
          <Text style={[styles.barRank, { color: cfg.accent }]}>{cfg.label}</Text>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

export default function VuePodiums({ entries, title }: Props) {
  if (!entries?.length) return null;

  // Reorder for visual podium: 2nd left, 1st center, 3rd right
  const ordered = [
    entries.find(e => e.rank === 2),
    entries.find(e => e.rank === 1),
    entries.find(e => e.rank === 3),
  ].filter(Boolean) as PodiumEntry[];

  const rest = entries.filter(e => e.rank > 3);

  return (
    <View style={styles.wrap}>
      {title ? (
        <View style={styles.titleRow}>
          <View style={styles.titleAccent} />
          <Text style={styles.title}>{title}</Text>
        </View>
      ) : null}

      {/* Podium visual */}
      <View style={styles.podiumRow}>
        {ordered.map((e, i) => (
          <PodiumBar key={e.rank} entry={e} delay={i * 100} />
        ))}
      </View>

      {/* Rest of results */}
      {rest.length > 0 && (
        <View style={styles.restList}>
          {rest.map((e) => (
            <View key={e.rank} style={styles.restRow}>
              <Text style={styles.restRank}>{e.rank}e</Text>
              <Text style={styles.restNom} numberOfLines={1}>{e.nom}</Text>
              <Text style={styles.restTemps}>{e.temps}</Text>
              {e.points ? <Text style={styles.restPts}>{e.points} pts</Text> : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleAccent: { width: 3, height: 16, backgroundColor: COLORS.accent, borderRadius: 2 },
  title: { color: COLORS.text, fontSize: 14, fontWeight: '800' },

  podiumRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 10, paddingHorizontal: 8 },
  barWrap: { flex: 1, alignItems: 'center', gap: 8 },
  barTop: { alignItems: 'center', gap: 4, paddingBottom: 2 },
  barName: { fontSize: 11, fontWeight: '800', textAlign: 'center' },
  barTemps: { color: COLORS.textMid, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  barPts: { color: COLORS.muted, fontSize: 10 },
  barBlock: { width: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: 10, gap: 4, paddingVertical: 8 },
  barMedal: { fontSize: 20 },
  barRank: { fontSize: 12, fontWeight: '900' },

  restList: { backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  restRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  restRank: { color: COLORS.muted, fontSize: 12, fontWeight: '800', minWidth: 28 },
  restNom: { flex: 1, color: COLORS.text, fontSize: 13, fontWeight: '700' },
  restTemps: { color: COLORS.textMid, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  restPts: { color: COLORS.muted, fontSize: 11 },
});
