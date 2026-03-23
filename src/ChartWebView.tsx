/**
 * ChartWebView.tsx
 * Composant réutilisable qui embarque Chart.js dans une WebView inline.
 * Compatible Expo 51 avec react-native-webview 13.x.
 *
 * Usage :
 *   <ChartWebView type="line" data={...} options={...} height={200} />
 */
import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface ChartWebViewProps {
  /** Config Chart.js complète (type + data + options) */
  config: object;
  height?: number;
  backgroundColor?: string;
}

export default function ChartWebView({ config, height = 220, backgroundColor = '#0d2035' }: ChartWebViewProps) {
  const html = buildHtml(config, backgroundColor);

  return (
    <View style={[styles.wrap, { height }]}>
      <WebView
        source={{ html }}
        style={[styles.webview, { backgroundColor }]}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        overScrollMode="never"
        bounces={false}
        javaScriptEnabled
        originWhitelist={['*']}
      />
    </View>
  );
}

function buildHtml(config: object, bg: string): string {
  const configJson = JSON.stringify(config);
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{background:${bg};overflow:hidden;width:100%;height:100%}
  canvas{display:block}
</style>
</head>
<body>
<canvas id="c"></canvas>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
<script>
const cfg = ${configJson};
// Inject dark theme defaults
Chart.defaults.color = '#6a8ba5';
Chart.defaults.borderColor = 'rgba(26,52,84,0.6)';
Chart.defaults.font.family = '-apple-system, sans-serif';
Chart.defaults.font.size = 11;
new Chart(document.getElementById('c'), cfg);
</script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  wrap: { width: '100%', borderRadius: 10, overflow: 'hidden' },
  webview: { flex: 1, borderRadius: 10 },
});
