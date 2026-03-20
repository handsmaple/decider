import { StyleSheet, Text, View } from 'react-native';
import {
  AGE_LABELS,
  GEOGRAPHY_LABELS,
  WORLDVIEW_LABELS,
  WORLDVIEW_COLORS,
  label,
} from '../constants';
import type { PersonaEvent } from '../hooks/useDeliberate';

interface Props {
  personas: PersonaEvent[];
}

export function DimensionBreakdown({ personas }: Props) {
  if (personas.length === 0) return null;

  const worldviews = tally(personas.map((p) => p.dimensions.worldview));
  const ages = tally(personas.map((p) => p.dimensions.age));
  const geos = tally(personas.map((p) => p.dimensions.geography));

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>PANEL COMPOSITION</Text>
      <BreakdownRow
        title="Worldview"
        counts={worldviews}
        total={personas.length}
        labelMap={WORLDVIEW_LABELS}
        colorMap={WORLDVIEW_COLORS}
      />
      <BreakdownRow
        title="Age"
        counts={ages}
        total={personas.length}
        labelMap={AGE_LABELS}
        // Fixed order for age groups
        order={['young_adult', 'adult', 'middle_aged', 'senior']}
      />
      <BreakdownRow
        title="Geography"
        counts={geos}
        total={personas.length}
        labelMap={GEOGRAPHY_LABELS}
      />
    </View>
  );
}

// ── Sub-components ───────────────────────────────────────────────────

interface BreakdownRowProps {
  title: string;
  counts: Record<string, number>;
  total: number;
  labelMap: Record<string, string>;
  colorMap?: Record<string, string>;
  order?: string[];
}

function BreakdownRow({ title, counts, total, labelMap, colorMap, order }: BreakdownRowProps) {
  const entries = order
    ? order.filter((k) => counts[k] !== undefined).map((k) => [k, counts[k]] as [string, number])
    : Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{title}</Text>
      {entries.map(([key, count]) => {
        const pct = count / total;
        const barColor = colorMap?.[key] ?? '#4F46E5';
        return (
          <View key={key} style={styles.barRow}>
            <Text style={styles.barLabel} numberOfLines={1}>
              {label(labelMap, key)}
            </Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { flex: pct, backgroundColor: barColor }]} />
              <View style={[styles.barRemainder, { flex: 1 - pct }]} />
            </View>
            <Text style={styles.barCount}>{count}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────

function tally(items: string[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) {
    result[item] = (result[item] ?? 0) + 1;
  }
  return result;
}

// ── Styles ───────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 8,
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222',
    gap: 16,
  },
  heading: {
    fontSize: 11,
    fontWeight: '600',
    color: '#444',
    letterSpacing: 1,
  },
  row: {
    gap: 6,
  },
  rowTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    fontSize: 11,
    color: '#888',
    width: 90,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#1e1e1e',
  },
  barFill: {
    borderRadius: 3,
  },
  barRemainder: {
    // transparent fill to occupy remaining space
  },
  barCount: {
    fontSize: 11,
    color: '#555',
    width: 16,
    textAlign: 'right',
  },
});
