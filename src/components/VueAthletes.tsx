import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { CompetRow } from '../utils/types';
import { parseRangGeneral, ptsNum } from '../utils/helpers';
import { COLORS } from '../utils/constants';
import { Avatar, MedalBadge, NagePill, TempsDisplay, PtsBadge, ProgBadge, TempsRef } from './Atoms';

interface Props { rows: CompetRow[]; }

export default function VueAthletes({ rows }: Props) {
  // Grouper par athlète
  const byAth: Record<string, CompetRow[]> = {};
  rows.forEach(r => { (byAth[r.athlete] ??= []).push(r); });

  const list = Object.entries(byAth).sort(([, a], [, b]) =>
    b.reduce((s, r) => s + ptsNum(r.points), 0) -
    a.reduce((s, r) => s + ptsNum(r.points), 0)
  );

  const renderItem = ({ item: [ath, perfs] }: { item: [string, CompetRow[]] }) => {
    const totalPts  = perfs.reduce((s, r) => s + ptsNum(r.points), 0);
    const bestRang  = perfs.reduce<number | null>((b, r) => {
      const p = parseRangGeneral(r.rang_general).pos;
      return p && (!b || p < b) ? p : b;
    }, null);
    const podium    = bestRang !== null && bestRang <= 3;
    const enAttente = perfs.filter(r => !r.temps_result).length;
    const nbBetter  = perfs.filter(r => r.tendance === 'better').length;
    const nbWorse   = perfs.filter(r => r.tendance === 'worse').length;

    return (
      <View style={[styles.card, podium && styles.cardPodium]}>
        {/* Header athlète */}
        <View style={[styles.cardHeader, podium && styles.cardHeaderPodium]}>
          <Avatar name={ath} size={44} />
          <View style={styles.headerInfo}>
            <Text style={styles.athName}>{ath} {podium ? '🏆' : ''}</Text>
            <Text style={styles.athMeta}>
              {perfs[0]?.naissance ? `né(e) ${perfs[0].naissance}` : ''}
              {' · '}{perfs.length} épreuve{perfs.length > 1 ? 's' : ''}
              {enAttente > 0 ? ` · ${enAttente} en attente` : ''}
            </Text>
            {/* Résumé progression */}
            {(nbBetter > 0 || nbWorse > 0) && (
              <View style={styles.progSummary}>
                {nbBetter > 0 && (
                  <Text style={styles.progSummaryBetter}>▼ {nbBetter} PR</Text>
                )}
                {nbWorse > 0 && (
                  <Text style={styles.progSummaryWorse}>▲ {nbWorse} régr.</Text>
                )}
              </View>
            )}
          </View>
          <View style={styles.headerKpis}>
            {totalPts > 0 && (
              <View style={styles.kpi}>
                <Text style={styles.kpiVal}>{totalPts}</Text>
                <Text style={styles.kpiLbl}>pts</Text>
              </View>
            )}
            {bestRang && (
              <View style={styles.kpi}>
                <MedalBadge pos={bestRang} />
                <Text style={styles.kpiLbl}>meilleur</Text>
              </View>
            )}
          </View>
        </View>

        {/* Ligne par épreuve */}
        <View style={styles.perfsWrap}>
          {perfs.map((r, i) => {
            const { pos, total } = parseRangGeneral(r.rang_general);
            const isPod = pos !== null && pos <= 3;
            return (
              <View key={i} style={[styles.perfRow, isPod && styles.perfRowPodium]}>
                <NagePill ep={r.epreuve} />
                {r.type_serie ? <Text style={styles.serie}>{r.type_serie}</Text> : null}

                {/* Temps réf → temps réalisé */}
                <View style={styles.tempsWrap}>
                  {r.temps_ref ? (
                    <Text style={styles.tempsRefSmall}>{r.temps_ref}</Text>
                  ) : null}
                  <TempsDisplay temps={r.temps_result} />
                </View>

                <View style={styles.perfRight}>
                  {/* Indicateur progression */}
                  <ProgBadge tendance={r.tendance} delta_sec={r.delta_sec} />
                  {pos !== null && (
                    <View style={styles.rangWrap}>
                      <MedalBadge pos={pos} />
                      {total ? <Text style={styles.total}>/{total}</Text> : null}
                    </View>
                  )}
                  <PtsBadge pts={r.points} />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={list}
      keyExtractor={([ath]) => ath}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 14, paddingBottom: 40, gap: 10 },
  card: {
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.border, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  cardPodium: { borderColor: '#fbbf24', shadowOpacity: 0.15, shadowRadius: 10 },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 13, backgroundColor: '#f8fafc',
    borderBottomWidth: 1, borderBottomColor: COLORS.border, flexWrap: 'wrap',
  },
  cardHeaderPodium: { backgroundColor: '#fffbeb' },
  headerInfo: { flex: 1, minWidth: 140 },
  athName: { fontWeight: '900', fontSize: 15, color: COLORS.navy },
  athMeta: { fontSize: 11.5, color: COLORS.subtle, marginTop: 2 },
  progSummary: { flexDirection: 'row', gap: 8, marginTop: 4 },
  progSummaryBetter: { fontSize: 11, fontWeight: '800', color: '#16a34a' },
  progSummaryWorse:  { fontSize: 11, fontWeight: '800', color: '#dc2626' },
  headerKpis: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  kpi: { alignItems: 'center', gap: 2 },
  kpiVal: { fontSize: 18, fontWeight: '900', color: COLORS.primaryLight },
  kpiLbl: { fontSize: 9, color: COLORS.subtle, fontWeight: '700', textTransform: 'uppercase' },
  perfsWrap: { padding: 10, paddingHorizontal: 13, gap: 7 },
  perfRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 8, borderRadius: 9, backgroundColor: '#f8fafc',
    borderWidth: 1.5, borderColor: '#f1f5f9', flexWrap: 'wrap',
  },
  perfRowPodium: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  serie: { fontSize: 10.5, color: COLORS.subtle, fontStyle: 'italic' },
  tempsWrap: { flexDirection: 'column', gap: 1 },
  tempsRefSmall: { fontFamily: 'Courier', fontSize: 10.5, color: COLORS.subtle },
  perfRight: { marginLeft: 'auto', flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  rangWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  total: { fontSize: 10, color: COLORS.subtle },
});
