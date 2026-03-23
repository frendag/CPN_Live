import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../utils/constants';
import { formatReunionLabel, groupByAthlete, sortProgrammeRows } from '../utils/helpers';
import { ProgrammeRow, Reunion } from '../utils/types';
import { Avatar, NagePill, PlotBadge, SectionCard, TypeBadge } from './Atoms';

interface Props {
  reunions: Reunion<ProgrammeRow>[];
  reunionFilter: number | '';
}

export default function VueProgramme({ reunions, reunionFilter }: Props) {
  const [opened, setOpened] = useState<number[]>([]);

  useEffect(() => {
    if (reunionFilter !== '') {
      setOpened([reunionFilter]);
      return;
    }
    setOpened(reunions.length ? [reunions[0].reunion_num] : []);
  }, [reunionFilter, reunions]);

  const visible = useMemo(() => reunions, [reunions]);

  if (!visible.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>Programme non disponible</Text>
        <Text style={styles.emptySub}>Chargez une compétition configurée et un programme scrappé côté admin.</Text>
      </View>
    );
  }

  const toggle = (reunionNum: number) => {
    setOpened((prev) => (prev.includes(reunionNum) ? prev.filter((item) => item !== reunionNum) : [...prev, reunionNum]));
  };

  return (
    <View style={styles.wrap}>
      {visible.map((reunion) => {
        const isOpen = opened.includes(reunion.reunion_num);
        const athletes = groupByAthlete(reunion.lignes).map((group) => ({
          ...group,
          lignes: sortProgrammeRows(group.lignes),
        }));

        return (
          <SectionCard key={`reunion-${reunion.reunion_num}`}>
            <Pressable style={styles.reunionHeader} onPress={() => toggle(reunion.reunion_num)}>
              <Text style={styles.reunionArrow}>{isOpen ? '▼' : '▶'}</Text>
              <View style={styles.reunionTitleWrap}>
                <Text style={styles.reunionTitle}>Réunion {reunion.reunion_num}</Text>
                <Text style={styles.reunionLabel}>{formatReunionLabel(reunion.reunion_label)}</Text>
              </View>
              {reunion.reunion_moment ? <Text style={styles.reunionMoment}>{reunion.reunion_moment}</Text> : null}
            </Pressable>

            {isOpen && (
              <View style={styles.reunionBody}>
                {athletes.map((ath) => (
                  <View key={`${ath.athlete_nom}-${ath.annee_naiss}`} style={styles.athCard}>
                    <View style={styles.athHeader}>
                      <View style={styles.athIdentity}>
                        <Avatar name={ath.athlete_nom} size={42} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.athName}>{ath.athlete_nom}</Text>
                          <Text style={styles.athMeta}>{[ath.annee_naiss, ath.sexe].filter(Boolean).join(' · ') || 'Programme'}</Text>
                        </View>
                      </View>
                      <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{ath.lignes.length} course{ath.lignes.length > 1 ? 's' : ''}</Text>
                      </View>
                    </View>

                    {ath.lignes.map((line, idx) => (
                      <View key={`${ath.athlete_nom}-${idx}-${line.epreuve_label}-${line.serie_num}`} style={[styles.row, idx > 0 && styles.rowDivider]}>
                        <View style={styles.colHour}>
                          <Text style={styles.label}>Heure</Text>
                          <Text style={styles.value}>{line.heure_depart || '—'}</Text>
                        </View>

                        <View style={styles.colEvent}>
                          <NagePill label={line.epreuve_norm || line.epreuve_label} />
                          <TypeBadge typeSerie={line.type_serie} />
                        </View>

                        <View style={styles.inlineMeta}>
                          <View style={styles.metaBox}>
                            <Text style={styles.label}>Série</Text>
                            <Text style={styles.value}>{line.serie_num ? `S${line.serie_num}` : '—'}</Text>
                          </View>
                          <View style={styles.metaBox}>
                            <Text style={styles.label}>Plot</Text>
                            <PlotBadge plot={line.plot} />
                          </View>
                          <View style={[styles.metaBox, styles.refBox]}>
                            <Text style={styles.label}>Référence</Text>
                            <Text style={styles.refValue}>{line.temps_ref || '—'}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </SectionCard>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, paddingBottom: 28 },
  reunionHeader: {
    backgroundColor: COLORS.reunionHeader,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reunionArrow: { color: '#fff', fontSize: 14, fontWeight: '900' },
  reunionTitleWrap: { flex: 1 },
  reunionTitle: { color: '#fff', fontSize: 13, fontWeight: '900' },
  reunionLabel: { color: 'rgba(255,255,255,.85)', fontSize: 12, marginTop: 2 },
  reunionMoment: {
    color: '#6b3f00',
    backgroundColor: '#ffd79a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '800',
  },
  reunionBody: { backgroundColor: '#f7fafd', padding: 10, gap: 10 },
  athCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  athHeader: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: '#fbfdff',
  },
  athIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  athName: { color: COLORS.text, fontSize: 15, fontWeight: '900' },
  athMeta: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  countBadge: { backgroundColor: '#eef4fb', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  countBadgeText: { color: COLORS.primarySoft, fontSize: 11, fontWeight: '800' },
  row: { paddingHorizontal: 12, paddingVertical: 12, gap: 10 },
  rowDivider: { borderTopWidth: 1, borderTopColor: COLORS.border },
  colHour: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  colEvent: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  inlineMeta: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  metaBox: { minWidth: 62, gap: 4 },
  refBox: { flex: 1, minWidth: 100 },
  label: { color: COLORS.subtle, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  value: { color: COLORS.text, fontSize: 13, fontWeight: '800' },
  refValue: { color: COLORS.muted, fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 50 },
  emptyIcon: { fontSize: 42, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  emptySub: { fontSize: 13, color: COLORS.muted, textAlign: 'center', marginTop: 6 },
});
