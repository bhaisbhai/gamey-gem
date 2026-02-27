import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Rewind90s from './games/Rewind90s';
import NeonDodge from './games/NeonDodge';
import MusicGuess from './games/MusicGuess';
import ArcadeHome from './components/ArcadeHome';

type Screen = 'home' | 'rewind' | 'dodge' | 'music';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('home');

  return (
    <div style={{ minHeight: '100vh', width: '100%', position: 'relative' }}>
      <div className="scanline" />
      
      <AnimatePresence mode="wait">
        {screen === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ArcadeHome onSelectGame={setScreen} />
          </motion.div>
        )}

        {screen === 'rewind' && (
          <motion.div
            key="rewind"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
          >
            <Rewind90s onBack={() => setScreen('home')} />
          </motion.div>
        )}

        {screen === 'dodge' && (
          <motion.div
            key="dodge"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
          >
            <NeonDodge onBack={() => setScreen('home')} />
          </motion.div>
        )}

        {screen === 'music' && (
          <motion.div
            key="music"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
          >
            <MusicGuess onBack={() => setScreen('home')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
