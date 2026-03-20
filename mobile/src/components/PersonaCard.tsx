import { View, Text, StyleSheet } from 'react-native';
import type { PersonaEvent } from '../hooks/useDeliberate';

interface Props {
  event: PersonaEvent;
}

export function PersonaCard({ event }: Props) {
  const { persona, dimensions, response } = event;
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{persona}</Text>
      <Text style={styles.meta}>
        {dimensions.age} · {dimensions.geography} · {dimensions.job}
      </Text>
      <Text style={styles.response}>{response}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4F46E5',
    padding: 14,
    marginBottom: 10,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: '#818CF8',
    marginBottom: 3,
  },
  meta: {
    fontSize: 11,
    color: '#555',
    marginBottom: 8,
  },
  response: {
    fontSize: 14,
    lineHeight: 22,
    color: '#d4d4d4',
  },
});
