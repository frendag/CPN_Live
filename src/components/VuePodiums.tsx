import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { CompetRow } from '../utils/types';
import { parseRangGeneral, isAbsence, getNageColors } from '../utils/helpers';
import { COLORS, MEDAL_CONFIG } from '../utils/constants';
import { Avatar, NagePill, PtsBadge } from './Atoms';

interface Props { rows: CompetRow[]; }

const MEDAL_CARD: Record<number, { bg: string; border: string }> = {
  1: { bg: '#fffbeb', border: '#fbbf24' },
  2: { bg: '#f8fafc', border: '#cbd5e1' },
  3: { bg: '#fff7ed', border: '#fb923c' },
};

export default function VuePodiums({ rows }: Props) {
  const pods = rows
    .filter(r => {
      const p = parseRangGeneral(r.rang_general).pos;
      return p && p <= 3 && r.temps_result && !isAbsence(r.temps_result);
    })
    .sort((a, b) =>
      (parseRangGeneral(a.rang_general).pos ?? 9) -
      (parseRangGeneral(b.rang_general).pos ?? 9)
    );

  if (!pods.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🏊</Text>
        <Text style={styles.emptyTitle}>Aucun podium pour l'instant</Text>
        <Text style={styles.emptySub}>Les résultats apparaîtront ici en temps réel</Text>
      </View>
    );
  }

  const renderItem = ({ item: r }: { item: CompetRow }) => {
    const { pos, total } = parseRangGeneral(r.rang_general);
    const mc = MEDAL_CONFIG[pos!];
    const cc = MEDAL_CARD[pos!] ?? { bg: '#fff', border: COLORS.border };
    const em = pos === 1 ? '🥇' : pos === 2 ? '🥈' : '🥉';

    return (
      <View style={[styles.card, { backgroundColor: cc.bg, borderColor: cc.border }]}>
        <Text style={styles.medalEmoji}>{em}</Text>

        {/* Athlète */}
        <View style={styles.athRow}>
          <Avatar name={r.athlete} size={48} />
          <View style={styles.athInfo}>
            <Text style={styles.athName}>{r.athlete}</Text>
            {r.naissance && <Text style={styles.athMeta}>né(e) {r.naissance}</Text>}
          </View>
        </View>

        {/* Épreuve */}
        <View style={styles.epRow}>
          <NagePill ep={r.epreuve} />
          {r.type_serie && <Text style={styles.serie}>{r.type_serie}</Text>}
        </View>

        {/* Temps + rang + points */}
        <View style={styles.resultRow}>
          <View>
            <Text style={styles.temps}>{r.temps_result}</Text>
            {total && <Text style={styles.rangText}>{pos}e sur {total} nageurs</Text>}
          </View>
          <View style={styles.ptsWrap}>
            {r.points && (
              <>
                <Text style={styles.ptsVal}>{r.points.replace(' pts', '')}</Text>
                <Text style={styles.ptsLbl}>pts FFN</Text>
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={pods}
      keyExtractor={(r, i) => `${r.athlete}-${r.epreuve}-${i}`}
      renderItem={renderItem}
      numColumns={1}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 14, paddingBottom: 40, gap: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.muted },
  emptySub: { fontSize: 13, color: COLORS.subtle, marginTop: 6, textAlign: 'center' },

  card: {
    borderRadius: 16, borderWidth: 2, padding: 18,
    gap: 12, position: 'relative',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  medalEmoji: { position: 'absolute', top: 12, right: 14, fontSize: 26 },

  athRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  athInfo: { flex: 1 },
  athName: { fontWeight: '900', fontSize: 16, color: COLORS.navy, lineHeight: 20 },
  athMeta: { fontSize: 11, color: COLORS.subtle, marginTop: 2 },

  epRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  serie: { fontSize: 11, color: COLORS.subtle, fontStyle: 'italic' },

  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  temps: { fontFamily: 'Courier', fontWeight: '700', fontSize: 24, color: '#065f46', letterSpacing: 0.5 },
  rangText: { fontSize: 11, color: COLORS.subtle, marginTop: 3 },
  ptsWrap: { alignItems: 'flex-end' },
  ptsVal: { fontSize: 22, fontWeight: '900', color: COLORS.primaryLight },
  ptsLbl: { fontSize: 9, color: COLORS.subtle, fontWeight: '700', textTransform: 'uppercase' },
});
