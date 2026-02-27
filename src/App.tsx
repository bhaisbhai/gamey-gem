import React, { useState, useEffect, useRef } from 'react';
import { Gem, Trophy, Play, RefreshCw } from 'lucide-react';

interface GameObject {
  id: number;
  x: number;
  y: number;
  size: number;
  type: 'gem' | 'bomb';
  color: string;
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [playerX, setPlayerX] = useState(50);
  const [objects, setObjects] = useState<GameObject[]>([]);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  
  const playerSize = 50;
  const gameWidth = 400;
  const gameHeight = 600;

  useEffect(() => {
    const saved = localStorage.getItem('gem-high-score');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setObjects((prev) => {
        const newObjects = prev
          .map(obj => ({ ...obj, y: obj.y + 5 }))
          .filter(obj => obj.y < gameHeight);

        // Add new objects
        if (Math.random() < 0.05) {
          const type = Math.random() < 0.8 ? 'gem' : 'bomb';
          newObjects.push({
            id: Date.now() + Math.random(),
            x: Math.random() * (gameWidth - 30),
            y: -30,
            size: 30,
            type,
            color: type === 'gem' ? `hsl(${Math.random() * 360}, 70%, 60%)` : '#ff4444'
          });
        }

        return newObjects;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const checkCollisions = () => {
      setObjects((prev) => {
        const remaining = prev.filter((obj) => {
          const hitX = Math.abs((obj.x + obj.size / 2) - (playerX + playerSize / 2)) < (obj.size + playerSize) / 2.5;
          const hitY = Math.abs((obj.y + obj.size / 2) - (gameHeight - playerSize / 2)) < (obj.size + playerSize) / 2.5;

          if (hitX && hitY) {
            if (obj.type === 'gem') {
              setScore((s) => s + 10);
              return false;
            } else {
              setGameState('gameover');
              return false;
            }
          }
          return true;
        });
        return remaining;
      });
    };

    const animationFrame = requestAnimationFrame(checkCollisions);
    return () => cancelAnimationFrame(animationFrame);
  }, [objects, playerX, gameState]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('gem-high-score', score.toString());
    }
  }, [score, highScore]);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== 'playing' || !gameContainerRef.current) return;
    
    const rect = gameContainerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left - playerSize / 2;
    setPlayerX(Math.max(0, Math.min(x, gameWidth - playerSize)));
  };

  const startGame = () => {
    setScore(0);
    setObjects([]);
    setGameState('playing');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      color: 'white',
      padding: '20px',
      userSelect: 'none'
    }}>
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#646cff' }}>GEM COLLECTOR</h1>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '10px' }}>
          <div>Score: {score}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Trophy size={16} color="#ffd700" /> High: {highScore}
          </div>
        </div>
      </div>

      <div 
        ref={gameContainerRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
        style={{
          width: gameWidth,
          height: gameHeight,
          backgroundColor: '#2a2a2a',
          borderRadius: '12px',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'none',
          boxShadow: '0 0 50px rgba(0,0,0,0.5)',
          border: '4px solid #333'
        }}
      >
        {gameState === 'playing' && (
          <>
            {/* Player */}
            <div style={{
              position: 'absolute',
              left: playerX,
              bottom: 0,
              width: playerSize,
              height: playerSize,
              backgroundColor: '#646cff',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'left 0.1s ease-out'
            }}>
              <div style={{ width: '80%', height: '80%', border: '2px solid white', borderRadius: '4px' }} />
            </div>

            {/* Objects */}
            {objects.map(obj => (
              <div key={obj.id} style={{
                position: 'absolute',
                left: obj.x,
                top: obj.y,
                width: obj.size,
                height: obj.size,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {obj.type === 'gem' ? (
                  <Gem size={obj.size} color={obj.color} fill={obj.color} style={{ filter: 'drop-shadow(0 0 5px ' + obj.color + ')' }} />
                ) : (
                  <div style={{ 
                    width: '80%', 
                    height: '80%', 
                    backgroundColor: '#ff4444', 
                    borderRadius: '50%',
                    boxShadow: '0 0 15px #ff4444'
                  }} />
                )}
              </div>
            ))}
          </>
        )}

        {gameState === 'start' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(5px)'
          }}>
            <Play size={64} color="#646cff" style={{ marginBottom: '20px' }} />
            <button 
              onClick={startGame}
              style={{
                padding: '12px 32px',
                fontSize: '1.2rem',
                backgroundColor: '#646cff',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              START GAME
            </button>
            <p style={{ marginTop: '20px', color: '#aaa' }}>Move mouse/touch to collect gems!</p>
            <p style={{ color: '#ff4444' }}>Avoid the red bombs!</p>
          </div>
        )}

        {gameState === 'gameover' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)'
          }}>
            <h2 style={{ fontSize: '3rem', color: '#ff4444', margin: '0 0 10px 0' }}>GAME OVER</h2>
            <div style={{ fontSize: '1.5rem', marginBottom: '30px' }}>Final Score: {score}</div>
            <button 
              onClick={startGame}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 32px',
                fontSize: '1.2rem',
                backgroundColor: '#646cff',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              <RefreshCw size={20} /> TRY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
