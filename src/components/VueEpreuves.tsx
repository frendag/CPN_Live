import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { CompetRow } from '../utils/types';
import { parseRangGeneral, getNageColors } from '../utils/helpers';
import { COLORS } from '../utils/constants';
import { Avatar, MedalBadge, NagePill, TempsDisplay, PtsBadge, ProgBadge, SerieBadge, PlotBadge, HeureBadge } from './Atoms';

interface Props { rows: CompetRow[]; }

export default function VueEpreuves({ rows }: Props) {
  const [open, setOpen] = useState<string | null>(null);

  const byEp: Record<string, CompetRow[]> = {};
  rows.forEach(r => { (byEp[r.epreuve] ??= []).push(r); });

  const list = Object.entries(byEp).sort(([, a], [, b]) => {
    const bA = Math.min(...a.map(r => parseRangGeneral(r.rang_general).pos ?? 999));
    const bB = Math.min(...b.map(r => parseRangGeneral(r.rang_general).pos ?? 999));
    return bA - bB;
  });

  const renderItem = ({ item: [ep, aths] }: { item: [string, CompetRow[]] }) => {
    const c      = getNageColors(ep);
    const isOpen = open === ep;
    const pod    = aths.some(r => (parseRangGeneral(r.rang_general).pos ?? 999) <= 3);
    const sorted = [...aths].sort((a, b) =>
      (parseRangGeneral(a.rang_general).pos ?? 999) - (parseRangGeneral(b.rang_general).pos ?? 999));

    // Heure de l'épreuve (première heure trouvée)
    const heure = aths.find(r => r.heure_passage)?.heure_passage || '';

    return (
      <Pressable
        onPress={() => setOpen(isOpen ? null : ep)}
        style={[styles.card, isOpen && { borderColor: c.border }]}
      >
        {/* Header card */}
        <View style={[styles.cardHead, { backgroundColor: c.bg + '60' }]}>
          <View style={styles.headRow}>
            <View style={styles.headLeft}>
              <NagePill ep={ep} />
              {heure ? <HeureBadge heure={heure} /> : null}
              {pod && (
                <View style={styles.podBadge}>
                  <Text style={styles.podBadgeText}>🏆 Podium</Text>
                </View>
              )}
            </View>
            <Text style={[styles.chevron, isOpen && { transform: [{ rotate: '180deg' }] }]}>▼</Text>
          </View>

          {/* Résumé nageurs */}
          <View style={styles.nageurRow}>
            {aths.map(r => (
              <View key={r.athlete} style={styles.nageurChip}>
                <Avatar name={r.athlete} size={24} />
                <View>
                  <Text style={styles.nageurNom}>{r.athlete.split(' ')[0]}</Text>
                  <TempsDisplay temps={r.temps_result} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Détail dépliable */}
        {isOpen && (
          <View style={styles.detail}>
            {sorted.map((r, i) => {
              const { pos, total } = parseRangGeneral(r.rang_general);
              return (
                <View key={i} style={[styles.detailRow, i % 2 === 0 && styles.detailRowAlt]}>
                  {/* Athlète */}
                  <View style={styles.detailAth}>
                    <Avatar name={r.athlete} size={22} />
                    <Text style={styles.detailName} numberOfLines={1}>{r.athlete}</Text>
                  </View>

                  {/* Programme */}
                  <View style={styles.detailProg}>
                    <SerieBadge serie={r.serie} />
                    <PlotBadge plot={r.plot} />
                  </View>

                  {/* Tps Réf */}
                  <View style={styles.detailRef}>
                    {r.temps_ref
                      ? <Text style={styles.tempsRefText}>{r.temps_ref}</Text>
                      : <Text style={styles.dash}>—</Text>}
                  </View>

                  {/* Temps réalisé */}
                  <View style={styles.detailTemps}>
                    <TempsDisplay temps={r.temps_result} />
                  </View>

                  {/* Progression */}
                  <View style={styles.detailProg2}>
                    <ProgBadge tendance={r.tendance} delta_sec={r.delta_sec} />
                  </View>

                  {/* Rang + pts */}
                  <View style={styles.detailRang}>
                    <MedalBadge pos={pos} />
                    {total ? <Text style={styles.total}>/{total}</Text> : null}
                    <PtsBadge pts={r.points} />
                  </View>
                </View>
              );
            })}
            {aths[0]?.date && (
              <Text style={styles.dateText}>📅 {aths[0].date}{aths[0].type_serie ? ` · ${aths[0].type_serie}` : ''}</Text>
            )}
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <FlatList
      data={list}
      keyExtractor={([ep]) => ep}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 14, paddingBottom: 40, gap: 10 },
  card: {
    backgroundColor: COLORS.card, borderRadius: 12,
    borderWidth: 2, borderColor: COLORS.border, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  cardHead: { padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border + '80' },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  chevron: { fontSize: 12, color: COLORS.subtle },
  podBadge: { backgroundColor: '#fef9c3', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  podBadgeText: { fontSize: 11, fontWeight: '800', color: '#b45309' },
  nageurRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  nageurChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nageurNom: { fontSize: 11, fontWeight: '700', color: COLORS.muted, lineHeight: 14 },
  detail: { padding: 12, gap: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, gap: 6, flexWrap: 'wrap' },
  detailRowAlt: { backgroundColor: '#f8fafc', borderRadius: 6, paddingHorizontal: 6 },
  detailAth: { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 110 },
  detailName: { fontSize: 12.5, fontWeight: '700', color: COLORS.navy, flex: 1 },
  detailProg: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  detailRef: { minWidth: 62 },
  detailTemps: { minWidth: 72 },
  detailProg2: { minWidth: 70 },
  detailRang: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  tempsRefText: { fontFamily: 'Courier', fontSize: 12, color: COLORS.subtle },
  dash: { color: '#cbd5e1', fontSize: 13 },
  total: { fontSize: 10, color: COLORS.subtle, marginLeft: 2 },
  dateText: { fontSize: 10.5, color: COLORS.subtle, marginTop: 8, textAlign: 'right' },
});
