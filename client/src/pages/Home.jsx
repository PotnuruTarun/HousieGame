import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Plus, User, Hash } from 'lucide-react';

/* ── Floating ball data ── */
const BALLS = [
  { num: 88, size: 100, top: '4%', left: '2%', duration: 5.2 },
  { num: 36, size: 90, top: '2%', left: '52%', duration: 6.1 },
  { num: 51, size: 60, top: '3%', right: '8%', duration: 4.8 },
  { num: 90, size: 110, top: '8%', right: '1%', duration: 7.0 },
  { num: 14, size: 95, top: '38%', left: '3%', duration: 5.7 },
  { num: 73, size: 80, top: '22%', right: '5%', duration: 6.4 },
  { num: 42, size: 55, top: '18%', right: '22%', duration: 5.0 },
  { num: 68, size: 70, top: '55%', right: '4%', duration: 6.8 },
  { num: 7, size: 120, bottom: '4%', left: '1%', duration: 7.3 },
  { num: 57, size: 90, bottom: '2%', left: '35%', duration: 5.5 },
  { num: 73, size: 85, bottom: '5%', right: '12%', duration: 6.2 },
  { num: 29, size: 75, top: '14%', left: '25%', duration: 4.6 },
  { num: 90, size: 100, bottom: '8%', right: '1%', duration: 7.1 },
];

const FloatingBall = ({ num, size, duration, style }) => (
  <div
    className="ball"
    style={{
      width: size,
      height: size,
      fontSize: size * 0.28,
      animationDuration: `${duration}s`,
      ...style,
    }}
  >
    {num}
  </div>
);

const genRoomId = () =>
  Math.random().toString(36).substring(2, 5).toUpperCase() +
  Math.random().toString(36).substring(2, 5).toUpperCase();

export default function Home({ socket, setPlayerName }) {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [createdId, setCreatedId] = useState('');   // shown after create
  const [copied, setCopied] = useState(false);

  const hasName = name.trim().length > 0;
  const canJoin = hasName && roomId.trim().length > 0;

  const handleCreate = () => {
    if (!hasName) return;
    const id = genRoomId();
    setCreatedId(id);
    setPlayerName(name.trim());
    socket.emit('create_room', { roomId: id, playerName: name.trim() });
  };

  const handleJoin = () => {
    if (!canJoin) return;
    setPlayerName(name.trim());
    socket.emit('join_room', { roomId: roomId.trim().toUpperCase(), playerName: name.trim() });
  };

  const copyId = () => {
    navigator.clipboard.writeText(createdId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 0%, #2d1b69 0%, #0d0b1e 65%)',
        overflow: 'hidden',
      }}
    >
      {/* Centre purple glow */}
      <div style={{
        position: 'absolute',
        left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 700, height: 700,
        background: 'radial-gradient(circle, rgba(108,78,245,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Floating Balls */}
      {BALLS.map((b, i) => {
        const { num, size, duration, top, left, right, bottom } = b;
        const style = {};
        if (top !== undefined) style.top = top;
        if (left !== undefined) style.left = left;
        if (right !== undefined) style.right = right;
        if (bottom !== undefined) style.bottom = bottom;
        return <FloatingBall key={i} num={num} size={size} duration={duration} style={style} />;
      })}

      {/* ── TITLE ── */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        style={{ position: 'relative', zIndex: 10, textAlign: 'center', marginBottom: 8 }}
      >
        <h1 style={{
          fontSize: 'clamp(60px, 10vw, 100px)',
          fontWeight: 900,
          letterSpacing: '-3px',
          lineHeight: 1,
          background: 'linear-gradient(90deg, #a78bfa, #f472b6, #fbbf24, #a78bfa)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'titleShimmer 4s linear infinite',
        }}>
          TAMBOLA
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.95)', fontSize: '0.95rem', fontWeight: 700, marginTop: 8, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          Real-time Multiplayer Housie
        </p>
      </motion.div>

      {/* ── LOBBY CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="lobby-card"
        style={{
          width: '100%',
          maxWidth: 420,
          padding: '36px 32px',
          position: 'relative',
          zIndex: 10,
          marginTop: 32,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* 1. Your Name */}
          <div style={{ position: 'relative' }}>
            <User size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.9)', pointerEvents: 'none' }} />
            <input
              className="lobby-input"
              placeholder="Your Name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>

          {/* 2. Create Room */}
          <button
            className="btn-create"
            style={{ width: '100%', opacity: hasName ? 1 : 0.45 }}
            onClick={handleCreate}
            disabled={!hasName}
          >
            <Plus size={18} /> Create Room
          </button>

          {/* Generated Room ID badge */}
          {createdId && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(108,78,245,0.18)',
                border: '1px solid rgba(108,78,245,0.4)',
                borderRadius: 10, padding: '10px 16px',
              }}
            >
              <div>
                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Room Created!</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.2em', color: '#a78bfa' }}>{createdId}</p>
              </div>
              <button
                onClick={copyId}
                style={{
                  background: 'rgba(108,78,245,0.3)', border: '1px solid rgba(108,78,245,0.5)',
                  color: 'white', borderRadius: 8, padding: '6px 14px',
                  fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {copied ? '✓ Copied' : 'Copy ID'}
              </button>
            </motion.div>
          )}

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em' }}>OR JOIN</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* 3. Room ID + Join Room — same line */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Hash size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.9)', pointerEvents: 'none' }} />
              <input
                className="lobby-input"
                placeholder="Room Code"
                value={roomId}
                onChange={e => setRoomId(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                maxLength={6}
              />
            </div>
            <button
              className="btn-join"
              style={{ whiteSpace: 'nowrap', flexShrink: 0, padding: '14px 20px', opacity: canJoin ? 1 : 0.45 }}
              onClick={handleJoin}
              disabled={!canJoin}
            >
              <Play size={16} fill="white" /> Join
            </button>
          </div>

        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.7rem', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Private rooms · Real-time sync · Instant prizes
        </p>

      </motion.div>

      {/* Shimmer keyframe */}
      <style>{`
        @keyframes titleShimmer {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
}
