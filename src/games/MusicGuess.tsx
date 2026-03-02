import React, { useState, useEffect, useRef } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Pause, Music, CheckCircle2, XCircle, Trophy, Share2, Loader2, Clock, SkipForward, Mic, Heart, HeartCrack } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DAILY_SONGS, Song } from '../songs';

interface MusicGuessProps {
  onBack: () => void;
}

const MAX_GUESSES = 6;
const MAX_LIVES = 2;
const UNLOCK_TIMES = [5, 10, 20, 35, 50, 60]; 

const START_DATE = new Date('2026-02-27T00:00:00Z').getTime();

const MusicGuess: React.FC<MusicGuessProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'playing' | 'result'>('playing');
  const [attempts, setAttempts] = useState<string[]>([]);
  const [lives, setLives] = useState(MAX_LIVES);
  const [currentGuess, setCurrentGuess] = useState('');
  const [revealedLetters, setRevealedLetters] = useState<Set<string>>(new Set([' ', '-', "'", '.', '&']));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [streak, setStreak] = useState(0);

  const playerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const isActuallyPlaying = useRef(false); // Ref to avoid state-lag bug
  
  // Calculate day seed and song
  const now = new Date();
  const daySeed = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayNumber = Math.floor((todayStart - START_DATE) / (24 * 60 * 60 * 1000));
  
  const getIndex = (day: number, total: number) => (day * 13 + 7) % total;
  const songIndex = getIndex(dayNumber, DAILY_SONGS.length);
  const song = DAILY_SONGS[songIndex];

  // Load persistence
  useEffect(() => {
    const savedStreak = localStorage.getItem('music-streak') || '0';
    setStreak(parseInt(savedStreak));

    const lastPlayedSeed = localStorage.getItem('music-last-played');
    if (lastPlayedSeed === daySeed) {
      const savedAttempts = JSON.parse(localStorage.getItem('music-daily-attempts') || '[]');
      const savedLives = parseInt(localStorage.getItem('music-daily-lives') || MAX_LIVES.toString());
      const savedState = localStorage.getItem('music-daily-state') as 'playing' | 'result';
      const savedLetters = JSON.parse(localStorage.getItem('music-daily-letters') || '[]');
      
      setAttempts(savedAttempts);
      setLives(savedLives);
      setGameState(savedState || 'playing');
      if (savedLetters.length > 0) {
        setRevealedLetters(new Set([...Array.from(revealedLetters), ...savedLetters]));
      }
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
    playerRef.current.pauseVideo();
  };

  const playMusic = () => {
    if (!playerRef.current || !isPlayerReady) return;

    isActuallyPlaying.current = true;
    setIsPlaying(true);
    
    playerRef.current.seekTo(song.startAt, true);
    playerRef.current.playVideo();

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const pTime = playerRef.current.getCurrentTime();
      const elapsed = Math.max(0, pTime - song.startAt);
      setCurrentTime(elapsed);
      
      if (elapsed >= UNLOCK_TIMES[attempts.length]) {
        pauseMusic();
      }
    }, 50);
  };

  const pauseMusic = () => {
    if (playerRef.current) {
      isActuallyPlaying.current = false;
      playerRef.current.pauseVideo();
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setTimeout(() => {
          if (!isActuallyPlaying.current) setCurrentTime(0);
      }, 300);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Voice input not supported.");
    const recognition = new SpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: any) => setCurrentGuess(e.results[0][0].transcript);
    recognition.start();
  };

  const handleGuess = (e?: React.FormEvent, isSkip = false) => {
    if (e) e.preventDefault();
    if (gameState !== 'playing') return;

    const guessStr = isSkip ? "" : currentGuess.toUpperCase().trim();
    if (!isSkip && !guessStr) return;

    const isCorrect = !isSkip && (guessStr === song.title.toUpperCase() || guessStr === song.artist.toUpperCase());
    const newAttempts = [...attempts, isSkip ? "SKIPPED" : currentGuess];
    
    let newLives = lives;
    const newRevealed = new Set(revealedLetters);

    if (!isSkip) {
      const fullAnswer = (song.title + song.artist).toUpperCase();
      guessStr.split('').forEach(char => {
        if (fullAnswer.includes(char)) newRevealed.add(char);
      });
      if (!isCorrect) newLives = Math.max(0, lives - 1);
    }

    setAttempts(newAttempts);
    setLives(newLives);
    setRevealedLetters(newRevealed);
    setCurrentGuess('');

    localStorage.setItem('music-last-played', daySeed);
    localStorage.setItem('music-daily-attempts', JSON.stringify(newAttempts));
    localStorage.setItem('music-daily-lives', newLives.toString());
    localStorage.setItem('music-daily-letters', JSON.stringify(Array.from(newRevealed)));

    if (isCorrect) {
      handleWin();
    } else if (newLives === 0 || newAttempts.length >= MAX_GUESSES) {
      handleLoss();
    }
  };

  const handleWin = () => {
    setGameState('result');
    localStorage.setItem('music-daily-state', 'result');
    const newStreak = streak + 1;
    setStreak(newStreak);
    localStorage.setItem('music-streak', newStreak.toString());
    
    const allChars = (song.title + song.artist).toUpperCase().split('');
    setRevealedLetters(new Set([...Array.from(revealedLetters), ...allChars]));
    triggerConfetti();
    pauseMusic();
  };

  const handleLoss = () => {
    setGameState('result');
    localStorage.setItem('music-daily-state', 'result');
    setStreak(0);
    localStorage.setItem('music-streak', '0');
    
    const allChars = (song.title + song.artist).toUpperCase().split('');
    setRevealedLetters(new Set([...Array.from(revealedLetters), ...allChars]));
    pauseMusic();
  };

  const triggerConfetti = () => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#00ffff', '#ff00ff', '#ffff00'] });
  };

  const shareResults = () => {
    const isWin = attempts.some(a => a && (a.toUpperCase() === song.title.toUpperCase() || a.toUpperCase() === song.artist.toUpperCase()));
    const scoreText = isWin ? `${attempts.filter(a => a !== 'SKIPPED').length}/${MAX_GUESSES}` : 'X/6';
    const icons = attempts.map(a => (a && (a.toUpperCase() === song.title.toUpperCase() || a.toUpperCase() === song.artist.toUpperCase())) ? '🟩' : '🟥').join('');
    const text = `🎧 REWIND TUNES\nScore: ${scoreText}\nStreak: ${streak}\n${icons}\nPlay now!`;
    if (navigator.share) navigator.share({ text }).catch(console.error);
    else { navigator.clipboard.writeText(text); alert('Copied!'); }
  };

  const renderBlanks = (text: string) => {
    return text.split('').map((char, i) => {
      const isSpace = char === ' ';
      const isRevealed = revealedLetters.has(char.toUpperCase()) || isSpace;
      return (
        <span key={i} style={{ 
          display: 'inline-block', width: isSpace ? '10px' : '20px', margin: '0 2px',
          borderBottom: isSpace ? 'none' : '2px solid var(--neon-cyan)', fontSize: '1.2rem',
          fontWeight: 'bold', color: isRevealed ? 'white' : 'transparent', textTransform: 'uppercase'
        }}>
          {isRevealed ? char : '_'}
        </span>
      );
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
       <button onClick={onBack} style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--neon-cyan)', color: 'var(--neon-cyan)', padding: '8px', borderRadius: '50%', cursor: 'pointer', zIndex: 100 }}>
        <ArrowLeft size={24} />
      </button>

      <header style={{ marginBottom: '30px' }}>
        <h1 className="neon-text-cyan retro-text" style={{ fontSize: '2.5rem', marginBottom: '5px' }}>REWIND TUNES</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[...Array(MAX_LIVES)].map((_, i) => (
              <motion.div key={i} animate={{ scale: i < lives ? 1 : 0.8, opacity: i < lives ? 1 : 0.3 }}>
                {i < lives ? <Heart size={24} color="var(--neon-pink)" fill="var(--neon-pink)" /> : <HeartCrack size={24} color="#4a3b5c" />}
              </motion.div>
            ))}
          </div>
          <span className="retro-text" style={{ color: 'var(--neon-yellow)' }}>STREAK: {streak}</span>
        </div>
      </header>

      <div style={{ marginBottom: '25px', padding: '15px', background: 'rgba(0,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(0,255,255,0.1)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--neon-cyan)', marginBottom: '5px' }} className="retro-text">TITLE</div>
          <div style={{ marginBottom: '15px', minHeight: '30px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>{renderBlanks(song.title)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--neon-cyan)', marginBottom: '5px' }} className="retro-text">ARTIST</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>{renderBlanks(song.artist)}</div>
      </div>

      <div style={{ display: 'none' }}>
        <YouTube 
          key={song.id} videoId={song.youtubeId} 
          opts={{ playerVars: { start: song.startAt, controls: 0, disablekb: 1, modestbranding: 1, autoplay: 0 } }} 
          onReady={onPlayerReady} 
          onStateChange={(e) => {
            if (e.data === 1 && !isActuallyPlaying.current) playerRef.current.pauseVideo();
            if (e.data === 0) setIsPlaying(false);
          }}
        />
      </div>

      <div style={{ background: '#1a0b2e', border: '2px solid #3d2b54', borderRadius: '16px', padding: '20px', marginBottom: '25px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
          <motion.button
            whileHover={{ scale: isPlayerReady ? 1.1 : 1 }} whileTap={{ scale: isPlayerReady ? 0.9 : 1 }}
            onClick={isPlaying ? pauseMusic : playMusic} disabled={!isPlayerReady}
            style={{ 
              width: '70px', height: '70px', borderRadius: '50%', background: isPlayerReady ? 'var(--neon-cyan)' : '#3d2b54', 
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isPlayerReady ? 'pointer' : 'wait'
            }}
          >
            {!isPlayerReady ? <Loader2 size={35} className="animate-spin" /> : isPlaying ? <Pause size={35} color="#0d0221" /> : <Play size={35} color="#0d0221" style={{ marginLeft: '5px' }} />}
          </motion.button>
        </div>
        <div style={{ height: '8px', background: '#2a1b3d', borderRadius: '4px', position: 'relative', marginBottom: '10px' }}>
            <motion.div style={{ position: 'absolute', height: '100%', background: 'var(--neon-cyan)', borderRadius: '4px', width: `${(currentTime / 60) * 100}%` }} />
            {UNLOCK_TIMES.map((time, i) => <div key={i} style={{ position: 'absolute', left: `${(time / 60) * 100}%`, top: 0, bottom: 0, width: '2px', background: i < attempts.length ? 'transparent' : '#3d2b54' }} />)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '0.7rem' }} className="retro-text">
            <span>0s</span><span>{UNLOCK_TIMES[attempts.length] || 60}s UNLOCKED</span><span>60s</span>
        </div>
      </div>

      {gameState === 'playing' && (
        <div style={{ marginBottom: '20px' }}>
            <form onSubmit={handleGuess} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input type="text" placeholder="Song or Artist..." value={currentGuess} onChange={(e) => setCurrentGuess(e.target.value)} style={{ flex: 1, background: '#2a1b3d', border: '2px solid #3d2b54', borderRadius: '8px', padding: '10px', color: 'white', outline: 'none' }} />
                <button type="button" onClick={startListening} style={{ background: isListening ? 'var(--neon-pink)' : '#2a1b3d', border: '2px solid #3d2b54', borderRadius: '8px', padding: '0 10px', color: 'white' }}>
                    <Mic size={18} className={isListening ? "animate-pulse" : ""} />
                </button>
                <button type="submit" className="btn-neon" style={{ margin: 0, padding: '0 15px', fontSize: '0.9rem' }}>GUESS</button>
            </form>
            <button onClick={() => handleGuess(undefined, true)} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid #3d2b54', borderRadius: '8px', color: '#888', cursor: 'pointer', fontSize: '0.8rem' }}>SKIP TO NEXT CLUE</button>
        </div>
      )}

      <AnimatePresence>
        {attempts.length >= 2 && (
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} style={{ marginBottom: '20px', fontSize: '1.8rem', letterSpacing: '6px', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '12px', border: '1px dashed var(--neon-yellow)' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--neon-yellow)', marginBottom: '3px' }} className="retro-text">EMOJI HINT</div>
            {song.emojis}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
        {[...Array(MAX_GUESSES)].map((_, i) => (
          <div key={i} style={{ height: '35px', border: '1px solid #3d2b54', borderRadius: '6px', display: 'flex', alignItems: 'center', padding: '0 12px', background: attempts[i] ? 'rgba(255,255,255,0.05)' : 'transparent', color: attempts[i] ? '#fff' : '#444', fontSize: '0.8rem' }}>
            {attempts[i] ? <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attempts[i]}</span>
                {(attempts[i] !== 'SKIPPED' && (attempts[i].toUpperCase() === song.title.toUpperCase() || attempts[i].toUpperCase() === song.artist.toUpperCase())) ? <CheckCircle2 size={14} color="var(--key-correct)" /> : <XCircle size={14} color="#ff4444" />}
              </div> : <span style={{ opacity: 0.3 }}>Attempt {i + 1}...</span>}
          </div>
        ))}
      </div>

      {gameState === 'result' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 'auto', paddingBottom: '20px' }}>
           <div style={{ background: 'rgba(0,255,255,0.1)', padding: '15px', borderRadius: '12px', marginBottom: '15px', border: '1px solid var(--neon-cyan)' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{song.emojis}</div>
              <div className="retro-text" style={{ fontSize: '0.8rem', color: 'var(--neon-cyan)', marginBottom: '3px' }}>TODAY'S SONG</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{song.title}</div>
              <div style={{ color: '#aaa', fontSize: '0.9rem' }}>{song.artist}</div>
           </div>
           <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={onBack} className="btn-neon" style={{ flex: 1, fontSize: '1rem' }}>ARCADE</button>
                <button onClick={shareResults} className="btn-neon" style={{ borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)', fontSize: '1rem' }}><Share2 size={18} /></button>
           </div>
           <div style={{ marginTop: '15px', color: '#666', fontSize: '0.8rem' }} className="retro-text"><Clock size={12} style={{ display: 'inline', marginRight: '5px' }} />NEXT SONG TOMORROW</div>
        </motion.div>
      )}
    </div>
  );
};

export default MusicGuess;
