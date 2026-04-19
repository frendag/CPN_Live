import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../utils/constants';
import { PassageRow, PassageStatut, TrendMeta } from '../utils/types';
import { NagePill, RankBadge, TrendBadge, TypeBadge } from './Atoms';

const NIV_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'CF':       { bg: 'rgba(255,107,107,0.18)', text: '#ff6b6b',  border: 'rgba(255,107,107,0.5)' },
  'CN':       { bg: 'rgba(255,167,72,0.18)',  text: '#ffa748',  border: 'rgba(255,167,72,0.5)'  },
  'MN':       { bg: 'rgba(255,209,102,0.18)', text: '#ffd166',  border: 'rgba(255,209,102,0.5)' },
  'Web':      { bg: 'rgba(0,201,167,0.15)',   text: '#00c9a7',  border: 'rgba(0,201,167,0.4)'   },
  'Régional': { bg: 'rgba(90,180,232,0.15)',  text: '#5ab4e8',  border: 'rgba(90,180,232,0.4)'  },
};

const STATUT_DOT: Record<PassageStatut, string> = {
  nage:     COLORS.success,
  en_cours: '#FB8C00',
  a_venir:  COLORS.subtle,
};

function tendanceMeta(tendance?: string | null): TrendMeta {
  switch (tendance) {
    case 'mieux':      return { tone: 'better',  label: 'Mieux' };
    case 'moins_bien': return { tone: 'worse',   label: 'Moins bien' };
    case 'stable':     return { tone: 'stable',  label: 'Stable' };
    case 'forfait':    return { tone: 'forfeit', label: 'Forfait' };
    default:           return { tone: 'none',    label: '—' };
  }
}

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

interface ReunionGroup {
  reunion_num: number;
  label: string;
  lignes: PassageRow[];
}

