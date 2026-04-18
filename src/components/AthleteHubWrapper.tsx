import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../utils/theme';
import AthleteHub from './AthleteHub';

interface Props {
  onBack: () => void;
}

export default function AthleteHubWrapper({ onBack }: Props) {
  const { palette } = useAppTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={palette.accent} />
          <Text style={[styles.backText, { color: palette.accent }]}>KPI</Text>
        </Pressable>
      </View>
      <AthleteHub />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  header:  { paddingHorizontal: 18, paddingVertical: 10 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText:{ fontWeight: '700', fontSize: 15 },
});
