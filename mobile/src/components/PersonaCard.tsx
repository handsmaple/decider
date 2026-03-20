import { useRef, useEffect, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import {
  AGE_LABELS,
  GEOGRAPHY_LABELS,
  WORLDVIEW_LABELS,
  JOB_LABELS,
  EDUCATION_LABELS,
  INTEREST_LABELS,
  worldviewColor,
  label,
} from '../constants';
import type { PersonaEvent } from '../hooks/useDeliberate';

// Required on Android for LayoutAnimation to work
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface Props {
  event: PersonaEvent;
}

export function PersonaCard({ event }: Props) {
  const { persona, dimensions, response } = event;
  const [expanded, setExpanded] = useState(false);

  // Fade + slide up on mount
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  function toggleExpanded() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((e) => !e);
  }

  const accentColor = worldviewColor(dimensions.worldview);
  const interests = dimensions.interests
    .map((k) => label(INTEREST_LABELS, k))
    .join(', ');

  return (
    <Animated.View
      style={[styles.card, { borderLeftColor: accentColor }, { opacity, transform: [{ translateY }] }]}
    >
      <Pressable onPress={toggleExpanded} android_ripple={{ color: '#ffffff10' }}>
        <Text style={[styles.name, { color: accentColor }]}>{persona}</Text>
        <Text style={styles.meta}>
          {label(AGE_LABELS, dimensions.age)} · {label(GEOGRAPHY_LABELS, dimensions.geography)} ·{' '}
          {label(JOB_LABELS, dimensions.job)}
        </Text>
        <Text style={styles.response}>{response}</Text>

        {expanded && (
          <View style={styles.detail}>
            <DetailRow label="Worldview" value={label(WORLDVIEW_LABELS, dimensions.worldview)} />
            <DetailRow label="Education" value={label(EDUCATION_LABELS, dimensions.education)} />
            <DetailRow label="Interests" value={interests} />
          </View>
        )}

        <Text style={styles.expandHint}>{expanded ? '▲ less' : '▼ more'}</Text>
      </Pressable>
    </Animated.View>
  );
}

function DetailRow({ label: lbl, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{lbl}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderLeftWidth: 3,
    padding: 14,
    marginBottom: 10,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
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
  detail: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailLabel: {
    fontSize: 11,
    color: '#555',
    width: 72,
    flexShrink: 0,
  },
  detailValue: {
    fontSize: 11,
    color: '#999',
    flex: 1,
  },
  expandHint: {
    marginTop: 10,
    fontSize: 10,
    color: '#444',
    textAlign: 'right',
  },
});