function ReunionCard({ group, index }: { group: ReunionGroup; index: number }) {
  const fadeIn  = useRef(new Animated.Value(0)).current;
  const slideIn = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const delay = index * 60;
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.timing(slideIn, { toValue: 0, duration: 350, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const nbNages   = group.lignes.filter(p => p.statut === 'nage').length;
  const nbEnCours = group.lignes.filter(p => p.statut === 'en_cours').length;
  const sub = nbNages
    ? `${nbNages} nagé${nbNages > 1 ? 's' : ''} · ${group.lignes.length - nbNages} restant${group.lignes.length - nbNages > 1 ? 's' : ''}`
    : `${group.lignes.length} passage${group.lignes.length > 1 ? 's' : ''}`;

  return (
    <Animated.View style={[styles.card, { opacity: fadeIn, transform: [{ translateY: slideIn }] }]}>
      {/* Réunion header */}
      <View style={styles.reunionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.reunionTitle}>🏁 {group.label}</Text>
          <Text style={styles.reunionSub}>{sub}</Text>
        </View>
        {nbEnCours > 0 && (
          <View style={styles.enCoursBadge}>
            <Text style={styles.enCoursText}>⏱ {nbEnCours} en cours</Text>
          </View>
        )}
      </View>

      {/* Passages */}
      {group.lignes.map((p, idx) => {
        const trend     = tendanceMeta(p.tendance);
        const isBetter  = trend.tone === 'better';
        const isWorse   = trend.tone === 'worse';
        const hasResult = !!p.temps_result;
        const hasQualif = p.niveau_atteint || p.niveau_superieur;
        const nage      = (p.epreuve_norm || p.epreuve_label || '').replace(/\s+\d+\s+sé?rie.*$/i, '').trim();
        const dotColor  = STATUT_DOT[p.statut];

        return (
          <View key={`${idx}-${p.athlete_nom}-${p.epreuve_label}`} style={[styles.passageRow, idx > 0 && styles.rowDivider]}>
            {/* Accent bar couleur statut/tendance */}
            <View style={[
              styles.accentBar,
              isBetter && styles.accentBarBetter,
              isWorse  && styles.accentBarWorse,
              p.niveau_atteint && styles.accentBarQualif,
              !hasResult && { backgroundColor: dotColor },
            ]} />

            <View style={styles.passageContent}>
              {/* Nom + heure + résultat */}
              <View style={styles.topLine}>
                <View style={styles.leftBlock}>
                  <View style={styles.nameRow}>
                    <View style={[styles.dot, { backgroundColor: dotColor }]} />
                    <Text style={styles.athleteName} numberOfLines={1}>{p.athlete_nom}</Text>
                  </View>
                  <Text style={styles.heureText}>{p.heure_depart || '—'}{p.plot ? ` · Plot ${p.plot}` : ''}</Text>
                </View>
                {hasResult && (
                  <View style={styles.timeBlock}>
                    <Text style={[styles.timeVal, p.niveau_atteint ? styles.timeValQualif : null]}>
                      {p.temps_result}
                    </Text>
                    {p.temps_ref ? <Text style={styles.timeHour}>Réf : {p.temps_ref}</Text> : null}
                  </View>
                )}
              </View>

              {/* Épreuve */}
              <View style={styles.eventPills}>
                <NagePill label={nage} />
                <TypeBadge typeSerie={p.type_serie || ''} />
              </View>

              {/* Temps ref si pas de résultat */}
              {!hasResult && p.temps_ref && (
                <Text style={styles.tempsRef}>Réf : {p.temps_ref}</Text>
              )}

              {/* Meta grid — uniquement si résultat */}
              {hasResult && (
                <View style={styles.metaGrid}>
                  <View style={styles.metaBox}>
                    <Text style={styles.metaLabel}>TENDANCE</Text>
                    <TrendBadge meta={trend} />
                  </View>
                  <View style={styles.metaBox}>
                    <Text style={styles.metaLabel}>POINTS</Text>
                    <Text style={styles.metaVal}>{p.points || '—'}</Text>
                  </View>
                  <View style={styles.metaBox}>
                    <Text style={styles.metaLabel}>RANG</Text>
                    <RankBadge pos={p.rang_pos} total={p.rang_total} fallback={p.rang_general} />
                  </View>
                </View>
              )}

              {/* Qualification */}
              {hasQualif && (
                <View style={styles.qualifRow}>
                  <Text style={styles.qualifLabel}>QUALIFICATION</Text>
                  <View style={styles.qualifBadges}>
                    {p.niveau_atteint ? <QualifBadge niveau={p.niveau_atteint} /> : null}
                    {p.niveau_superieur && p.next_delta_pct != null ? (
                      <NextNivBadge niveau={p.niveau_superieur} deltaPct={p.next_delta_pct} />
                    ) : null}
                  </View>
                  {p.niveau_superieur && p.next_temps ? (
                    <Text style={styles.qualifSeuil}>Seuil {p.niveau_superieur} : {p.next_temps}</Text>
                  ) : null}
                </View>
              )}
            </View>
          </View>
        );
      })}
    </Animated.View>
  );
}

interface Props {
  passages: PassageRow[];
}

export default function VuePassage({ passages }: Props) {
  if (!passages.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🏁</Text>
        <Text style={styles.emptyTitle}>Aucun passage disponible</Text>
        <Text style={styles.emptySub}>Le programme de passage apparaîtra ici.</Text>
      </View>
    );
  }

  // Grouper par réunion
  const groupMap = new Map<number, ReunionGroup>();
  for (const p of passages) {
    if (!groupMap.has(p.reunion_num)) {
      const label = `R${p.reunion_num} — ${p.reunion_label || ''} ${p.reunion_moment || ''}`.trim();
      groupMap.set(p.reunion_num, { reunion_num: p.reunion_num, label, lignes: [] });
    }
    groupMap.get(p.reunion_num)!.lignes.push(p);
  }
  const groups = Array.from(groupMap.values()).sort((a, b) => a.reunion_num - b.reunion_num);

  return (
    <View style={styles.wrap}>
      {groups.map((g, idx) => (
        <ReunionCard key={g.reunion_num} group={g} index={idx} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, paddingBottom: 32 },

  card: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },

  reunionHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: COLORS.surfaceHigh, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  reunionTitle:   { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  reunionSub:     { color: COLORS.muted, fontSize: 11, marginTop: 1 },
  enCoursBadge:   { backgroundColor: 'rgba(251,140,0,0.12)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  enCoursText:    { color: '#FB8C00', fontSize: 11, fontWeight: '700' },

  passageRow:     { flexDirection: 'row' },
  rowDivider:     { borderTopWidth: 1, borderTopColor: COLORS.border },
  accentBar:      { width: 3, backgroundColor: COLORS.subtle },
  accentBarBetter:{ backgroundColor: COLORS.success },
  accentBarWorse: { backgroundColor: COLORS.danger },
  accentBarQualif:{ backgroundColor: '#ffd166' },

  passageContent: { flex: 1, padding: 12, gap: 8 },

  topLine:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  leftBlock:  { flex: 1, gap: 2 },
  nameRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:        { width: 8, height: 8, borderRadius: 4 },
  athleteName:{ color: COLORS.text, fontSize: 14, fontWeight: '800', flex: 1 },
  heureText:  { color: COLORS.muted, fontSize: 11, marginLeft: 14 },
  timeBlock:  { alignItems: 'flex-end' },
  timeVal:    { color: COLORS.text, fontSize: 16, fontWeight: '900' },
  timeValQualif: { color: '#ffd166' },
  timeHour:   { color: COLORS.muted, fontSize: 10, marginTop: 2 },

  eventPills: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tempsRef:   { color: COLORS.muted, fontSize: 11 },

  metaGrid:  { flexDirection: 'row', gap: 16 },
  metaBox:   { gap: 3 },
  metaLabel: { color: COLORS.subtle, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  metaVal:   { color: COLORS.textMid, fontSize: 13, fontWeight: '700' },

  qualifRow:    { gap: 5, paddingTop: 6, borderTopWidth: 1, borderTopColor: COLORS.border },
  qualifLabel:  { color: COLORS.subtle, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  qualifBadges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  qualifSeuil:  { color: COLORS.muted, fontSize: 10, marginTop: 2 },

  empty:      { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon:  { fontSize: 40 },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  emptySub:   { color: COLORS.muted, fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
