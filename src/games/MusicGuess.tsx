import React, { useState, useEffect, useRef } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Pause, SkipForward, Music, CheckCircle2, XCircle, Trophy, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DAILY_SONGS, Song } from '../songs';

interface MusicGuessProps {
  onBack: () => void;
}

const MAX_GUESSES = 6;
const UNLOCK_TIMES = [3, 6, 10, 15, 20, 30]; // Seconds unlocked per attempt

const MusicGuess: React.FC<MusicGuessProps> = ({ onBack }) => {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'result'>('playing');
  const [attempts, setAttempts] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [player, setPlayer] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [dailyCompleted, setDailyCompleted] = useState(false);

  const song = DAILY_SONGS[currentSongIndex % DAILY_SONGS.length];

  useEffect(() => {
    const savedStreak = localStorage.getItem('music-streak');
    if (savedStreak) setStreak(parseInt(savedStreak));
  }, []);

  useEffect(() => {
    let interval: any;
    if (isPlaying && player) {
      interval = setInterval(() => {
        const time = player.getCurrentTime() - song.startAt;
        setCurrentTime(time);
        
        if (time >= UNLOCK_TIMES[attempts.length]) {
          pauseMusic();
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, player, attempts.length, song.startAt]);

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    setPlayer(event.target);
  };

  const playMusic = () => {
    if (player) {
      player.seekTo(song.startAt);
      player.playVideo();
      setIsPlaying(true);
    }
  };

  const pauseMusic = () => {
    if (player) {
      player.pauseVideo();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGuess.trim() || gameState !== 'playing') return;

    const guess = currentGuess.toUpperCase().trim();
    const isCorrect = guess === song.title.toUpperCase() || guess === song.artist.toUpperCase();

    const newAttempts = [...attempts, currentGuess];
    setAttempts(newAttempts);
    setCurrentGuess('');

    if (isCorrect) {
      handleWin();
    } else if (newAttempts.length >= MAX_GUESSES) {
      handleLoss();
    }
  };

  const handleWin = () => {
    setGameState('result');
    const newStreak = streak + 1;
    setStreak(newStreak);
    localStorage.setItem('music-streak', newStreak.toString());
    triggerConfetti();
  };

  const handleLoss = () => {
    setGameState('result');
    setStreak(0);
    localStorage.setItem('music-streak', '0');
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00ffff', '#ff00ff', '#ffff00']
    });
  };

  const nextSong = () => {
    if (currentSongIndex >= 2) {
      setDailyCompleted(true);
    } else {
      setCurrentSongIndex(prev => prev + 1);
      setAttempts([]);
      setGameState('playing');
      setDailyCompleted(false);
    }
  };

  const shareResults = () => {
    const icons = attempts.map((_, i) => i === attempts.length - 1 && gameState === 'result' && streak > 0 ? '🟩' : '🟥').join('');
    const text = `🎧 REWIND TUNES
Song ${currentSongIndex + 1}/3
Streak: ${streak}
${icons}
Play now!`;
    if (navigator.share) {
      navigator.share({ text }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
       <button 
        onClick={onBack}
        style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--neon-cyan)', color: 'var(--neon-cyan)', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}
      >
        <ArrowLeft size={24} />
      </button>

      <header style={{ marginBottom: '40px' }}>
        <h1 className="neon-text-cyan retro-text" style={{ fontSize: '2.5rem', marginBottom: '5px' }}>REWIND TUNES</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <span className="retro-text" style={{ color: 'var(--neon-pink)' }}>SONG {currentSongIndex + 1}/3</span>
          <span className="retro-text" style={{ color: 'var(--neon-yellow)' }}>STREAK: {streak}</span>
        </div>
      </header>

      {/* Hidden YouTube Player */}
      <div style={{ display: 'none' }}>
        <YouTube 
          videoId={song.youtubeId} 
          opts={{ playerVars: { start: song.startAt, controls: 0, disablekb: 1 } }} 
          onReady={onPlayerReady} 
        />
      </div>

      {/* Play Progress UI */}
      <div style={{ background: '#1a0b2e', border: '2px solid #3d2b54', borderRadius: '16px', padding: '30px', marginBottom: '30px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={isPlaying ? pauseMusic : playMusic}
            style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--neon-cyan)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 20px rgba(0, 255, 255, 0.4)' }}
          >
            {isPlaying ? <Pause size={40} color="#0d0221" /> : <Play size={40} color="#0d0221" style={{ marginLeft: '5px' }} />}
          </motion.button>
        </div>

        {/* Timeline */}
        <div style={{ height: '12px', background: '#2a1b3d', borderRadius: '6px', position: 'relative', marginBottom: '10px' }}>
            <motion.div 
                style={{ 
                    position: 'absolute', height: '100%', background: 'var(--neon-cyan)', borderRadius: '6px', 
                    width: `${(currentTime / 30) * 100}%`,
                    boxShadow: '0 0 10px var(--neon-cyan)'
                }} 
            />
            {/* Markers for unlocked segments */}
            {UNLOCK_TIMES.map((time, i) => (
                <div key={i} style={{ position: 'absolute', left: `${(time / 30) * 100}%`, top: 0, bottom: 0, width: '2px', background: i < attempts.length ? 'transparent' : '#3d2b54' }} />
            ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '0.8rem' }} className="retro-text">
            <span>0s</span>
            <span>{UNLOCK_TIMES[attempts.length] || 30}s UNLOCKED</span>
            <span>30s</span>
        </div>
      </div>

      {/* Attempts Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '30px' }}>
        {[...Array(MAX_GUESSES)].map((_, i) => (
          <div key={i} style={{ height: '45px', border: '1px solid #3d2b54', borderRadius: '8px', display: 'flex', alignItems: 'center', padding: '0 15px', background: i < attempts.length ? 'rgba(255,255,255,0.05)' : 'transparent', color: i < attempts.length ? '#fff' : '#444' }}>
            {attempts[i] ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attempts[i]}</span>
                {i === attempts.length - 1 && gameState === 'result' && streak > 0 ? <CheckCircle2 size={18} color="var(--key-correct)" /> : <XCircle size={18} color="#ff4444" />}
              </div>
            ) : (
              <span style={{ opacity: 0.3 }}>Attempt {i + 1}...</span>
            )}
          </div>
        ))}
      </div>

      {/* Input Area */}
      {gameState === 'playing' ? (
        <form onSubmit={handleGuess} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Artist or Song Title..." 
            value={currentGuess}
            onChange={(e) => setCurrentGuess(e.target.value)}
            style={{ flex: 1, background: '#2a1b3d', border: '2px solid #3d2b54', borderRadius: '8px', padding: '12px 15px', color: 'white', outline: 'none' }}
          />
          <button type="submit" className="btn-neon" style={{ margin: 0, padding: '0 20px' }}>GUESS</button>
        </form>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
           <div style={{ background: 'rgba(0,255,255,0.1)', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--neon-cyan)' }}>
              <div className="retro-text" style={{ fontSize: '0.9rem', color: 'var(--neon-cyan)', marginBottom: '5px' }}>THE SONG WAS</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{song.title}</div>
              <div style={{ color: '#aaa' }}>{song.artist}</div>
           </div>
           <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={nextSong} className="btn-neon" style={{ flex: 1 }}>{currentSongIndex < 2 ? 'NEXT SONG' : 'FINISH'}</button>
                <button onClick={shareResults} className="btn-neon" style={{ borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)' }}><Share2 size={20} /></button>
           </div>
        </motion.div>
      )}

      {/* Final Results Modal */}
      <AnimatePresence>
        {dailyCompleted && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <motion.div className="modal-content">
                    <Trophy size={60} color="var(--neon-yellow)" style={{ marginBottom: '20px' }} />
                    <h2 className="retro-text neon-text-cyan" style={{ fontSize: '2.5rem' }}>SET COMPLETE</h2>
                    <p style={{ margin: '20px 0', fontSize: '1.2rem' }}>You finished today's tracks!</p>
                    <div className="retro-text" style={{ fontSize: '1.5rem', color: 'var(--neon-pink)' }}>STREAK: {streak}</div>
                    <button onClick={onBack} className="btn-neon">BACK TO ARCADE</button>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MusicGuess;
