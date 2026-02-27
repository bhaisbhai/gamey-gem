import React from 'react';
import { motion } from 'framer-motion';
import { CassetteTape, Zap, Trophy, Play, Music } from 'lucide-react';

interface ArcadeHomeProps {
  onSelectGame: (game: 'rewind' | 'dodge' | 'music') => void;
}

const ArcadeHome: React.FC<ArcadeHomeProps> = ({ onSelectGame }) => {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '60px' }}>
        <motion.h1 
          className="neon-text-pink retro-text"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{ fontSize: '4rem', margin: 0, letterSpacing: '8px' }}
        >
          ARCADE 97
        </motion.h1>
        <p className="retro-text neon-text-cyan" style={{ fontSize: '1.2rem', marginTop: '10px' }}>SELECT YOUR CHALLENGE</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', padding: '0 20px' }}>
        {/* Game 1: Rewind 90s */}
        <motion.div 
          whileHover={{ scale: 1.05, y: -10 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelectGame('rewind')}
          style={{
            background: 'rgba(255, 0, 255, 0.1)',
            border: '3px solid var(--neon-pink)',
            borderRadius: '20px',
            padding: '30px',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(255, 0, 255, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}
        >
          <div style={{ padding: '20px', background: 'rgba(255, 0, 255, 0.2)', borderRadius: '50%' }}>
            <CassetteTape size={60} color="var(--neon-pink)" />
          </div>
          <h2 className="retro-text" style={{ margin: 0, fontSize: '2rem' }}>REWIND 90s</h2>
          <p style={{ color: '#ccc', margin: 0 }}>Wordle meets Hangman. Retro vibes only.</p>
          <div className="btn-neon" style={{ pointerEvents: 'none' }}>INSERT COIN</div>
        </motion.div>

        {/* Game 2: Music Guess */}
        <motion.div 
          whileHover={{ scale: 1.05, y: -10 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelectGame('music')}
          style={{
            background: 'rgba(255, 255, 0, 0.1)',
            border: '3px solid var(--neon-yellow)',
            borderRadius: '20px',
            padding: '30px',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(255, 255, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}
        >
          <div style={{ padding: '20px', background: 'rgba(255, 255, 0, 0.2)', borderRadius: '50%' }}>
            <Music size={60} color="var(--neon-yellow)" />
          </div>
          <h2 className="retro-text" style={{ margin: 0, fontSize: '2rem' }}>REWIND TUNES</h2>
          <p style={{ color: '#ccc', margin: 0 }}>Guess the hits. 3 songs, 20 seconds.</p>
          <div className="btn-neon" style={{ pointerEvents: 'none', borderColor: 'var(--neon-yellow)', color: 'var(--neon-yellow)' }}>PLAY TRACKS</div>
        </motion.div>

        {/* Game 3: Neon Dodge */}
        <motion.div 
          whileHover={{ scale: 1.05, y: -10 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelectGame('dodge')}
          style={{
            background: 'rgba(0, 255, 255, 0.1)',
            border: '3px solid var(--neon-cyan)',
            borderRadius: '20px',
            padding: '30px',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}
        >
          <div style={{ padding: '20px', background: 'rgba(0, 255, 255, 0.2)', borderRadius: '50%' }}>
            <Zap size={60} color="var(--neon-cyan)" />
          </div>
          <h2 className="retro-text" style={{ margin: 0, fontSize: '2rem' }}>NEON DODGE</h2>
          <p style={{ color: '#ccc', margin: 0 }}>Avoid the glitches. Survive the grid.</p>
          <div className="btn-neon" style={{ pointerEvents: 'none', borderColor: 'var(--neon-cyan)', color: 'var(--neon-cyan)' }}>START MISSION</div>
        </motion.div>
      </div>

      <footer style={{ marginTop: '80px', color: '#666' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px' }} className="retro-text">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={20} /> GLOBAL RANKINGS
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Play size={20} /> V0.97 BETA
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ArcadeHome;
