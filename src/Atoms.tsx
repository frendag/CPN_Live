import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../utils/constants';
import { avatarColor, getNageColors, initials, plotColor, rankLabel, rankTone } from '../utils/helpers';
import { TrendMeta } from '../utils/types';

// ─── Avatar ──────────────────────────────────────────────────────────────────
export function Avatar({ name, size = 38 }: { name: string; size?: number }) {
  const bg = avatarColor(name);
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <LinearGradient
        colors={[bg, bg + 'bb']}
        style={[styles.avatarGrad, { borderRadius: size / 2 }]}
      >
        <Text style={[styles.avatarText, { fontSize: size * 0.34 }]}>{initials(name)}</Text>
      </LinearGradient>
    </View>
  );
}

// ─── LiveBadge ────────────────────────────────────────────────────────────────
export function LiveBadge({ countdown }: { countdown?: number | null }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);
  return (
    <View style={styles.liveWrap}>
      <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
      <Text style={styles.liveText}>LIVE</Text>
      {typeof countdown === 'number' && countdown >= 0 ? (
        <View style={styles.liveCountdownWrap}>
          <Text style={styles.liveCountdown}>{countdown}s</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── NagePill ─────────────────────────────────────────────────────────────────
export function NagePill({ label }: { label: string }) {
  const colors = getNageColors(label);
  return (
    <View style={[styles.pill, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.pillText, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

// ─── TypeBadge ───────────────────────────────────────────────────────────────
export function TypeBadge({ typeSerie }: { typeSerie?: string | null }) {
  const label = String(typeSerie || '').trim();
  if (!label) return null;
  const low = label.toLowerCase();
  const tone = low.includes('finale')
    ? { bg: COLORS.finaleBg, text: COLORS.finaleText }
    : low.includes('demi')
      ? { bg: COLORS.demiBg, text: COLORS.demiText }
      : { bg: COLORS.serieBg, text: COLORS.serieText };
  return (
    <View style={[styles.typeBadge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.typeBadgeText, { color: tone.text }]}>{label}</Text>
    </View>
  );
}

// ─── PlotBadge ───────────────────────────────────────────────────────────────
export function PlotBadge({ plot }: { plot?: number | string | null }) {
  if (!plot) return <Text style={styles.dim}>—</Text>;
  const bg = plotColor(plot);
  return (
    <View style={[styles.plotBadge, { backgroundColor: bg + '33', borderColor: bg + '66' }]}>
      <Text style={[styles.plotText, { color: bg }]}>{plot}</Text>
    </View>
  );
}

// ─── RankBadge ───────────────────────────────────────────────────────────────
export function RankBadge({ pos, total, fallback }: { pos?: number | null; total?: number | null; fallback?: string | null }) {
  const label = rankLabel(pos, total, fallback);
  if (label === '—') return <Text style={styles.dim}>—</Text>;
  const tone = rankTone(pos ?? (fallback ? parseInt(String(fallback), 10) : null));
  return (
    <View style={[styles.rankBadge, { backgroundColor: tone.bg, borderColor: (tone as any).border || tone.bg }]}>
      <Text style={[styles.rankText, { color: tone.text }]}>{label}</Text>
    </View>
  );
}

// ─── TrendBadge ──────────────────────────────────────────────────────────────
export function TrendBadge({ meta }: { meta: TrendMeta }) {
  if (meta.tone === 'none') return <Text style={styles.dim}>—</Text>;
  if (meta.tone === 'forfeit') return <Text style={[styles.trendLabel, { color: COLORS.muted }]}>Forfait</Text>;
  const tone = meta.tone === 'better'
    ? { color: COLORS.success }
    : meta.tone === 'worse'
      ? { color: COLORS.danger }
      : { color: COLORS.muted };
  const icon = meta.tone === 'better' ? '▲' : meta.tone === 'worse' ? '▼' : '➜';
  return (
    <View style={styles.trendWrap}>
      <Text style={[styles.trendLabel, tone]}>{icon} {meta.label}</Text>
      {meta.detail ? <Text style={styles.trendDetail}>{meta.detail}</Text> : null}
    </View>
  );
}

// ─── SectionCard ─────────────────────────────────────────────────────────────
export function SectionCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[styles.sectionCard, style]}>
      {children}
    </View>
  );
}

// ─── GlassCard ───────────────────────────────────────────────────────────────
export function GlassCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[styles.glassCard, style]}>
      {children}
    </View>
  );
}

// ─── SectionHeader ───────────────────────────────────────────────────────────
export function SectionHeader({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderAccent} />
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionHeaderTitle}>{title}</Text>
        {sub ? <Text style={styles.sectionHeaderSub}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
}

// ─── KpiCard ─────────────────────────────────────────────────────────────────
export function KpiCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <View style={[styles.kpiCard, accent && styles.kpiCardAccent]}>
      <Text style={[styles.kpiValue, accent && styles.kpiValueAccent]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

// ─── StatusPill ──────────────────────────────────────────────────────────────
export function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    en_cours: { bg: COLORS.successBg, text: COLORS.success, label: 'En cours' },
    a_venir:  { bg: COLORS.warningBg, text: COLORS.warning, label: 'À venir'  },
    passee:   { bg: COLORS.neutralBg, text: COLORS.muted,   label: 'Passée'   },
  };
  const c = cfg[status] || cfg.passee;
  return (
    <View style={[styles.statusPill, { backgroundColor: c.bg }]}>
      {status === 'en_cours' && <View style={styles.statusDot} />}
      <Text style={[styles.statusPillText, { color: c.text }]}>{c.label}</Text>
    </View>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────
export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  // Avatar
  avatar: { overflow: 'hidden', shadowColor: COLORS.accent, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  avatarGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', letterSpacing: 0.5 },

  // Live
  liveWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.liveBg, borderColor: COLORS.dangerBorder, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.live },
  liveText: { color: COLORS.live, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  liveCountdownWrap: { backgroundColor: 'rgba(255,107,107,0.2)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  liveCountdown: { color: COLORS.live, fontSize: 11, fontWeight: '700' },

  // Pill
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  pillText: { fontSize: 12, fontWeight: '800' },

  // TypeBadge
  typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  typeBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  // PlotBadge
  plotBadge: { width: 26, height: 26, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  plotText: { fontSize: 11, fontWeight: '900' },

  // RankBadge
  rankBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4, alignSelf: 'flex-start' },
  rankText: { fontSize: 11, fontWeight: '800' },

  // TrendBadge
  trendWrap: { gap: 2 },
  trendLabel: { fontSize: 12, fontWeight: '800' },
  trendDetail: { fontSize: 11, color: COLORS.muted },

  dim: { color: COLORS.subtle, fontSize: 12 },

  // SectionCard
  sectionCard: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  
  // GlassCard
  glassCard: { backgroundColor: 'rgba(13,32,53,0.8)', borderRadius: 16, borderWidth: 1, borderColor: COLORS.borderLight, overflow: 'hidden', backdropFilter: 'blur(10px)' },

  // SectionHeader
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sectionHeaderAccent: { width: 3, height: 18, backgroundColor: COLORS.accent, borderRadius: 2 },
  sectionHeaderTitle: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  sectionHeaderSub: { color: COLORS.muted, fontSize: 11, marginTop: 1 },

  // KpiCard
  kpiCard: { flexGrow: 1, minWidth: 72, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center', gap: 4 },
  kpiCardAccent: { borderColor: COLORS.accentGlow, backgroundColor: COLORS.accentDim },
  kpiValue: { color: COLORS.primaryLight, fontSize: 20, fontWeight: '900' },
  kpiValueAccent: { color: COLORS.accent },
  kpiLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  // StatusPill
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  statusPillText: { fontSize: 11, fontWeight: '800' },

  // Divider
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 14 },
});
