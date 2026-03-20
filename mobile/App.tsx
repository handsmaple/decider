import { useState } from 'react';
import { useDeliberate } from './src/hooks/useDeliberate';
import { HomeScreen } from './src/screens/HomeScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';

type Screen = 'home' | 'results';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [question, setQuestion] = useState('');
  const { state, deliberate, reset } = useDeliberate();

  function handleAsk(q: string) {
    setQuestion(q);
    deliberate(q);
    setScreen('results');
  }

  function handleReset() {
    reset();
    setScreen('home');
  }

  if (screen === 'results') {
    return <ResultsScreen question={question} state={state} onReset={handleReset} />;
  }

  return <HomeScreen onAsk={handleAsk} />;
}
