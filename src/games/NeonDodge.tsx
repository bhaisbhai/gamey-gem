import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, RefreshCw, Trophy, Zap } from 'lucide-react';

interface NeonDodgeProps {
  onBack: () => void;
}

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const PLAYER_SIZE = 40;
const OBSTACLE_SIZE = 40;

const NeonDodge: React.FC<NeonDodgeProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2 - PLAYER_SIZE / 2);
  const [obstacles, setObstacles] = useState<{ id: number; x: number; y: number; speed: number }[]>([]);
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('neon-dodge-highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const startGame = () => {
    setScore(0);
    setObstacles([]);
    setPlayerX(GAME_WIDTH / 2 - PLAYER_SIZE / 2);
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const spawnInterval = setInterval(() => {
      setObstacles(prev => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          x: Math.random() * (GAME_WIDTH - OBSTACLE_SIZE),
          y: -OBSTACLE_SIZE,
          speed: 3 + Math.random() * 4 + score / 100
        }
      ]);
    }, 1000 - Math.min(800, score * 2));

    return () => clearInterval(spawnInterval);
  }, [gameState, score]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const moveInterval = setInterval(() => {
      setObstacles(prev => {
        const next = prev.map(o => ({ ...o, y: o.y + o.speed }))
          .filter(o => o.y < GAME_HEIGHT);
        
        // Collision check
        const hit = next.some(o => 
          o.y + OBSTACLE_SIZE > GAME_HEIGHT - 80 - PLAYER_SIZE &&
          o.y < GAME_HEIGHT - 80 &&
          o.x + OBSTACLE_SIZE > playerX &&
          o.x < playerX + PLAYER_SIZE
        );

        if (hit) {
          setGameState('gameover');
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('neon-dodge-highscore', score.toString());
          }
        }

        return next;
      });
      setScore(s => s + 1);
    }, 16);

    return () => clearInterval(moveInterval);
  }, [gameState, playerX, score, highScore]);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== 'playing' || !gameRef.current) return;
    const rect = gameRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left - PLAYER_SIZE / 2;
    setPlayerX(Math.max(0, Math.min(x, GAME_WIDTH - PLAYER_SIZE)));
  };

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100vh', justifyContent: 'center' }}>
      <button 
        onClick={onBack}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid var(--neon-cyan)',
          color: 'var(--neon-cyan)',
          padding: '8px',
          borderRadius: '50%',
          cursor: 'pointer',
          zIndex: 10
        }}
      >
        <ArrowLeft size={24} />
      </button>

      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h1 className="neon-text-cyan retro-text" style={{ margin: 0, fontSize: '2.5rem' }}>NEON DODGE</h1>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '10px' }}>
          <div className="retro-text">SCORE: {score}</div>
          <div className="retro-text" style={{ color: 'var(--neon-yellow)' }}>HIGH: {highScore}</div>
        </div>
      </div>

      <div 
        ref={gameRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
        style={{
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
          backgroundColor: '#1a0b2e',
          border: '4px solid var(--neon-cyan)',
          borderRadius: '12px',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'none',
          boxShadow: '0 0 30px rgba(0, 255, 255, 0.2)'
        }}
      >
        <div className="scanline" />

        {/* Player */}
        <motion.div 
          animate={{ x: playerX }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          style={{
            position: 'absolute',
            bottom: '80px',
            width: PLAYER_SIZE,
            height: PLAYER_SIZE,
            background: 'var(--neon-pink)',
            borderRadius: '8px',
            boxShadow: '0 0 15px var(--neon-pink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Zap size={24} color="white" />
        </motion.div>

        {/* Obstacles */}
        {obstacles.map(o => (
          <div 
            key={o.id}
            style={{
              position: 'absolute',
              left: o.x,
              top: o.y,
              width: OBSTACLE_SIZE,
              height: OBSTACLE_SIZE,
              background: 'white',
              border: '2px solid var(--neon-cyan)',
              borderRadius: '4px',
              boxShadow: '0 0 10px white'
            }}
          />
        ))}

        {/* UI Overlays */}
        <AnimatePresence>
          {gameState === 'start' && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}
            >
              <Zap size={64} color="var(--neon-pink)" className="neon-text-pink" style={{ marginBottom: '20px' }} />
              <button className="btn-neon" onClick={startGame}>START MISSION</button>
              <p style={{ marginTop: '20px', color: '#888' }} className="retro-text">MOVE TO SURVIVE</p>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}
            >
              <h2 className="neon-text-pink retro-text" style={{ fontSize: '3rem' }}>WASTED</h2>
              <div className="retro-text" style={{ fontSize: '1.5rem', margin: '20px 0' }}>FINAL SCORE: {score}</div>
              <button className="btn-neon" onClick={startGame} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <RefreshCw size={20} /> RETRY
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NeonDodge;
