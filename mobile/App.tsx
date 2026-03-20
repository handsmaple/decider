import { useRef, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useDeliberate } from './src/hooks/useDeliberate';
import { PersonaCard } from './src/components/PersonaCard';
import { ParliamentBar } from './src/components/ParliamentBar';
import { LoadingDots } from './src/components/LoadingDots';
import { DimensionBreakdown } from './src/components/DimensionBreakdown';

export default function App() {
  const [question, setQuestion] = useState('');
  const { state, deliberate, reset } = useDeliberate();
  const scrollRef = useRef<ScrollView>(null);
  const isLoading = state.status === 'loading';

  // Auto-scroll as personas stream in and when synthesis arrives
  useEffect(() => {
    if (state.personas.length > 0 || state.synthesis) {
      // Small delay lets LayoutAnimation finish before we measure
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [state.personas.length, state.synthesis]);

  function handleAsk() {
    const q = question.trim();
    if (!q || isLoading) return;
    deliberate(q);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Text style={styles.title}>Decider</Text>
          <Text style={styles.subtitle}>
            Ask a question. A diverse panel of AI personas deliberates.
          </Text>

          {/* Input */}
          <TextInput
            style={[styles.input, isLoading && styles.inputDisabled]}
            value={question}
            onChangeText={setQuestion}
            placeholder="Should cities ban cars from downtown?"
            placeholderTextColor="#444"
            editable={!isLoading}
            returnKeyType="send"
            onSubmitEditing={handleAsk}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.askButton, (isLoading || !question.trim()) && styles.buttonDisabled]}
              onPress={handleAsk}
              disabled={isLoading || !question.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.askButtonText}>{isLoading ? 'Asking…' : 'Ask'}</Text>
            </TouchableOpacity>

            {state.status !== 'idle' && (
              <TouchableOpacity style={styles.resetButton} onPress={reset} activeOpacity={0.8}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Error */}
          {state.error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{state.error}</Text>
            </View>
          )}

          {/* Parliament bar — grows as personas arrive */}
          <ParliamentBar personas={state.personas} />

          {/* Persona cards — animate in one by one */}
          {state.personas.map((p) => (
            <PersonaCard key={p.persona} event={p} />
          ))}

          {/* Loading indicator */}
          {isLoading && <LoadingDots count={state.personas.length} />}

          {/* Synthesis */}
          {state.synthesis && (
            <View style={styles.synthesisCard}>
              <Text style={styles.synthesisLabel}>SYNTHESIS</Text>
              <Text style={styles.synthesisText}>{state.synthesis}</Text>
            </View>
          )}

          {/* Panel breakdown — shown after deliberation completes */}
          {state.status === 'done' && (
            <DimensionBreakdown personas={state.personas} />
          )}

          {/* Stats footer */}
          {state.status === 'done' && state.durationMs !== null && (
            <Text style={styles.stats}>
              {state.personas.length} responses · {state.failed.length} failed ·{' '}
              {(state.durationMs / 1000).toFixed(1)}s
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e5e5e5',
    marginBottom: 6,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 28,
  },
  input: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#e5e5e5',
    marginBottom: 10,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  askButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#252525',
  },
  askButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  resetButton: {
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: '#666',
    fontSize: 14,
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
