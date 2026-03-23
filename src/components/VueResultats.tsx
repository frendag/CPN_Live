import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../utils/constants';
import { buildSeriesReference, formatReunionLabel, getTrendMeta, groupByAthlete, resultDisplayHour, sortResultRows } from '../utils/helpers';
import { ResultRow } from '../utils/types';
import { Avatar, NagePill, RankBadge, TrendBadge, TypeBadge } from './Atoms';

interface Props {
  rows: ResultRow[];
  reunionsCount: number;
}

function ResultCard({ ath, reunionsCount, index }: { ath: any; reunionsCount: number; index: number }) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideIn = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const delay = index * 60;
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.timing(slideIn, { toValue: 0, duration: 350, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const seriesRefMap = buildSeriesReference(ath.lignes);

  return (
    <Animated.View style={[styles.card, { opacity: fadeIn, transform: [{ translateY: slideIn }] }]}>
      {/* Athlete header */}
      <View style={styles.athHeader}>
        <Avatar name={ath.athlete_nom} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={styles.athName}>{ath.athlete_nom}</Text>
          <Text style={styles.athMeta}>{[ath.annee_naiss, ath.sexe].filter(Boolean).join(' · ') || 'Résultats'}</Text>
        </View>
        <View style={styles.resultCountBadge}>
          <Text style={styles.resultCountText}>{ath.lignes.length}</Text>
          <Text style={styles.resultCountLabel}>résultat{ath.lignes.length > 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Result rows */}
      {ath.lignes.map((line: ResultRow, idx: number) => {
        const trend = getTrendMeta(line, seriesRefMap);
        const isBetter = trend.tone === 'better';
        const isWorse = trend.tone === 'worse';
        return (
          <View key={`${ath.athlete_nom}-${idx}`} style={[styles.resultRow, idx > 0 && styles.rowDivider]}>
            {/* Left accent bar */}
            <View style={[styles.accentBar, isBetter && styles.accentBarBetter, isWorse && styles.accentBarWorse]} />

            <View style={styles.resultContent}>
              {/* Event + time */}
              <View style={styles.topLine}>
                <View style={styles.eventPills}>
                  <NagePill label={(line.epreuve_norm || line.epreuve_label || '').replace(/\s+\d+\s+sé?rie.*$/i, '').trim()} />
                  <TypeBadge typeSerie={line.type_serie} />
                </View>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeVal}>{line.temps_result || '—'}</Text>
                  <Text style={styles.timeHour}>{resultDisplayHour(line)}</Text>
                </View>
              </View>

              {/* Reunion info if multiple */}
              {reunionsCount > 1 ? (
                <Text style={styles.reunionInfo}>R{line.reunion_num} · {formatReunionLabel(line.reunion_label)}</Text>
              ) : null}

              {/* Meta grid */}
              <View style={styles.metaGrid}>
                <View style={styles.metaBox}>
                  <Text style={styles.metaLabel}>TENDANCE</Text>
                  <TrendBadge meta={trend} />
                </View>
                <View style={styles.metaBox}>
                  <Text style={styles.metaLabel}>POINTS</Text>
                  <Text style={styles.metaVal}>{line.points || '—'}</Text>
                </View>
                <View style={styles.metaBox}>
                  <Text style={styles.metaLabel}>RANG</Text>
                  <RankBadge pos={line.rang_pos} total={line.rang_total} fallback={line.rang_general} />
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </Animated.View>
  );
}

export default function VueResultats({ rows, reunionsCount }: Props) {
  if (!rows.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>⚡</Text>
        <Text style={styles.emptyTitle}>Aucun résultat disponible</Text>
        <Text style={styles.emptySub}>Les résultats apparaîtront ici dès qu'ils seront remontés.</Text>
      </View>
    );
  }

  const athletes = groupByAthlete(rows).map(g => ({ ...g, lignes: sortResultRows(g.lignes) }));

  return (
    <View style={styles.wrap}>
      {athletes.map((ath, idx) => (
        <ResultCard
          key={`${ath.athlete_nom}-${ath.annee_naiss}`}
          ath={ath}
          reunionsCount={reunionsCount}
          index={idx}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, paddingBottom: 32 },

  card: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },

  athHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: COLORS.surfaceHigh, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  athName: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  athMeta: { color: COLORS.muted, fontSize: 11, marginTop: 1 },
  resultCountBadge: { alignItems: 'center', backgroundColor: COLORS.accentDim, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  resultCountText: { color: COLORS.accent, fontSize: 16, fontWeight: '900' },
  resultCountLabel: { color: COLORS.accent, fontSize: 9, fontWeight: '700', opacity: 0.8 },

  resultRow: { flexDirection: 'row' },
  rowDivider: { borderTopWidth: 1, borderTopColor: COLORS.border },
  accentBar: { width: 3, backgroundColor: COLORS.border },
  accentBarBetter: { backgroundColor: COLORS.success },
  accentBarWorse: { backgroundColor: COLORS.danger },
  resultContent: { flex: 1, padding: 12, gap: 8 },

  topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  eventPills: { flex: 1, flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  timeBlock: { alignItems: 'flex-end' },
  timeVal: { color: COLORS.text, fontSize: 16, fontWeight: '900', fontVariant: ['tabular-nums'] },
  timeHour: { color: COLORS.muted, fontSize: 10, marginTop: 2 },

  reunionInfo: { color: COLORS.muted, fontSize: 11 },

  metaGrid: { flexDirection: 'row', gap: 16 },
  metaBox: { gap: 3 },
  metaLabel: { color: COLORS.subtle, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  metaVal: { color: COLORS.textMid, fontSize: 13, fontWeight: '700' },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  emptySub: { color: COLORS.muted, fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
