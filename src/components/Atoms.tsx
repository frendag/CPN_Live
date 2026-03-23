import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';
import { avatarColor, getNageColors, initials, plotColor, rankLabel, rankTone } from '../utils/helpers';
import { TrendMeta } from '../utils/types';

export function Avatar({ name, size = 38 }: { name: string; size?: number }) {
  const bg = avatarColor(name);
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}> 
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials(name)}</Text>
    </View>
  );
}

export function LiveBadge({ countdown }: { countdown?: number | null }) {
  return (
    <View style={styles.liveWrap}>
      <Text style={styles.liveText}>● LIVE</Text>
      {typeof countdown === 'number' && countdown >= 0 ? <Text style={styles.liveCountdown}>{countdown}s</Text> : null}
    </View>
  );
}

export function NagePill({ label }: { label: string }) {
  const colors = getNageColors(label);
  return (
    <View style={[styles.pill, { backgroundColor: colors.bg, borderColor: colors.border }]}> 
      <Text style={[styles.pillText, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

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

export function PlotBadge({ plot }: { plot?: number | string | null }) {
  if (!plot) return <Text style={styles.dim}>—</Text>;
  return (
    <View style={[styles.plotBadge, { backgroundColor: plotColor(plot) }]}> 
      <Text style={styles.plotText}>{plot}</Text>
    </View>
  );
}

export function RankBadge({ pos, total, fallback }: { pos?: number | null; total?: number | null; fallback?: string | null }) {
  const label = rankLabel(pos, total, fallback);
  if (label === '—') return <Text style={styles.dim}>—</Text>;
  const tone = rankTone(pos ?? (fallback ? parseInt(String(fallback), 10) : null));
  return (
    <View style={[styles.rankBadge, { backgroundColor: tone.bg }]}> 
      <Text style={[styles.rankText, { color: tone.text }]}>{label}</Text>
    </View>
  );
}

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

export function SectionCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.sectionCard}>{children}</View>;
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarText: { color: '#fff', fontWeight: '900' },
  liveWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.liveBg,
    borderColor: '#f9bec8',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveText: { color: COLORS.live, fontSize: 12, fontWeight: '900' },
  liveCountdown: { color: COLORS.live, fontSize: 12, fontWeight: '700' },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  pillText: { fontSize: 12, fontWeight: '800' },
  typeBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  typeBadgeText: { fontSize: 11, fontWeight: '800' },
  plotBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plotText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  rankBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  rankText: { fontSize: 11, fontWeight: '800' },
  trendWrap: { gap: 2 },
  trendLabel: { fontSize: 12, fontWeight: '800' },
  trendDetail: { fontSize: 11, color: COLORS.muted },
  dim: { color: COLORS.subtle, fontSize: 12 },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
});
