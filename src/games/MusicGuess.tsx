import React, { useState, useEffect, useRef } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Pause, Music, CheckCircle2, XCircle, Trophy, Share2, Loader2, Clock, SkipForward, Mic } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DAILY_SONGS, Song } from '../songs';

interface MusicGuessProps {
  onBack: () => void;
}

const MAX_GUESSES = 6;
const UNLOCK_TIMES = [5, 10, 20, 35, 50, 60]; 

const getDailySeed = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
};

const MusicGuess: React.FC<MusicGuessProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'playing' | 'result'>('playing');
  const [attempts, setAttempts] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [streak, setStreak] = useState(0);

  const playerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  
  const daySeed = getDailySeed();
  const dateNum = parseInt(daySeed.replace(/-/g, ''));
  const songIndex = dateNum % DAILY_SONGS.length;
  const song = DAILY_SONGS[songIndex];

  useEffect(() => {
    const savedStreak = localStorage.getItem('music-streak') || '0';
    setStreak(parseInt(savedStreak));

    const lastPlayedSeed = localStorage.getItem('music-last-played');
    if (lastPlayedSeed === daySeed) {
      const savedAttempts = JSON.parse(localStorage.getItem('music-daily-attempts') || '[]');
      const savedState = localStorage.getItem('music-daily-state') as 'playing' | 'result';
      setAttempts(savedAttempts);
      setGameState(savedState || 'playing');
    }
  }, [daySeed]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    setIsPlayerReady(true);
    playerRef.current.seekTo(song.startAt);
  };

  const playMusic = () => {
    if (playerRef.current && isPlayerReady) {
      playerRef.current.seekTo(song.startAt);
      playerRef.current.playVideo();
      setIsPlaying(true);

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        const playerTime = playerRef.current.getCurrentTime();
        const elapsed = Math.max(0, playerTime - song.startAt);
        setCurrentTime(elapsed);
        if (elapsed >= UNLOCK_TIMES[attempts.length]) {
          pauseMusic();
        }
      }, 50);
    }
  };

  const pauseMusic = () => {
    if (playerRef.current) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
      setTimeout(() => {
          if (!isPlaying) setCurrentTime(0);
      }, 500);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setCurrentGuess(transcript);
    };

    recognition.start();
  };

  const handleGuess = (e?: React.FormEvent, isSkip = false) => {
    if (e) e.preventDefault();
    if (gameState !== 'playing') return;

    const guess = isSkip ? "SKIPPED" : currentGuess.toUpperCase().trim();
    if (!isSkip && !guess) return;

    const isCorrect = !isSkip && (guess === song.title.toUpperCase() || guess === song.artist.toUpperCase());
    const newAttempts = [...attempts, isSkip ? "" : currentGuess];
    
    setAttempts(newAttempts);
    setCurrentGuess('');

    localStorage.setItem('music-last-played', daySeed);
    localStorage.setItem('music-daily-attempts', JSON.stringify(newAttempts));

    if (isCorrect) {
      handleWin(newAttempts);
    } else if (newAttempts.length >= MAX_GUESSES) {
      handleLoss(newAttempts);
    } else {
        localStorage.setItem('music-daily-state', 'playing');
    }
  };

  const handleWin = (finalAttempts: string[]) => {
    setGameState('result');
    localStorage.setItem('music-daily-state', 'result');
    const newStreak = streak + 1;
    setStreak(newStreak);
    localStorage.setItem('music-streak', newStreak.toString());
    triggerConfetti();
    pauseMusic();
  };

  const handleLoss = (finalAttempts: string[]) => {
    setGameState('result');
    localStorage.setItem('music-daily-state', 'result');
    setStreak(0);
    localStorage.setItem('music-streak', '0');
    pauseMusic();
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00ffff', '#ff00ff', '#ffff00']
    });
  };

  const shareResults = () => {
    const isWin = attempts.some(a => a && (a.toUpperCase() === song.title.toUpperCase() || a.toUpperCase() === song.artist.toUpperCase()));
    const scoreText = isWin ? `${attempts.filter(a => a).length}/${MAX_GUESSES}` : 'X/6';
    const icons = attempts.map(a => (a && (a.toUpperCase() === song.title.toUpperCase() || a.toUpperCase() === song.artist.toUpperCase())) ? '🟩' : '🟥').join('');
    const text = `🎧 REWIND TUNES\nDaily Song\nScore: ${scoreText}\nStreak: ${streak}\n${icons}\nPlay now!`;
    
    if (navigator.share) {
      navigator.share({ text }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
       <button 
        onClick={onBack}
        style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--neon-cyan)', color: 'var(--neon-cyan)', padding: '8px', borderRadius: '50%', cursor: 'pointer', zIndex: 100 }}
      >
        <ArrowLeft size={24} />
      </button>

      <header style={{ marginBottom: '40px' }}>
        <h1 className="neon-text-cyan retro-text" style={{ fontSize: '2.5rem', marginBottom: '5px' }}>REWIND TUNES</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <span className="retro-text" style={{ color: 'var(--neon-pink)' }}>DAILY TRACK</span>
          <span className="retro-text" style={{ color: 'var(--neon-yellow)' }}>STREAK: {streak}</span>
        </div>
      </header>

      {/* Hidden YouTube Player */}
      <div style={{ display: 'none' }}>
        <YouTube 
          key={song.id}
          videoId={song.youtubeId} 
          opts={{ playerVars: { start: song.startAt, controls: 0, disablekb: 1, modestbranding: 1, autoplay: 0 } }} 
          onReady={onPlayerReady} 
          onStateChange={(e) => {
            if (e.data === 0) pauseMusic();
          }}
        />
      </div>

      {/* Play Progress UI */}
      <div style={{ background: '#1a0b2e', border: '2px solid #3d2b54', borderRadius: '16px', padding: '30px', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <motion.button
            whileHover={{ scale: isPlayerReady ? 1.1 : 1 }}
            whileTap={{ scale: isPlayerReady ? 0.9 : 1 }}
            onClick={isPlaying ? pauseMusic : playMusic}
            disabled={!isPlayerReady}
            style={{ 
              width: '80px', height: '80px', borderRadius: '50%', 
              background: isPlayerReady ? 'var(--neon-cyan)' : '#3d2b54', 
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              cursor: isPlayerReady ? 'pointer' : 'wait', 
              boxShadow: isPlayerReady ? '0 0 20px rgba(0, 255, 255, 0.4)' : 'none' 
            }}
          >
            {!isPlayerReady ? (
              <Loader2 size={40} color="#888" className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={40} color="#0d0221" />
            ) : (
              <Play size={40} color="#0d0221" style={{ marginLeft: '5px' }} />
            )}
          </motion.button>
        </div>

        {/* Timeline */}
        <div style={{ height: '12px', background: '#2a1b3d', borderRadius: '6px', position: 'relative', marginBottom: '10px' }}>
            <motion.div 
                style={{ 
                    position: 'absolute', height: '100%', background: 'var(--neon-cyan)', borderRadius: '6px', 
                    width: `${(currentTime / 60) * 100}%`,
                    boxShadow: '0 0 10px var(--neon-cyan)'
                }} 
            />
            {/* Markers for unlocked segments */}
            {UNLOCK_TIMES.map((time, i) => (
                <div key={i} style={{ position: 'absolute', left: `${(time / 60) * 100}%`, top: 0, bottom: 0, width: '2px', background: i < attempts.length ? 'transparent' : '#3d2b54' }} />
            ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '0.8rem' }} className="retro-text">
            <span>0s</span>
            <span>{UNLOCK_TIMES[attempts.length] || 60}s UNLOCKED</span>
            <span>60s</span>
        </div>
      </div>

      {/* Input Area (Directly below player) */}
      {gameState === 'playing' && (
        <div style={{ marginBottom: '30px' }}>
            <form onSubmit={handleGuess} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input 
                    type="text" 
                    placeholder="Artist or Song Title..." 
                    value={currentGuess}
                    onChange={(e) => setCurrentGuess(e.target.value)}
                    style={{ flex: 1, background: '#2a1b3d', border: '2px solid #3d2b54', borderRadius: '8px', padding: '12px 15px', color: 'white', outline: 'none' }}
                />
                <button 
                    type="button" 
                    onClick={startListening}
                    style={{ background: isListening ? 'var(--neon-pink)' : '#2a1b3d', border: '2px solid #3d2b54', borderRadius: '8px', padding: '0 12px', color: 'white', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    <Mic size={20} className={isListening ? "animate-pulse" : ""} />
                </button>
                <button type="submit" className="btn-neon" style={{ margin: 0, padding: '0 15px', fontSize: '1rem' }}>GUESS</button>
            </form>
            <button 
                onClick={() => handleGuess(undefined, true)}
                style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid #3d2b54', borderRadius: '8px', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}
            >
                <SkipForward size={18} /> SKIP TO NEXT CLUE
            </button>
        </div>
      )}

      {/* Emoji Hint */}
      <AnimatePresence>
        {attempts.length >= 2 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ marginBottom: '20px', fontSize: '2rem', letterSpacing: '8px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '12px', border: '1px dashed var(--neon-yellow)' }}
          >
            <div style={{ fontSize: '0.7rem', color: 'var(--neon-yellow)', marginBottom: '5px' }} className="retro-text">EMOJI HINT</div>
            {song.emojis}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attempts Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '30px' }}>
        {[...Array(MAX_GUESSES)].map((_, i) => (
          <div key={i} style={{ height: '45px', border: '1px solid #3d2b54', borderRadius: '8px', display: 'flex', alignItems: 'center', padding: '0 15px', background: i < attempts.length ? 'rgba(255,255,255,0.05)' : 'transparent', color: i < attempts.length ? '#fff' : '#444' }}>
            {attempts[i] !== undefined ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attempts[i] || 'SKIPPED'}</span>
                {(attempts[i] && (attempts[i].toUpperCase() === song.title.toUpperCase() || attempts[i].toUpperCase() === song.artist.toUpperCase())) ? <CheckCircle2 size={18} color="var(--key-correct)" /> : <XCircle size={18} color="#ff4444" />}
              </div>
            ) : (
              <span style={{ opacity: 0.3 }}>Attempt {i + 1}...</span>
            )}
          </div>
        ))}
      </div>

      {/* Result Area */}
      {gameState === 'result' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 'auto', paddingBottom: '20px' }}>
           <div style={{ background: 'rgba(0,255,255,0.1)', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--neon-cyan)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>{song.emojis}</div>
              <div className="retro-text" style={{ fontSize: '0.9rem', color: 'var(--neon-cyan)', marginBottom: '5px' }}>TODAY'S SONG</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{song.title}</div>
              <div style={{ color: '#aaa' }}>{song.artist}</div>
           </div>
           <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={onBack} className="btn-neon" style={{ flex: 1 }}>BACK TO ARCADE</button>
                <button onClick={shareResults} className="btn-neon" style={{ borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)' }}><Share2 size={20} /></button>
           </div>
           <div style={{ marginTop: '20px', color: '#666', fontSize: '0.9rem' }} className="retro-text">
              <Clock size={14} style={{ display: 'inline', marginRight: '5px' }} />
              NEXT SONG TOMORROW
           </div>
        </motion.div>
      )}
    </div>
  );
};

export default MusicGuess;
