import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/constants';
import { formatReunionLabel, groupByAthlete, sortProgrammeRows } from '../utils/helpers';
import { ProgrammeRow, Reunion } from '../utils/types';
import { Avatar, NagePill, PlotBadge, TypeBadge } from './Atoms';

interface Props {
  reunions: Reunion<ProgrammeRow>[];
  reunionFilter: number | '';
}

// ─── Animated accordion row ─────────────────────────────────────────────────
function AccordionCard({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: isOpen ? 1 : 0, useNativeDriver: false, tension: 80, friction: 12 }).start();
  }, [isOpen]);
  return (
    <Animated.View style={{ opacity: anim, overflow: 'hidden' }}>
      {children}
    </Animated.View>
  );
}

// ─── Athlete card within a reunion ──────────────────────────────────────────
function AthCard({ ath }: { ath: ReturnType<typeof groupByAthlete>[0] & { lignes: ProgrammeRow[] } }) {
  const [open, setOpen] = useState(true);
  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(fadeIn, { toValue: 1, duration: 300, useNativeDriver: true }).start(); }, []);

  return (
    <Animated.View style={[styles.athCard, { opacity: fadeIn }]}>
      <Pressable style={styles.athHeader} onPress={() => setOpen(v => !v)}>
        <Avatar name={ath.athlete_nom} size={38} />
        <View style={{ flex: 1 }}>
          <Text style={styles.athName}>{ath.athlete_nom}</Text>
          <Text style={styles.athMeta}>{[ath.annee_naiss, ath.sexe].filter(Boolean).join(' · ') || 'Programme'}</Text>
        </View>
        <View style={styles.coursesBadge}>
          <Text style={styles.coursesBadgeText}>{ath.lignes.length}</Text>
        </View>
        <Text style={[styles.chevron, { transform: [{ rotate: open ? '90deg' : '0deg' }] }]}>›</Text>
      </Pressable>

      <AccordionCard isOpen={open}>
        {ath.lignes.map((line, idx) => (
          <View key={`${ath.athlete_nom}-${idx}`} style={[styles.row, idx > 0 && styles.rowDivider]}>
            {/* Heure */}
            <View style={styles.hourCol}>
              <Text style={styles.rowLabel}>HEURE</Text>
              <Text style={styles.hourVal}>{line.heure_depart || '—'}</Text>
            </View>

            {/* Event info */}
            <View style={styles.eventCol}>
              <View style={styles.pillsRow}>
                <NagePill label={line.epreuve_norm || line.epreuve_label} />
                <TypeBadge typeSerie={line.type_serie} />
              </View>
              <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                  <Text style={styles.rowLabel}>SÉRIE</Text>
                  <Text style={styles.metaChipVal}>{line.serie_num ? `S${line.serie_num}` : '—'}</Text>
                </View>
                <View style={styles.metaChip}>
                  <Text style={styles.rowLabel}>PLOT</Text>
                  <PlotBadge plot={line.plot} />
                </View>
                <View style={[styles.metaChip, { flex: 1 }]}>
                  <Text style={styles.rowLabel}>RÉFÉRENCE</Text>
                  <Text style={styles.refVal}>{line.temps_ref || '—'}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </AccordionCard>
    </Animated.View>
  );
}

// ─── Reunion Block ───────────────────────────────────────────────────────────
function ReunionBlock({ reunion, defaultOpen }: { reunion: Reunion<ProgrammeRow>; defaultOpen: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const rotate = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;
  const athletes = groupByAthlete(reunion.lignes).map(g => ({ ...g, lignes: sortProgrammeRows(g.lignes) }));

  const toggle = useCallback(() => {
    setIsOpen(v => {
      Animated.spring(rotate, { toValue: v ? 0 : 1, useNativeDriver: true, tension: 100, friction: 12 }).start();
      return !v;
    });
  }, [rotate]);

  const arrowRotate = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });

  return (
    <View style={styles.reunionWrap}>
      <Pressable onPress={toggle} style={({ pressed }) => [styles.reunionHeader, pressed && { opacity: 0.85 }]}>
        <LinearGradient colors={['#0c2540', '#071829']} style={styles.reunionHeaderGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <View style={styles.reunionLeft}>
            <View style={styles.reunionNumBadge}>
              <Text style={styles.reunionNum}>R{reunion.reunion_num}</Text>
            </View>
            <View>
              <Text style={styles.reunionTitle}>Réunion {reunion.reunion_num}</Text>
              <Text style={styles.reunionLabel}>{formatReunionLabel(reunion.reunion_label)}</Text>
            </View>
          </View>
          <View style={styles.reunionRight}>
            {reunion.reunion_moment ? (
              <View style={styles.momentBadge}>
                <Text style={styles.momentText}>{reunion.reunion_moment}</Text>
              </View>
            ) : null}
            <View style={styles.countChip}>
              <Text style={styles.countChipText}>{athletes.length}</Text>
            </View>
            <Animated.Text style={[styles.reunionArrow, { transform: [{ rotate: arrowRotate }] }]}>›</Animated.Text>
          </View>
        </LinearGradient>
      </Pressable>

      <AccordionCard isOpen={isOpen}>
        <View style={styles.reunionBody}>
          {athletes.map((ath) => (
            <AthCard key={`${ath.athlete_nom}-${ath.annee_naiss}`} ath={ath} />
          ))}
        </View>
      </AccordionCard>
    </View>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function VueProgramme({ reunions, reunionFilter }: Props) {
  if (!reunions.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>Programme non disponible</Text>
        <Text style={styles.emptySub}>Chargez une compétition configurée avec un programme scrappé.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {reunions.map((reunion, idx) => (
        <ReunionBlock
          key={`reunion-${reunion.reunion_num}`}
          reunion={reunion}
          defaultOpen={reunionFilter !== '' ? reunion.reunion_num === reunionFilter : idx === 0}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, paddingBottom: 32 },

  // Reunion header
  reunionWrap: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  reunionHeader: { overflow: 'hidden' },
  reunionHeaderGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  reunionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  reunionNumBadge: { width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.accentDim, borderWidth: 1, borderColor: COLORS.accentGlow, alignItems: 'center', justifyContent: 'center' },
  reunionNum: { color: COLORS.accent, fontSize: 12, fontWeight: '900' },
  reunionTitle: { color: COLORS.text, fontSize: 13, fontWeight: '800' },
  reunionLabel: { color: COLORS.muted, fontSize: 11, marginTop: 1 },
  reunionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  momentBadge: { backgroundColor: 'rgba(255,209,102,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  momentText: { color: COLORS.warning, fontSize: 11, fontWeight: '800' },
  countChip: { backgroundColor: COLORS.accentDim, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  countChipText: { color: COLORS.accent, fontSize: 11, fontWeight: '800' },
  reunionArrow: { color: COLORS.muted, fontSize: 22, fontWeight: '300' },

  // Reunion body
  reunionBody: { backgroundColor: COLORS.surface, padding: 10, gap: 8 },

  // Ath card
  athCard: { backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  athHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 11, gap: 10, backgroundColor: COLORS.surfaceHigh },
  athName: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  athMeta: { color: COLORS.muted, fontSize: 11, marginTop: 1 },
  coursesBadge: { backgroundColor: COLORS.accentDim, borderRadius: 999, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  coursesBadgeText: { color: COLORS.accent, fontSize: 11, fontWeight: '900' },
  chevron: { color: COLORS.muted, fontSize: 20, fontWeight: '300', marginLeft: 2 },

  // Row
  row: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  rowDivider: { borderTopWidth: 1, borderTopColor: COLORS.border },
  rowLabel: { color: COLORS.subtle, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 },
  hourCol: { marginBottom: 4 },
  hourVal: { color: COLORS.accent, fontSize: 15, fontWeight: '900', fontVariant: ['tabular-nums'] },
  eventCol: { gap: 8 },
  pillsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metaRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' },
  metaChip: { gap: 3, minWidth: 52 },
  metaChipVal: { color: COLORS.text, fontSize: 13, fontWeight: '800' },
  refVal: { color: COLORS.textMid, fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },

  // Empty
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  emptySub: { color: COLORS.muted, fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
