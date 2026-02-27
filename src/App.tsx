import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, HeartCrack, Share2, Play } from 'lucide-react';
import { PUZZLES } from './puzzles';

const MAX_LIVES = 6;
const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

const getDailyPuzzle = () => {
  const randomIndex = Math.floor(Math.random() * PUZZLES.length);
  return PUZZLES[randomIndex];
};

const App: React.FC = () => {
  const [puzzle, setPuzzle] = useState(PUZZLES[0]);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    setPuzzle(getDailyPuzzle());
    setGuessedLetters(new Set());
    setGameState('playing');
  };

  const answerClean = puzzle.answer.replace(/[^A-Z]/g, '');
  const uniqueLettersInAnswer = new Set(answerClean.split(''));
  
  const wrongGuesses = Array.from(guessedLetters).filter(letter => !uniqueLettersInAnswer.has(letter));
  const livesRemaining = Math.max(0, MAX_LIVES - wrongGuesses.length);
  
  const isWinner = Array.from(uniqueLettersInAnswer).every(letter => guessedLetters.has(letter));
  const isLoser = livesRemaining === 0;

  useEffect(() => {
    if (gameState !== 'playing') return;

    if (isWinner) {
      setGameState('won');
      triggerWinCelebration();
    } else if (isLoser) {
      setGameState('lost');
    }
  }, [guessedLetters, isWinner, isLoser, gameState]);

  const triggerWinCelebration = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ff00ff', '#00ffff', '#ffff00']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ff00ff', '#00ffff', '#ffff00']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const handleGuess = useCallback((letter: string) => {
    if (gameState !== 'playing' || guessedLetters.has(letter)) return;
    
    setGuessedLetters(prev => {
      const newSet = new Set(prev);
      newSet.add(letter);
      return newSet;
    });
  }, [gameState, guessedLetters]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) {
        handleGuess(key);
      } else if (e.key === 'Enter' && gameState !== 'playing') {
        startNewGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGuess, gameState]);

  const generateShareText = () => {
    const score = MAX_LIVES - wrongGuesses.length;
    let grid = '';
    for(let i=0; i<MAX_LIVES; i++) {
        if (i < score) grid += '🟩';
        else grid += '🟥';
    }
    
    const text = `REWIND 90s 📼\nCategory: ${puzzle.category}\nScore: ${score}/${MAX_LIVES} ${grid}\nPlay now!`;
    if (navigator.share) {
      navigator.share({
        title: 'REWIND 90s',
        text: text,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    }
  };

  const words = puzzle.answer.split(' ');

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: '800px', margin: '0 auto' }}>
      <div className="scanline" />
      
      {/* Header */}
      <header style={{ padding: '20px', textAlign: 'center', borderBottom: '2px solid #3d2b54', marginBottom: '30px' }}>
        <h1 className="neon-text-pink retro-text" style={{ margin: 0, fontSize: '3rem', letterSpacing: '4px' }}>
          REWIND 90s
        </h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', maxWidth: '500px', margin: '20px auto 0' }}>
          <div className="retro-text neon-text-cyan" style={{ fontSize: '1.4rem', background: 'rgba(0,255,255,0.1)', padding: '6px 16px', borderRadius: '24px', border: '1px solid var(--neon-cyan)' }}>
            {puzzle.category}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[...Array(MAX_LIVES)].map((_, i) => (
              <motion.div 
                key={i}
                initial={false}
                animate={{ scale: i < livesRemaining ? 1 : 0.8, opacity: i < livesRemaining ? 1 : 0.3 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {i < livesRemaining ? <Heart size={28} color="#ff00ff" fill="#ff00ff" style={{ filter: 'drop-shadow(0 0 5px #ff00ff)' }} /> : <HeartCrack size={28} color="#4a3b5c" />}
              </motion.div>
            ))}
          </div>
        </div>
      </header>

      {/* Board */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 20px' }}>
        <div className="word-group">
          {words.map((word, wordIndex) => (
            <div key={wordIndex} className="word">
              {word.split('').map((letter, letterIndex) => {
                const isRevealed = guessedLetters.has(letter) || gameState !== 'playing';
                const isMissed = gameState === 'lost' && !guessedLetters.has(letter);
                
                return (
                  <div key={`${wordIndex}-${letterIndex}`} className="letter-tile">
                    <AnimatePresence>
                      {isRevealed && (
                        <motion.span
                          initial={{ opacity: 0, rotateX: -90, scale: 0.5 }}
                          animate={{ opacity: 1, rotateX: 0, scale: 1 }}
                          transition={{ type: 'spring', bounce: 0.6, duration: 0.6 }}
                          style={{ color: isMissed ? '#ff00ff' : 'white', filter: isMissed ? 'drop-shadow(0 0 5px #ff00ff)' : 'drop-shadow(0 0 5px #fff)' }}
                        >
                          {letter}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Keyboard */}
      <div style={{ padding: '10px 5px 30px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        {KEYBOARD_ROWS.map((row, i) => (
          <div key={i} className="keyboard-row">
            {row.map(key => {
              const isGuessed = guessedLetters.has(key);
              const isCorrect = isGuessed && uniqueLettersInAnswer.has(key);
              const isWrong = isGuessed && !uniqueLettersInAnswer.has(key);
              
              let className = 'key';
              if (isCorrect) className += ' correct';
              if (isWrong) className += ' wrong';

              return (
                <button
                  key={key}
                  className={className}
                  onClick={() => handleGuess(key)}
                  disabled={isGuessed || gameState !== 'playing'}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameState !== 'playing' && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              <h2 className={gameState === 'won' ? 'neon-text-cyan retro-text' : 'neon-text-pink retro-text'} style={{ fontSize: '3.5rem', margin: '0 0 15px' }}>
                {gameState === 'won' ? 'RADICAL!' : 'AS IF!'}
              </h2>
              <p style={{ fontSize: '1.3rem', marginBottom: '25px', color: '#ccc' }}>
                {gameState === 'won' ? 'You totally nailed it.' : 'Better luck next time.'}
              </p>
              
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '1rem', color: '#aaa', marginBottom: '8px', textTransform: 'uppercase' }}>{puzzle.category}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', letterSpacing: '2px', color: '#fff', textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>{puzzle.answer}</div>
              </div>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn-neon" onClick={startNewGame} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Play size={24} /> PLAY AGAIN
                </button>
                {gameState === 'won' && (
                  <button className="btn-neon" onClick={generateShareText} style={{ borderColor: 'var(--neon-cyan)', color: 'var(--neon-cyan)' }}>
                    <Share2 size={24} /> SHARE
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
