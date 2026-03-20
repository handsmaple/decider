import { View, Text, StyleSheet } from 'react-native';
import { worldviewColor } from '../constants';
import type { PersonaEvent } from '../hooks/useDeliberate';

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
            style={[styles.segment, { backgroundColor: worldviewColor(p.dimensions.worldview) }]}
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
