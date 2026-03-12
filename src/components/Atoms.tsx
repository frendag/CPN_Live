import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, MEDAL_CONFIG, AVATAR_PALETTE } from '../utils/constants';
import { initials, avatarColor, getNageColors, parseRangGeneral, isAbsence, formatDelta } from '../utils/helpers';

// ── Avatar initiales coloré ───────────────────────────────────────────────────
export function Avatar({ name, size = 38 }: { name: string; size?: number }) {
  const bg = avatarColor(name);
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials(name)}</Text>
    </View>
  );
}

// ── Badge médaille / rang ─────────────────────────────────────────────────────
export function MedalBadge({ pos }: { pos: number | null }) {
  if (!pos) return <Text style={styles.dash}>—</Text>;
  const cfg = MEDAL_CONFIG[pos];
  if (cfg) {
    return (
      <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
      </View>
    );
  }
  const bg  = pos <= 5  ? '#fef9c3' : pos <= 10 ? '#dcfce7' : pos <= 20 ? '#dbeafe' : '#f1f5f9';
  const col = pos <= 5  ? '#854d0e' : pos <= 10 ? '#14532d' : pos <= 20 ? '#1e40af' : '#94a3b8';
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: col }]}>{pos}e</Text>
    </View>
  );
}

// ── Pill épreuve colorée ──────────────────────────────────────────────────────
export function NagePill({ ep }: { ep: string }) {
  const c = getNageColors(ep);
  return (
    <View style={[styles.pill, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.pillText, { color: c.text }]}>{ep}</Text>
    </View>
  );
}

// ── Affichage du temps ────────────────────────────────────────────────────────
export function TempsDisplay({ temps }: { temps: string }) {
  if (!temps) return <Text style={styles.tempsWait}>En attente…</Text>;
  if (isAbsence(temps)) return <Text style={styles.tempsAbsence}>{temps}</Text>;
  return <Text style={styles.tempsOk}>{temps}</Text>;
}

// ── Badge LIVE animé ─────────────────────────────────────────────────────────
export function LiveBadge() {
  return (
    <View style={styles.liveBadge}>
      <Text style={styles.liveBadgeText}>● LIVE</Text>
    </View>
  );
}

// ── Chip points FFN ───────────────────────────────────────────────────────────
export function PtsBadge({ pts }: { pts: string }) {
  if (!pts) return null;
  return (
    <View style={styles.ptsBadge}>
      <Text style={styles.ptsBadgeText}>{pts}</Text>
    </View>
  );
}

// ── Indicateur de progression ─────────────────────────────────────────────────
export function ProgBadge({ tendance, delta_sec }: { tendance: string; delta_sec: number | null }) {
  if (delta_sec === null || delta_sec === undefined) {
    return <Text style={styles.progNone}>—</Text>;
  }
  const label = formatDelta(delta_sec);
  if (tendance === 'better') {
    return (
      <View style={[styles.progBadge, { backgroundColor: COLORS.better.bg, borderColor: COLORS.better.border }]}>
        <Text style={[styles.progText, { color: COLORS.better.text }]}>▼ {label}</Text>
      </View>
    );
  }
  if (tendance === 'worse') {
    return (
      <View style={[styles.progBadge, { backgroundColor: COLORS.worse.bg, borderColor: COLORS.worse.border }]}>
        <Text style={[styles.progText, { color: COLORS.worse.text }]}>▲ {label}</Text>
      </View>
    );
  }
  if (tendance === 'stable') {
    return (
      <View style={[styles.progBadge, { backgroundColor: COLORS.stable.bg, borderColor: COLORS.stable.border }]}>
        <Text style={[styles.progText, { color: COLORS.stable.text }]}>→ ≈ 0 s</Text>
      </View>
    );
  }
  return <Text style={styles.progNone}>·</Text>;
}

// ── Badge série ───────────────────────────────────────────────────────────────
export function SerieBadge({ serie }: { serie: string }) {
  if (!serie) return <Text style={styles.dash}>—</Text>;
  return (
    <View style={styles.serieBadge}>
      <Text style={styles.serieText}>S{serie}</Text>
    </View>
  );
}

// ── Badge plot ────────────────────────────────────────────────────────────────
export function PlotBadge({ plot }: { plot: string }) {
  if (!plot) return <Text style={styles.dash}>—</Text>;
  return (
    <View style={styles.plotBadge}>
      <Text style={styles.plotText}>{plot}</Text>
    </View>
  );
}

// ── Heure de passage ─────────────────────────────────────────────────────────
export function HeureBadge({ heure }: { heure: string }) {
  if (!heure) return <Text style={styles.dash}>—</Text>;
  return <Text style={styles.heureText}>⏰ {heure}</Text>;
}

// ── Temps de référence ────────────────────────────────────────────────────────
export function TempsRef({ temps }: { temps: string }) {
  if (!temps) return <Text style={styles.dash}>—</Text>;
  return <Text style={styles.tempsRefText}>{temps}</Text>;
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  avatarText: { color: '#fff', fontWeight: '900', letterSpacing: -0.5 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  dash: { color: '#cbd5e1', fontSize: 13 },
  pill: { borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3 },
  pillText: { fontSize: 12, fontWeight: '800' },
  tempsWait: { color: '#94a3b8', fontSize: 13, fontStyle: 'italic' },
  tempsAbsence: { color: '#dc2626', fontSize: 14, fontWeight: '700' },
  tempsOk: { fontFamily: 'Courier', fontSize: 16, fontWeight: '700', color: '#065f46', letterSpacing: 0.3 },
  liveBadge: { backgroundColor: '#ef4444', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 3 },
  liveBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  ptsBadge: { backgroundColor: '#dbeafe', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  ptsBadgeText: { color: '#1e40af', fontSize: 12, fontWeight: '700' },
  // Progression
  progBadge: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3 },
  progText: { fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] as any },
  progNone: { color: '#cbd5e1', fontSize: 13 },
  // Programme
  serieBadge: { backgroundColor: '#eef2ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  serieText: { color: '#3730a3', fontSize: 12, fontWeight: '700' },
  plotBadge: { backgroundColor: '#dbeafe', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  plotText: { color: '#1e40af', fontSize: 12, fontWeight: '700' },
  heureText: { color: '#16a34a', fontSize: 13, fontWeight: '700' },
  tempsRefText: { fontFamily: 'Courier', fontSize: 13, color: '#64748b' },
});
