import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface Props {
  onAsk: (question: string) => void;
}

export function HomeScreen({ onAsk }: Props) {
  const [question, setQuestion] = useState('');

  function handleAsk() {
    const q = question.trim();
    if (!q) return;
    onAsk(q);
  }

  const canAsk = question.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Decider</Text>
          <Text style={styles.subtitle}>
            Ask a question. A diverse panel of AI personas deliberates.
          </Text>

          <TextInput
            style={styles.input}
            value={question}
            onChangeText={setQuestion}
            placeholder="Should cities ban cars from downtown?"
            placeholderTextColor="#444"
            returnKeyType="send"
            onSubmitEditing={handleAsk}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.askButton, !canAsk && styles.buttonDisabled]}
            onPress={handleAsk}
            disabled={!canAsk}
            activeOpacity={0.8}
          >
            <Text style={styles.askButtonText}>Ask</Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#e5e5e5',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 36,
  },
  input: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#e5e5e5',
    minHeight: 90,
    marginBottom: 14,
  },
  askButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#1e1e1e',
  },
  askButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
