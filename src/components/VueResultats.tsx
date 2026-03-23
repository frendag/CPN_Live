import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../utils/constants';
import { buildSeriesReference, formatReunionLabel, getTrendMeta, groupByAthlete, resultDisplayHour, sortResultRows } from '../utils/helpers';
import { ResultRow } from '../utils/types';
import { Avatar, NagePill, RankBadge, SectionCard, TrendBadge, TypeBadge } from './Atoms';

interface Props {
  rows: ResultRow[];
  reunionsCount: number;
}

export default function VueResultats({ rows, reunionsCount }: Props) {
  if (!rows.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>⚡</Text>
        <Text style={styles.emptyTitle}>Aucun résultat disponible</Text>
        <Text style={styles.emptySub}>Les résultats apparaîtront ici dès qu’ils seront remontés dans la base.</Text>
      </View>
    );
  }

  const athletes = groupByAthlete(rows).map((group) => ({
    ...group,
    lignes: sortResultRows(group.lignes),
  }));

  return (
    <View style={styles.wrap}>
      {athletes.map((ath) => {
        const seriesRefMap = buildSeriesReference(ath.lignes);
        return (
          <SectionCard key={`${ath.athlete_nom}-${ath.annee_naiss}`}>
            <View style={styles.athHeader}>
              <View style={styles.athIdentity}>
                <Avatar name={ath.athlete_nom} size={42} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.athName}>{ath.athlete_nom}</Text>
                  <Text style={styles.athMeta}>{[ath.annee_naiss, ath.sexe].filter(Boolean).join(' · ') || 'Résultats'}</Text>
                </View>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{ath.lignes.length} résultat{ath.lignes.length > 1 ? 's' : ''}</Text>
              </View>
            </View>

            {ath.lignes.map((line, idx) => {
              const trend = getTrendMeta(line, seriesRefMap);
              return (
                <View key={`${ath.athlete_nom}-${idx}-${line.epreuve_label}-${line.type_serie}`} style={[styles.row, idx > 0 && styles.rowDivider]}>
                  <View style={styles.topLine}>
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={styles.eventLine}>
                        <NagePill label={(line.epreuve_norm || line.epreuve_label || '').replace(/\s+\d+\s+s[ée]rie.*$/i, '').trim()} />
                        <TypeBadge typeSerie={line.type_serie} />
                      </View>
                      {reunionsCount > 1 ? (
                        <Text style={styles.reunionInfo}>Réunion {line.reunion_num} · {formatReunionLabel(line.reunion_label)}</Text>
                      ) : null}
                    </View>
                    <View style={styles.timeWrap}>
                      <Text style={styles.timeValue}>{line.temps_result || '—'}</Text>
                      <Text style={styles.timeLabel}>{resultDisplayHour(line)}</Text>
                    </View>
                  </View>

                  <View style={styles.metaGrid}>
                    <View style={styles.metaBox}>
                      <Text style={styles.metaLabel}>Tendance</Text>
                      <TrendBadge meta={trend} />
                    </View>
                    <View style={styles.metaBox}>
                      <Text style={styles.metaLabel}>Points</Text>
                      <Text style={styles.metaValue}>{line.points || '—'}</Text>
                    </View>
                    <View style={styles.metaBox}>
                      <Text style={styles.metaLabel}>Rang</Text>
                      <RankBadge pos={line.rang_pos} total={line.rang_total} fallback={line.rang_general} />
                    </View>
                  </View>
                </View>
              );
            })}
          </SectionCard>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, paddingBottom: 28 },
  athHeader: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: '#fbfdff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  athIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  athName: { color: COLORS.text, fontSize: 15, fontWeight: '900' },
  athMeta: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  countBadge: { backgroundColor: '#eef4fb', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  countBadgeText: { color: COLORS.primarySoft, fontSize: 11, fontWeight: '800' },
  row: { paddingHorizontal: 12, paddingVertical: 12, gap: 10 },
  rowDivider: { borderTopWidth: 1, borderTopColor: COLORS.border },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  eventLine: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  reunionInfo: { color: COLORS.muted, fontSize: 12 },
  timeWrap: { alignItems: 'flex-end', minWidth: 82 },
  timeValue: { color: '#155e33', fontSize: 16, fontWeight: '900', fontFamily: 'monospace' },
  timeLabel: { color: COLORS.subtle, fontSize: 11, marginTop: 3 },
  metaGrid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metaBox: { minWidth: 92, flex: 1, gap: 4 },
  metaLabel: { color: COLORS.subtle, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  metaValue: { color: COLORS.primaryLight, fontSize: 13, fontWeight: '800' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 50 },
  emptyIcon: { fontSize: 42, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  emptySub: { fontSize: 13, color: COLORS.muted, textAlign: 'center', marginTop: 6 },
});
