import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { CompetRow } from '../utils/types';
import { parseRangGeneral, getNageColors } from '../utils/helpers';
import { COLORS } from '../utils/constants';
import { Avatar, MedalBadge, NagePill, TempsDisplay, PtsBadge } from './Atoms';

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
                  <Text style={styles.nageurNom}>
                    {r.athlete.split(' ')[0]}
                  </Text>
                  <TempsDisplay temps={r.temps_result} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Détail dépliable */}
        {isOpen && (
          <View style={styles.detail}>
            {/* Header colonnes */}
            <View style={styles.detailHeader}>
              {['Athlète', 'Temps', 'Rang', 'Points'].map(h => (
                <Text key={h} style={[styles.colHead, h === 'Athlète' && { flex: 2 }]}>{h}</Text>
              ))}
            </View>
            {sorted.map((r, i) => {
              const { pos, total } = parseRangGeneral(r.rang_general);
              return (
                <View key={i} style={[styles.detailRow, i % 2 === 0 && styles.detailRowAlt]}>
                  <View style={[styles.detailCol, { flex: 2, flexDirection: 'row', gap: 6, alignItems: 'center' }]}>
                    <Avatar name={r.athlete} size={22} />
                    <Text style={styles.detailName} numberOfLines={1}>{r.athlete}</Text>
                  </View>
                  <View style={styles.detailCol}>
                    <TempsDisplay temps={r.temps_result} />
                  </View>
                  <View style={styles.detailCol}>
                    <MedalBadge pos={pos} />
                    {total ? <Text style={styles.total}>/{total}</Text> : null}
                  </View>
                  <View style={styles.detailCol}>
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
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chevron: { fontSize: 12, color: COLORS.subtle },
  podBadge: { backgroundColor: '#fef9c3', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  podBadgeText: { fontSize: 11, fontWeight: '800', color: '#b45309' },
  nageurRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  nageurChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nageurNom: { fontSize: 11, fontWeight: '700', color: COLORS.muted, lineHeight: 14 },
  detail: { padding: 12 },
  detailHeader: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: COLORS.border, paddingBottom: 5, marginBottom: 4 },
  colHead: { flex: 1, fontSize: 10, fontWeight: '700', color: COLORS.subtle, textTransform: 'uppercase' },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  detailRowAlt: { backgroundColor: '#f8fafc', borderRadius: 6 },
  detailCol: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  detailName: { fontSize: 12.5, fontWeight: '700', color: COLORS.navy, flex: 1 },
  total: { fontSize: 10, color: COLORS.subtle, marginLeft: 2 },
  dateText: { fontSize: 10.5, color: COLORS.subtle, marginTop: 8, textAlign: 'right' },
});
