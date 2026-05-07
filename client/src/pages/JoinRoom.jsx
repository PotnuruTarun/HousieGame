import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Play } from 'lucide-react';

/**
 * Shown when a player opens a share link like /room/TDKUNS directly.
 * They only need to enter their name — the room code is already in the URL.
 */
export default function JoinRoom({ socket, setPlayerName }) {
  const { roomId } = useParams();
  const [name, setName] = useState('');
  const hasName = name.trim().length > 0;

  const handleJoin = () => {
    if (!hasName) return;
    setPlayerName(name.trim());
    socket.emit('join_room', { roomId, playerName: name.trim() });
  };

  return (
    <div style={{
      position: 'relative', width: '100%', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 0%, #2d1b69 0%, #0d0b1e 65%)',
      fontFamily: "'Outfit', sans-serif", overflow: 'hidden', padding: 24,
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(108,78,245,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ position: 'relative', zIndex: 10, textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 100,
          background: 'rgba(108,78,245,0.15)', border: '1px solid rgba(108,78,245,0.35)',
          fontSize: '0.78rem', fontWeight: 700, color: '#a78bfa',
          letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16,
        }}>
          You're invited to room <span style={{ color: '#fff', letterSpacing: '0.2em' }}>{roomId}</span>
        </div>
        <h1 style={{
          fontSize: 'clamp(42px,8vw,72px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1,
          background: 'linear-gradient(90deg,#a78bfa,#f472b6,#fbbf24,#a78bfa)',
          backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          animation: 'shimmer 4s linear infinite',
        }}>
          TAMBOLA
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', marginTop: 8, fontWeight: 500 }}>
          Enter your name to join the game
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
        style={{
          width: '100%', maxWidth: 380, padding: '32px 28px', zIndex: 10,
          background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22,
          boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
        }}>

        <div style={{ position: 'relative', marginBottom: 14 }}>
          <User size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.45)', pointerEvents: 'none' }} />
          <input
            autoFocus
            className="lobby-input"
            placeholder="Your Name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            style={{ paddingLeft: 44 }}
          />
        </div>

        <button
          onClick={handleJoin}
          disabled={!hasName}
          style={{
            width: '100%', padding: '13px', borderRadius: 11, border: 'none', cursor: hasName ? 'pointer' : 'not-allowed',
            background: hasName ? 'linear-gradient(135deg,#6c4ef5,#4f35d2)' : 'rgba(255,255,255,0.08)',
            color: 'white', fontFamily: 'inherit', fontWeight: 700, fontSize: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: hasName ? '0 0 22px rgba(108,78,245,0.45)' : 'none',
            opacity: hasName ? 1 : 0.5, transition: 'all 0.25s',
          }}>
          <Play size={16} fill="white" /> Join Room {roomId}
        </button>
      </motion.div>

      <style>{`
        @keyframes shimmer { to { background-position: 200% center; } }
      `}</style>
    </div>
  );
}
