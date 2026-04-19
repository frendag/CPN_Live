import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../utils/constants';
import { PassageRow, PassageStatut } from '../utils/types';

const STATUT_CONFIG: Record<PassageStatut, { dot: string; bg: string }> = {
  nage:     { dot: '#43A047', bg: 'rgba(67,160,71,0.10)'  },
  en_cours: { dot: '#FB8C00', bg: 'rgba(251,140,0,0.10)'  },
  a_venir:  { dot: '#546E7A', bg: 'transparent'            },
};

interface Props {
  passages: PassageRow[];
}

export default function VuePassage({ passages }: Props) {
  if (!passages.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Aucun passage disponible.</Text>
      </View>
    );
  }

  let lastReunion = '';

  return (
    <View style={styles.container}>
      {passages.map((p, idx) => {
        const cfg = STATUT_CONFIG[p.statut] || STATUT_CONFIG.a_venir;
        const reunionKey = `R${p.reunion_num} — ${p.reunion_label || ''} ${p.reunion_moment || ''}`.trim();
        const showHeader = reunionKey !== lastReunion;
        if (showHeader) lastReunion = reunionKey;

        const nage = p.epreuve_norm || p.epreuve_label || '';
        const plot = p.plot ? `Plot ${p.plot}` : '';
        const detail = [nage, plot].filter(Boolean).join(' · ');

        return (
          <View key={`${idx}-${p.athlete_nom}-${p.epreuve_label}`}>
            {showHeader && (
              <View style={styles.reunionHeader}>
                <Text style={styles.reunionLabel}>{reunionKey}</Text>
              </View>
            )}
            <View style={[styles.item, { backgroundColor: cfg.bg }]}>
              <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
              <Text style={styles.heure}>{p.heure_depart || '—'}</Text>
              <View style={styles.info}>
                <Text style={styles.nom} numberOfLines={1}>{p.athlete_nom}</Text>
                <Text style={styles.detail} numberOfLines={1}>{detail}</Text>
              </View>
              {p.temps_result ? (
                <View style={styles.resultWrap}>
                  <Text style={styles.result}>{p.temps_result}</Text>
                  {p.points ? <Text style={styles.points}>{p.points}</Text> : null}
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { paddingBottom: 24 },
  empty:         { padding: 40, alignItems: 'center' },
  emptyText:     { color: COLORS.muted, fontSize: 14 },
  reunionHeader: { paddingHorizontal: 16, paddingVertical: 6, backgroundColor: COLORS.primaryMid, marginTop: 8 },
  reunionLabel:  { color: COLORS.accent, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  item:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 10 },
  dot:           { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  heure:         { fontSize: 12, color: COLORS.muted, minWidth: 48 },
  info:          { flex: 1 },
  nom:           { fontSize: 14, fontWeight: '600', color: COLORS.text },
  detail:        { fontSize: 12, color: COLORS.textMid, marginTop: 1 },
  resultWrap:    { alignItems: 'flex-end' },
  result:        { fontSize: 13, fontWeight: '700', color: '#43A047' },
  points:        { fontSize: 11, color: COLORS.muted },
});
