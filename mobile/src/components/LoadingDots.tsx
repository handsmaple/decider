import { useRef, useEffect } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface Props {
  count: number; // personas received so far
}

export function LoadingDots({ count }: Props) {
  const dots = useRef([
    new Animated.Value(0.2),
    new Animated.Value(0.2),
    new Animated.Value(0.2),
  ]).current;

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 220),
          Animated.timing(dot, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.2, duration: 320, useNativeDriver: true }),
          Animated.delay(Math.max(0, (dots.length - 1 - i) * 220)),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [dots]);

  return (
    <View style={styles.container}>
      <View style={styles.dotRow}>
        {dots.map((opacity, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity }]} />
        ))}
      </View>
      {count > 0 && (
        <Text style={styles.label}>{count} response{count !== 1 ? 's' : ''} so far…</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
  },
  label: {
    fontSize: 12,
    color: '#555',
  },
});
