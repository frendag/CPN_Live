import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentName = 'cyan' | 'blue' | 'green' | 'red' | 'gold';

export interface AppTheme {
  mode: ThemeMode;
  accentName: AccentName;
}

const STORAGE_KEY = 'cpn_theme_pref_v1';

const ACCENTS: Record<AccentName, string> = {
  cyan: '#00c9a7',
  blue: '#4da3ff',
  green: '#34c778',
  red: '#ff6b6b',
  gold: '#ffd166',
};

function buildPalette(pref: AppTheme, colorScheme: 'light' | 'dark' | null | undefined) {
  const resolvedMode = pref.mode === 'system' ? (colorScheme === 'light' ? 'light' : 'dark') : pref.mode;
  const accent = ACCENTS[pref.accentName];

  if (resolvedMode === 'light') {
    return {
      resolvedMode,
      accent,
      background: '#edf4fb',
      backgroundAlt: '#dde9f8',
      surface: '#ffffff',
      surfaceHigh: '#f7fbff',
      cardBorder: 'rgba(6, 27, 56, 0.08)',
      text: '#0a1d34',
      textMuted: '#57718c',
      glow: `${accent}33`,
      danger: '#d94f4f',
      success: '#0a9d73',
    };
  }

  return {
    resolvedMode,
    accent,
    background: '#03101d',
    backgroundAlt: '#071829',
    surface: '#0c1d31',
    surfaceHigh: '#112741',
    cardBorder: 'rgba(168, 194, 216, 0.10)',
    text: '#ecf4fb',
    textMuted: '#93aec7',
    glow: `${accent}55`,
    danger: '#ff6b6b',
    success: '#00c9a7',
  };
}

interface ThemeContextValue {
  preference: AppTheme;
  palette: ReturnType<typeof buildPalette>;
  setMode: (mode: ThemeMode) => void;
  setAccentName: (accent: AccentName) => void;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const [preference, setPreference] = useState<AppTheme>({ mode: 'dark', accentName: 'cyan' });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AppTheme>;
          setPreference({
            mode: parsed.mode === 'light' || parsed.mode === 'dark' || parsed.mode === 'system' ? parsed.mode : 'dark',
            accentName: parsed.accentName && parsed.accentName in ACCENTS ? parsed.accentName as AccentName : 'cyan',
          });
        }
      })
      .finally(() => setReady(true));
  }, []);

  const persist = useCallback((next: AppTheme) => {
    setPreference(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
  }, []);

  const setMode = useCallback((mode: ThemeMode) => {
    persist({ ...preference, mode });
  }, [persist, preference]);

  const setAccentName = useCallback((accentName: AccentName) => {
    persist({ ...preference, accentName });
  }, [persist, preference]);

  const palette = useMemo(() => buildPalette(preference, colorScheme), [preference, colorScheme]);

  return (
    <ThemeContext.Provider value={{ preference, palette, setMode, setAccentName, ready }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used inside AppThemeProvider');
  return ctx;
}

export const THEME_ACCENTS = ACCENTS;
