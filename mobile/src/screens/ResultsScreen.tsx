import { useRef, useEffect } from 'react';
import {
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PersonaCard } from '../components/PersonaCard';
import { ParliamentBar } from '../components/ParliamentBar';
import { LoadingDots } from '../components/LoadingDots';
import { DimensionBreakdown } from '../components/DimensionBreakdown';
import type { DeliberationState } from '../hooks/useDeliberate';

interface Props {
  question: string;
  state: DeliberationState;
  onReset: () => void;
  onRetry: () => void;
}

export function ResultsScreen({ question, state, onReset, onRetry }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const isLoading = state.status === 'loading';

  // Synthesis card: fade + slide up when it first appears
  const synthesisOpacity = useRef(new Animated.Value(0)).current;
  const synthesisSlide = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (state.personas.length > 0 || state.synthesis) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [state.personas.length, state.synthesis]);

  useEffect(() => {
    if (state.synthesis) {
      Animated.parallel([
        Animated.timing(synthesisOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(synthesisSlide, { toValue: 0, duration: 420, useNativeDriver: true }),
      ]).start();
    }
  }, [state.synthesis, synthesisOpacity, synthesisSlide]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

      {/* Nav bar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={onReset} style={styles.backButton} activeOpacity={0.7}>
          <Text style={styles.backText}>← New question</Text>
        </TouchableOpacity>
        {isLoading && (
          <Text style={styles.navStatus}>
            {state.personas.length > 0
              ? `${state.personas.length} response${state.personas.length !== 1 ? 's' : ''}…`
              : 'Deliberating…'}
          </Text>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.question}>{question}</Text>

        <ParliamentBar personas={state.personas} />

        {state.personas.map((p, i) => (
          <PersonaCard key={p.persona} event={p} index={i} />
        ))}

        {isLoading && <LoadingDots count={state.personas.length} />}

        {state.error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{state.error}</Text>
            <TouchableOpacity onPress={onRetry} style={styles.retryButton} activeOpacity={0.7}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {state.synthesis && (
          <Animated.View
            style={[
              styles.synthesisCard,
              { opacity: synthesisOpacity, transform: [{ translateY: synthesisSlide }] },
            ]}
          >
            <Text style={styles.synthesisLabel}>SYNTHESIS</Text>
            <Text style={styles.synthesisText}>{state.synthesis}</Text>
          </Animated.View>
        )}

        {state.status === 'done' && <DimensionBreakdown personas={state.personas} />}

        {state.status === 'done' && state.durationMs !== null && (
          <Text style={styles.stats}>
            {state.personas.length} responses · {state.failed.length} failed ·{' '}
            {(state.durationMs / 1000).toFixed(1)}s
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scroll: { flex: 1 },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  backText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  navStatus: {
    fontSize: 12,
    color: '#555',
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e5e5e5',
    lineHeight: 26,
    marginBottom: 4,
  },
  errorBox: {
    backgroundColor: '#2a1010',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  retryButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#f87171',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  retryText: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '500',
  },
  synthesisCard: {
    backgroundColor: '#0a1628',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#38BDF8',
    padding: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  synthesisLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38BDF8',
    marginBottom: 8,
    letterSpacing: 1,
  },
  synthesisText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#cbd5e1',
  },
  stats: {
    marginTop: 12,
    fontSize: 12,
    color: '#444',
    textAlign: 'right',
  },
});
