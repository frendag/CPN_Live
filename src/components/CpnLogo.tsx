/**
 * CpnLogo — Logo CPN Analytics réutilisable en React Native
 * Deux variantes :
 *   - "mark"    : icône carrée seule (navbar, splash)
 *   - "full"    : icône + texte horizontal (header large)
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface CpnLogoProps {
  variant?: 'mark' | 'full';
  size?: number; // taille de l'icône mark
}

export function CpnLogo({ variant = 'full', size = 44 }: CpnLogoProps) {
  const Mark = () => (
    <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.22 }]}>
      <View style={[styles.wave, { height: size * 0.22 }]} />
      <View style={[styles.curve, {
        top: size * 0.1, left: size * 0.08, right: size * 0.08, height: size * 0.4,
        borderTopWidth: Math.max(2, size * 0.055),
      }]} />
      <Text style={[styles.markText, { fontSize: size * 0.18, paddingBottom: size * 0.04 }]}>CPN</Text>
    </View>
  );

  if (variant === 'mark') return <Mark />;

  return (
    <View style={styles.fullWrap}>
      <Mark />
      <View style={styles.textBlock}>
        <Text style={styles.textMain}>CERGY PONTOISE</Text>
        <View style={styles.redLine} />
        <View style={styles.bottomRow}>
          <Text style={styles.textNata}>NATATION</Text>
          <Text style={styles.textAnalytics}>Analytics</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Mark
  mark: {
    backgroundColor: '#001a33', overflow: 'hidden',
    justifyContent: 'flex-end', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  wave: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0055AA', opacity: 0.85,
  },
  curve: {
    position: 'absolute',
    borderColor: '#FF0000', borderRadius: 2,
    transform: [{ rotate: '-15deg' }],
  },
  markText: { color: '#fff', fontWeight: '900', letterSpacing: 0.5, zIndex: 1 },

  // Full
  fullWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  textBlock: { gap: 2 },
  textMain: {
    color: '#FFFFFF', fontSize: 13, fontWeight: '900',
    letterSpacing: 1, fontStyle: 'italic',
  },
  redLine: { height: 1.5, width: '90%', backgroundColor: '#FF0000', opacity: 0.9 },
  bottomRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  textNata: { color: '#FF0000', fontSize: 11, fontWeight: '700', letterSpacing: 4 },
  textAnalytics: { color: '#FFD54A', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});
