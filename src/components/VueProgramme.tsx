import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { CompetRow } from '../utils/types';
import { COLORS } from '../utils/constants';
import { Avatar, NagePill, SerieBadge, PlotBadge, HeureBadge, TempsRef } from './Atoms';

interface Props { rows: CompetRow[]; }

export default function VueProgramme({ rows }: Props) {
  // Trier par heure de passage, puis par athlète
  const sorted = [...rows].sort((a, b) => {
    const ha = (a.heure_passage || '99:99').replace('h', ':');
    const hb = (b.heure_passage || '99:99').replace('h', ':');
    return ha < hb ? -1 : ha > hb ? 1 : a.athlete.localeCompare(b.athlete);
  });

  // Grouper par heure pour les séparateurs de section
  const sections: Array<{ heure: string; items: CompetRow[] }> = [];
  for (const r of sorted) {
    const h = r.heure_passage || '';
    const last = sections[sections.length - 1];
    if (last && last.heure === h) {
      last.items.push(r);
    } else {
      sections.push({ heure: h, items: [r] });
    }
  }

  // Aplatir en items avec header d'heure
  type ListItem =
    | { type: 'header'; heure: string }
    | { type: 'row'; data: CompetRow; idx: number };

  const items: ListItem[] = [];
  sections.forEach(sec => {
    if (sec.heure) {
      items.push({ type: 'header', heure: sec.heure });
    }
    sec.items.forEach((r, i) => items.push({ type: 'row', data: r, idx: i }));
  });

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.timeHeader}>
          <Text style={styles.timeHeaderText}>⏰ {item.heure}</Text>
        </View>
      );
    }
    const r = item.data;
    const hasResult = !!r.temps_result;
    return (
      <View style={[styles.row, item.idx % 2 === 1 && styles.rowAlt]}>
        {/* Athlète */}
        <View style={styles.athCell}>
          <Avatar name={r.athlete} size={32} />
          <View style={styles.athInfo}>
            <Text style={styles.athName} numberOfLines={1}>{r.athlete}</Text>
            {r.naissance ? <Text style={styles.athSub}>né {r.naissance}</Text> : null}
          </View>
        </View>

        {/* Épreuve */}
        <View style={styles.epCell}>
          <NagePill ep={r.epreuve} />
        </View>

        {/* Tps Réf */}
        <View style={styles.refCell}>
          <Text style={styles.colLabel}>Réf.</Text>
          <TempsRef temps={r.temps_ref} />
        </View>

        {/* Série + Plot */}
        <View style={styles.progCell}>
          <View style={styles.seriePlotRow}>
            <SerieBadge serie={r.serie} />
            <PlotBadge plot={r.plot} />
          </View>
        </View>

        {/* Résultat si disponible */}
        {hasResult && (
          <View style={styles.resultCell}>
            <Text style={[
              styles.tempsResult,
              r.tendance === 'better' && { color: COLORS.success },
              r.tendance === 'worse'  && { color: COLORS.danger },
            ]}>
              {r.temps_result}
            </Text>
            {r.tendance === 'better' && <Text style={styles.progBetter}>▼</Text>}
            {r.tendance === 'worse'  && <Text style={styles.progWorse}>▲</Text>}
            {r.tendance === 'stable' && <Text style={styles.progStable}>→</Text>}
          </View>
        )}
      </View>
    );
  };

  if (!rows.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>Aucun programme disponible</Text>
        <Text style={styles.emptySub}>Les données de programme apparaîtront ici</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item, i) =>
        item.type === 'header' ? `h-${item.heure}-${i}` : `r-${item.data.athlete}-${item.data.epreuve}-${i}`
      }
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 40 },

  timeHeader: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 16, paddingVertical: 7,
    marginTop: 4,
  },
  timeHeaderText: {
    color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.3,
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 9,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    gap: 8, flexWrap: 'wrap',
  },
  rowAlt: { backgroundColor: '#f8fafc' },

  athCell: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 2, minWidth: 130 },
  athInfo: { flex: 1 },
  athName: { fontSize: 13, fontWeight: '800', color: COLORS.navy },
  athSub:  { fontSize: 10, color: COLORS.subtle },

  epCell:   { flex: 1.2, minWidth: 80 },
  refCell:  { flex: 1, minWidth: 70, alignItems: 'flex-start' },
  progCell: { flex: 1, minWidth: 80 },
  resultCell: { flex: 1, minWidth: 80, flexDirection: 'row', alignItems: 'center', gap: 4 },

  colLabel: { fontSize: 9, color: COLORS.subtle, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },

  seriePlotRow: { flexDirection: 'row', gap: 5, alignItems: 'center' },

  tempsResult: { fontFamily: 'Courier', fontSize: 14, fontWeight: '700', color: '#065f46' },
  progBetter: { color: '#16a34a', fontWeight: '900', fontSize: 14 },
  progWorse:  { color: '#dc2626', fontWeight: '900', fontSize: 14 },
  progStable: { color: '#64748b', fontWeight: '700', fontSize: 14 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 60 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.muted, textAlign: 'center' },
  emptySub: { fontSize: 13, color: COLORS.subtle, marginTop: 6, textAlign: 'center' },
});
