import { View, Text, StyleSheet } from 'react-native';
import type { PersonaEvent } from '../hooks/useDeliberate';

// Rough heuristic mapping worldview strings to recognisable colours.
// Falls back to grey for anything unmapped.
const WORLDVIEW_COLORS: Record<string, string> = {
  conservative: '#ef4444',
  liberal: '#3b82f6',
  libertarian: '#f59e0b',
  socialist: '#ec4899',
  religious: '#8b5cf6',
  secular: '#14b8a6',
  traditional: '#a16207',
  progressive: '#22c55e',
};

function colorFor(worldview: string): string {
  const lower = worldview.toLowerCase();
  for (const [key, color] of Object.entries(WORLDVIEW_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return '#6b7280';
}

interface Props {
  personas: PersonaEvent[];
}

export function ParliamentBar({ personas }: Props) {
  if (personas.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {personas.map((p) => (
          <View
            key={p.persona}
            style={[styles.segment, { backgroundColor: colorFor(p.dimensions.worldview) }]}
          />
        ))}
      </View>
      <Text style={styles.label}>
        {personas.length} persona{personas.length !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  bar: {
    height: 8,
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  segment: {
    flex: 1,
    marginHorizontal: 0.5,
  },
  label: {
    fontSize: 11,
    color: '#555',
    marginTop: 4,
  },
});
