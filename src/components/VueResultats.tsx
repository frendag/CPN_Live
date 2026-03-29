import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../utils/constants';
import { buildSeriesReference, formatReunionLabel, getTrendMeta, groupByAthlete, resultDisplayHour, sortResultRows } from '../utils/helpers';
import { ResultRow } from '../utils/types';
import { Avatar, NagePill, RankBadge, TrendBadge, TypeBadge } from './Atoms';

// ── Niveaux qualification ─────────────────────────────────────────────────────
const NIV_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'CF':       { bg: 'rgba(255,107,107,0.18)', text: '#ff6b6b',  border: 'rgba(255,107,107,0.5)' },
  'CN':       { bg: 'rgba(255,167,72,0.18)',  text: '#ffa748',  border: 'rgba(255,167,72,0.5)'  },
  'MN':       { bg: 'rgba(255,209,102,0.18)', text: '#ffd166',  border: 'rgba(255,209,102,0.5)' },
  'Web':      { bg: 'rgba(0,201,167,0.15)',   text: '#00c9a7',  border: 'rgba(0,201,167,0.4)'   },
  'Régional': { bg: 'rgba(90,180,232,0.15)',  text: '#5ab4e8',  border: 'rgba(90,180,232,0.4)'  },
};

function QualifBadge({ niveau }: { niveau: string }) {
  const col = NIV_COLORS[niveau] || NIV_COLORS['Régional'];
  return (
    <View style={[qb.wrap, { backgroundColor: col.bg, borderColor: col.border }]}>
      <Text style={[qb.text, { color: col.text }]}>✅ {niveau}</Text>
    </View>
  );
}
function NextNivBadge({ niveau, deltaPct }: { niveau: string; deltaPct: number }) {
  const col = NIV_COLORS[niveau] || NIV_COLORS['Régional'];
  const sign = deltaPct > 0 ? '+' : '';
  return (
    <View style={[qb.wrap, qb.nextWrap, { borderColor: col.border }]}>
      <Text style={[qb.text, { color: col.text, opacity: 0.85 }]}>
        {niveau} {sign}{deltaPct.toFixed(1)}%
      </Text>
    </View>
  );
}
const qb = StyleSheet.create({
  wrap:     { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  nextWrap: { backgroundColor: 'transparent', borderStyle: 'dashed' },
  text:     { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
});

interface Props {
  rows: ResultRow[];
  reunionsCount: number;
}

function ResultCard({ ath, reunionsCount, index }: { ath: any; reunionsCount: number; index: number }) {
  const fadeIn  = useRef(new Animated.Value(0)).current;
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
        const trend    = getTrendMeta(line, seriesRefMap);
        const isBetter = trend.tone === 'better';
        const isWorse  = trend.tone === 'worse';
        const hasQualif = line.niveau_atteint || line.niveau_superieur;

        return (
          <View key={`${ath.athlete_nom}-${idx}`} style={[styles.resultRow, idx > 0 && styles.rowDivider]}>
            {/* Left accent bar */}
            <View style={[
              styles.accentBar,
              isBetter && styles.accentBarBetter,
              isWorse  && styles.accentBarWorse,
              line.niveau_atteint && styles.accentBarQualif,
            ]} />

            <View style={styles.resultContent}>
              {/* Event + time */}
              <View style={styles.topLine}>
                <View style={styles.eventPills}>
                  <NagePill label={(line.epreuve_norm || line.epreuve_label || '').replace(/\s+\d+\s+sé?rie.*$/i, '').trim()} />
                  <TypeBadge typeSerie={line.type_serie} />
                </View>
                <View style={styles.timeBlock}>
                  <Text style={[styles.timeVal, line.niveau_atteint && styles.timeValQualif]}>
                    {line.temps_result || '—'}
                  </Text>
                  <Text style={styles.timeHour}>{resultDisplayHour(line)}</Text>
                </View>
              </View>

              {/* Reunion info si plusieurs */}
              {reunionsCount > 1 && (
                <Text style={styles.reunionInfo}>R{line.reunion_num} · {formatReunionLabel(line.reunion_label)}</Text>
              )}

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

              {/* Qualification — toujours affiché si données dispo */}
              {hasQualif && (
                <View style={styles.qualifRow}>
                  <Text style={styles.qualifLabel}>QUALIFICATION</Text>
                  <View style={styles.qualifBadges}>
                    {line.niveau_atteint && (
                      <QualifBadge niveau={line.niveau_atteint} />
                    )}
                    {line.niveau_superieur && line.next_delta_pct !== null && line.next_delta_pct !== undefined && (
                      <NextNivBadge
                        niveau={line.niveau_superieur}
                        deltaPct={line.next_delta_pct}
                      />
                    )}
                  </View>
                  {line.niveau_superieur && line.next_temps && (
                    <Text style={styles.qualifSeuil}>
                      Seuil {line.niveau_superieur} : {line.next_temps}
                    </Text>
                  )}
                </View>
              )}
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
  athName:   { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  athMeta:   { color: COLORS.muted, fontSize: 11, marginTop: 1 },
  resultCountBadge: { alignItems: 'center', backgroundColor: COLORS.accentDim, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  resultCountText:  { color: COLORS.accent, fontSize: 16, fontWeight: '900' },
  resultCountLabel: { color: COLORS.accent, fontSize: 9, fontWeight: '700', opacity: 0.8 },

  resultRow:       { flexDirection: 'row' },
  rowDivider:      { borderTopWidth: 1, borderTopColor: COLORS.border },
  accentBar:       { width: 3, backgroundColor: COLORS.border },
  accentBarBetter: { backgroundColor: COLORS.success },
  accentBarWorse:  { backgroundColor: COLORS.danger },
  accentBarQualif: { backgroundColor: '#ffd166' },

  resultContent: { flex: 1, padding: 12, gap: 8 },

  topLine:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  eventPills: { flex: 1, flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  timeBlock:  { alignItems: 'flex-end' },
  timeVal:    { color: COLORS.text, fontSize: 16, fontWeight: '900', fontVariant: ['tabular-nums'] },
  timeValQualif: { color: '#ffd166' },
  timeHour:   { color: COLORS.muted, fontSize: 10, marginTop: 2 },

  reunionInfo: { color: COLORS.muted, fontSize: 11 },

  metaGrid:  { flexDirection: 'row', gap: 16 },
  metaBox:   { gap: 3 },
  metaLabel: { color: COLORS.subtle, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  metaVal:   { color: COLORS.textMid, fontSize: 13, fontWeight: '700' },

  // Qualification
  qualifRow:    { gap: 5, paddingTop: 6, borderTopWidth: 1, borderTopColor: COLORS.border },
  qualifLabel:  { color: COLORS.subtle, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  qualifBadges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  qualifSeuil:  { color: COLORS.muted, fontSize: 10, marginTop: 2 },

  empty:      { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon:  { fontSize: 40 },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  emptySub:   { color: COLORS.muted, fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
