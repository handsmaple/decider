import { useState, useRef } from 'react';
import { Animated } from 'react-native';
import { useDeliberate } from './src/hooks/useDeliberate';
import { HomeScreen } from './src/screens/HomeScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';

type Screen = 'home' | 'results';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [question, setQuestion] = useState('');
  const { state, deliberate, reset } = useDeliberate();

  const fadeAnim = useRef(new Animated.Value(1)).current;

  /** Fade out → run state update → fade in. */
  function transition(callback: () => void) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      callback();
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  }

  function handleAsk(q: string) {
    transition(() => {
      setQuestion(q);
      deliberate(q);
      setScreen('results');
    });
  }

  function handleReset() {
    transition(() => {
      reset();
      setScreen('home');
    });
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      {screen === 'results' ? (
        <ResultsScreen
          question={question}
          state={state}
          onReset={handleReset}
          onRetry={() => deliberate(question)}
        />
      ) : (
        <HomeScreen onAsk={handleAsk} />
      )}
    </Animated.View>
  );
}
