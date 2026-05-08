import React, { useState, useEffect, useRef } from 'react';
import Ticket from '../components/Ticket';
import { generateTicket } from '../utils/tambola';
import { Trophy, Play, ChevronRight, LogOut, Share2, Crown, Send, MessageCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

const CLAIMS = [
  { key: 'jaldi5', label: 'Jaldi 5', emoji: '5️⃣' },
  { key: 'topRow', label: 'Top Row', emoji: '⬆️' },
  { key: 'middleRow', label: 'Middle Row', emoji: '↔️' },
  { key: 'bottomRow', label: 'Last Row', emoji: '⬇️' },
  { key: 'fullHousie', label: 'Full Housie', emoji: '🏠', featured: true },
];

const G = {
  bg: 'radial-gradient(ellipse at 50% 0%, #2d1b69 0%, #0d0b1e 65%)',
  glass: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' },
  font: "'Outfit', sans-serif",
};

export default function Game({ socket, roomData, playerName, isHost, setIsHost }) {
  const [ticket] = useState(generateTicket());
  const [calledNums, setCalledNums] = useState(roomData?.calledNumbers || []);
  const [players, setPlayers] = useState(roomData?.players || []);
  const [gameStarted, setStarted] = useState(roomData?.gameStarted || false);
  const [claims, setClaims] = useState([]);
  const [claimedPrizes, setClaimedPrizes] = useState(new Set(roomData?.claimedPrizes || []));
  const [toast, setToast] = useState('');
  const [gameEnded, setGameEnded] = useState(false);
  const [fullHouseWinner, setFHWinner] = useState(null);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const roomId = roomData?.roomId;
  const joinLink = `${window.location.origin}/room/${roomId}`;
  const lastNum = calledNums[calledNums.length - 1];

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    socket.on('number_drawn', (n) => setCalledNums(p => [...p, n]));
    socket.on('player_joined', (d) => setPlayers(d.players));
    socket.on('player_left', (d) => { setPlayers(d.players); if (d.newHostId === socket.id) setIsHost(true); });
    socket.on('game_started', () => setStarted(true));
    socket.on('prize_claimed', (t) => setClaimedPrizes(p => new Set([...p, t])));
    socket.on('claim_failed', (d) => showToast('❌ ' + d.message));
    socket.on('claim_success', (d) => {
      setClaims(p => [...p, d]);
      if (d.claimType === 'fullHousie') {
        setFHWinner(d.playerName);
        confetti({ particleCount: 300, spread: 120, origin: { y: 0.4 }, colors: ['#a78bfa', '#f472b6', '#fbbf24'] });
        setTimeout(() => confetti({ particleCount: 200, spread: 100, origin: { y: 0.3 }, colors: ['#a78bfa', '#f472b6', '#fbbf24'] }), 600);
      } else {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#a78bfa', '#f472b6', '#fbbf24'] });
      }
    });
    socket.on('game_ended', () => {
      setGameEnded(true);
      confetti({ particleCount: 250, spread: 140, origin: { y: 0.5 }, colors: ['#a78bfa', '#f472b6', '#fbbf24'] });
    });
    socket.on('chat_message', (msg) => {
      setChatMsgs(p => [...p, msg]);
      if (!showChat) setUnreadCount(u => u + 1);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
    return () => ['number_drawn', 'player_joined', 'player_left', 'game_started', 'prize_claimed', 'claim_failed', 'claim_success', 'game_ended', 'chat_message'].forEach(e => socket.off(e));
  }, [socket, showChat, setIsHost, roomId]);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    socket.emit('chat_message', { roomId, playerName, message: chatInput });
    setChatInput('');
  };

  const handleShare = async () => {
    if (navigator.share) { try { await navigator.share({ title: 'Join Tambola!', text: `Room: ${roomId}`, url: joinLink }); return; } catch (_) { } }
    await navigator.clipboard.writeText(joinLink).catch(() => { });
    showToast('🔗 Link copied!');
  };

  const doClaim = (key) => {
    if (claimedPrizes.has(key)) return;
    socket.emit('claim', { roomId, claimType: key, ticket, playerName });
  };

  const panel = (extra = {}) => ({ ...G.glass, borderRadius: 16, padding: 16, ...extra });
  const label = { fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8 };
  const btnEnd = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#f87171', cursor: 'pointer', fontFamily: G.font, fontWeight: 700, fontSize: '0.82rem' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: G.bg, fontFamily: G.font, color: '#fff', overflow: 'hidden' }}>

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 20, x: '-50%' }}
            style={{ position: 'fixed', bottom: 28, left: '50%', background: 'rgba(108,78,245,0.95)', border: '1px solid rgba(167,139,250,0.4)', borderRadius: 10, padding: '10px 22px', fontWeight: 700, zIndex: 999, whiteSpace: 'nowrap', boxShadow: '0 8px 30px rgba(108,78,245,0.4)' }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONGRATS OVERLAY ── */}
      <AnimatePresence>
        {(fullHouseWinner || gameEnded) && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 200 }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.85, x: '-50%', y: '-40%' }}
              animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
              exit={{ opacity: 0, scale: 0.85, x: '-50%', y: '-40%' }}
              style={{
                position: 'fixed', top: '50%', left: '50%', zIndex: 201, width: '90%', maxWidth: 460,
                background: 'linear-gradient(135deg,#1e1040,#0d0b1e)', border: '1px solid rgba(167,139,250,0.4)',
                borderRadius: 24, padding: isMobile ? '30px 20px' : '40px 32px', textAlign: 'center',
                boxShadow: '0 0 80px rgba(108,78,245,0.4)', fontFamily: G.font
              }}>
              <div style={{ fontSize: isMobile ? '2.2rem' : '3rem', marginBottom: 10 }}>🎉</div>
              <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.8rem', fontWeight: 900, marginBottom: 8 }}>{gameEnded && !fullHouseWinner ? 'Game Over!' : 'Full House! 🏆'}</h2>
              {fullHouseWinner && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 100, padding: isMobile ? '8px 18px' : '10px 22px', margin: '10px auto' }}>
                  <span>🏆</span>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Full House Winner</p>
                    <p style={{ fontWeight: 800, fontSize: isMobile ? '1rem' : '1.1rem', color: '#a78bfa' }}>{fullHouseWinner}</p>
                  </div>
                </div>
              )}
              {claims.filter(c => c.claimType !== 'fullHousie').length > 0 && (
                <div style={{ margin: '14px 0' }}>
                  <p style={{ ...label, textAlign: 'center', marginBottom: 8 }}>Other prizes</p>
                  <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                    {claims.filter(c => c.claimType !== 'fullHousie').map((c, i) => (
                      <span key={i} style={{ display: 'inline-block', margin: '3px', padding: '3px 12px', borderRadius: 100, background: 'rgba(244,114,182,0.15)', border: '1px solid rgba(244,114,182,0.3)', fontSize: '0.78rem', fontWeight: 600 }}>
                        {c.playerName} – {c.claimType}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {isHost ? (
                <button onClick={() => socket.emit('end_game', roomId)}
                  style={{ marginTop: 20, padding: isMobile ? '12px 24px' : '13px 32px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#6c4ef5,#4f35d2)', color: 'white', fontFamily: G.font, fontWeight: 800, fontSize: isMobile ? '0.85rem' : '0.95rem', cursor: 'pointer', boxShadow: '0 0 24px rgba(108,78,245,0.5)' }}>
                  End Game & Close Room
                </button>
              ) : (
                <p style={{ marginTop: 20, color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Waiting for host to end the game…</p>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── TOP BAR ── */}
      <header style={{ height: 58, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12 }}>
          {!isMobile && (
            <div style={{ position: 'relative', width: 42, height: 32, marginRight: 8 }}>
              {/* Stylized Ticket Background */}
              <div style={{
                width: 34, height: 24, background: 'rgba(255,255,255,0.08)', borderRadius: 4, border: '1.5px solid rgba(255,255,255,0.15)',
                transform: 'rotate(-12deg)', position: 'absolute', left: 0, top: 2, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, padding: 2.5,
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
              }}>
                {[1, 0, 1, 0, 1, 0, 1, 1, 0].map((v, i) => (
                  <div key={i} style={{ background: v ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.03)', borderRadius: 1 }} />
                ))}
              </div>
              {/* Glowing Numbered Ball */}
              <div style={{
                width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                border: '2px solid #fff', position: 'absolute', right: -2, bottom: -2, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff', boxShadow: '0 4px 12px rgba(124,58,237,0.6)',
                zIndex: 2, transform: 'scale(1.1)'
              }}>
                T
              </div>
            </div>
          )}
          <span style={{
            fontWeight: 900,
            fontSize: isMobile ? '1.1rem' : '1.35rem',
            letterSpacing: '-0.8px',
            background: 'linear-gradient(to bottom, #fff 40%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 10px 20px rgba(167,139,250,0.2)'
          }}>
            TAMBOLA.io
          </span>
          <div style={{ padding: isMobile ? '3px 8px' : '4px 14px', borderRadius: 7, background: 'rgba(108,78,245,0.15)', border: '1px solid rgba(108,78,245,0.3)', fontSize: isMobile ? '0.75rem' : '0.92rem', fontWeight: 700, color: '#a78bfa', letterSpacing: '0.1em' }}>#{roomId}</div>
          {lastNum && (
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 7 }}>
              <div style={{ width: isMobile ? 28 : 34, height: isMobile ? 28 : 34, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%,#e0d8ff,#6c4ef5 45%,#2a1a7a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: isMobile ? '0.7rem' : '0.88rem', boxShadow: '0 0 10px rgba(108,78,245,0.4)' }}>{lastNum}</div>
              {!isMobile && (
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Last Drawn</p>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>#{lastNum}</p>
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: isMobile ? '6px 10px' : '7px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer', fontFamily: G.font, fontWeight: 600, fontSize: isMobile ? '0.75rem' : '0.82rem' }} onClick={handleShare}>
            <Share2 size={isMobile ? 12 : 14} /> {!isMobile && 'Share'}
          </button>
          {isHost && (
            <div style={{ display: 'flex', gap: isMobile ? 4 : 7 }}>
              {gameStarted && <button style={{ ...btnEnd, padding: isMobile ? '6px 10px' : '8px 14px', fontSize: isMobile ? '0.7rem' : '0.82rem' }} onClick={() => { if (confirm('End the game?')) socket.emit('end_game', roomId); }}><LogOut size={isMobile ? 11 : 13} /> {!isMobile && 'End'}</button>}
            </div>
          )}
          {!isHost && !gameStarted && <span style={{ fontSize: isMobile ? '0.65rem' : '0.78rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{isMobile ? '⏳ Host…' : '⏳ Waiting for host…'}</span>}
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: isMobile ? 'flex' : 'grid', flexDirection: isMobile ? 'column' : 'unset', gridTemplateColumns: isMobile ? 'none' : '260px 1fr 300px', gap: 10, padding: 10, minHeight: 0 }}>

        {/* LEFT: Players + Winners */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden', height: isMobile ? '120px' : 'auto', flexShrink: 0 }}>
          <div style={{ ...panel(), flex: 1, overflow: 'auto', minHeight: 0, padding: isMobile ? '8px 12px' : '16px' }}>
            <p style={{ ...label, fontSize: '0.8rem', marginBottom: 4 }}>Players · {players.length}</p>
            <div style={{ display: 'flex', gap: 8, overflowX: isMobile ? 'auto' : 'hidden', flexDirection: isMobile ? 'row' : 'column' }}>
              {players.map(p => {
                const isMe = p.name === playerName;
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? '4px 10px' : '9px 11px', borderRadius: 9, marginBottom: isMobile ? 0 : 7, background: isMe ? 'rgba(108,78,245,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isMe ? 'rgba(108,78,245,0.35)' : 'rgba(255,255,255,0.06)'}`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: isMe ? 'linear-gradient(135deg,#6c4ef5,#e83e8c)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{p.name[0].toUpperCase()}</div>
                    <span style={{ fontSize: isMobile ? '0.9rem' : '1.1rem', fontWeight: 600 }}>{p.name}</span>
                    {p.isHost && <Crown size={isMobile ? 12 : 16} color="#fbbf24" />}
                  </div>
                );
              })}
              {claims.length > 0 && isMobile && (
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 8, display: 'flex', gap: 6 }}>
                  {claims.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 9, background: 'rgba(232,62,140,0.1)', border: '1px solid rgba(232,62,140,0.2)', whiteSpace: 'nowrap' }}>
                      <Trophy size={12} color="#f472b6" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{c.playerName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {!isMobile && claims.length > 0 && (
              <>
                <p style={{ ...label, marginTop: 14, fontSize: '0.8rem' }}>🏆 Winners</p>
                {claims.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 11px', borderRadius: 9, background: 'rgba(232,62,140,0.1)', border: '1px solid rgba(232,62,140,0.2)', marginBottom: 6 }}>
                    <Trophy size={16} color="#f472b6" />
                    <div>
                      <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{c.playerName}</p>
                      <p style={{ fontSize: '0.82rem', color: '#f472b6', textTransform: 'uppercase' }}>{c.claimType}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* CENTER: History + Ticket + Claims */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          overflowY: isMobile ? 'auto' : 'hidden',
          minHeight: 0,
          flex: 1,
          paddingBottom: isMobile ? 120 : 0, // Extra space at bottom for mobile scrolling
          WebkitOverflowScrolling: 'touch'
        }}>

          {/* Call History */}
          {calledNums.length > 0 && (
            <div style={{ ...panel({ padding: '10px 14px' }), flexShrink: 0 }}>
              <p style={{ ...label, marginBottom: 8 }}>Called Numbers — latest first</p>
              <div style={{
                display: 'flex',
                flexWrap: isMobile ? 'nowrap' : 'wrap',
                gap: 8,
                overflowX: isMobile ? 'auto' : 'visible',
                paddingBottom: isMobile ? 6 : 0,
                maxHeight: isMobile ? '96px' : 'none',
                minHeight: isMobile ? '40px' : 'auto'
              }}>
                {[...calledNums].reverse().map((n, i) => (
                  <span key={i} style={{
                    width: 40, height: 40, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700,
                    background: i === 0 ? 'linear-gradient(135deg,#6c4ef5,#4f35d2)' : 'rgba(255,255,255,0.07)',
                    border: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    color: i === 0 ? '#fff' : 'rgba(255,255,255,0.7)',
                    boxShadow: i === 0 ? '0 0 10px rgba(108,78,245,0.6)' : 'none',
                  }}>{n}</span>
                ))}
              </div>
            </div>
          )}

          {/* Ticket Section */}
          {isHost && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <AnimatePresence mode="wait">
                {!gameStarted ? (
                  <motion.button key="start" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '14px 40px', borderRadius: 14, border: 'none',
                      background: 'linear-gradient(135deg,#6c4ef5,#4f35d2)', color: 'white', fontWeight: 800, fontSize: '1.1rem',
                      cursor: 'pointer', fontFamily: G.font, boxShadow: '0 8px 25px rgba(108,78,245,0.4)'
                    }}
                    onClick={() => socket.emit('start_game', roomId)}>
                    <Play size={20} fill="white" /> Start Game
                  </motion.button>
                ) : (
                  <motion.button key="next" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '14px 40px', borderRadius: 14, border: 'none',
                      background: 'linear-gradient(135deg,#f472b6,#e83e8c)', color: 'white', fontWeight: 800, fontSize: '1.1rem',
                      cursor: 'pointer', fontFamily: G.font, boxShadow: '0 8px 25px rgba(232,62,140,0.4)'
                    }}
                    onClick={() => socket.emit('draw_next', roomId)}>
                    Next Number <ChevronRight size={20} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          )}
          <div style={{ ...panel({ padding: '16px' }), flexShrink: 0 }}>
            {/* Draw Button for Host */}


            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ ...label, marginBottom: 0, fontSize: '0.85rem' }}>Your Ticket — tap to strike off</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>Live</span>
              </div>
            </div>
            <div style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
              <Ticket ticket={ticket} />
            </div>
          </div>

          {/* Claim Prizes */}
          <div style={{ ...panel({ padding: isMobile ? '12px' : '10px 14px' }), flexShrink: 0, marginBottom: isMobile ? 20 : 0 }}>
            <p style={{ ...label, marginBottom: 10 }}>Prizes</p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: isMobile ? 10 : 7 }}>
              {CLAIMS.filter(c => !c.featured).map(c => {
                const isClaimed = claimedPrizes.has(c.key);
                const winner = claims.find(cl => cl.claimType === c.key);
                return (
                  <button key={c.key} disabled={isClaimed} onClick={() => doClaim(c.key)}
                    style={{
                      padding: isMobile ? '10px 4px' : '10px 4px',
                      borderRadius: 12,
                      border: `1px solid ${isClaimed ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.12)'}`,
                      background: isClaimed ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
                      color: 'white',
                      cursor: isClaimed ? 'not-allowed' : 'pointer',
                      fontFamily: G.font,
                      fontWeight: 600,
                      fontSize: isMobile ? '0.8rem' : '0.92rem',
                      textAlign: 'center',
                      opacity: isClaimed ? 0.5 : 1,
                      minHeight: isMobile ? 60 : 'auto'
                    }}>
                    <span style={{ display: 'block', fontSize: isMobile ? '0.9rem' : '1.1rem', marginBottom: 2 }}>{c.emoji}</span>
                    {c.label}
                    {isClaimed && <span style={{ display: 'block', fontSize: '0.62rem', color: '#f472b6', marginTop: 2 }}>✓ {winner?.playerName}</span>}
                  </button>
                );
              })}
              {(() => {
                const isClaimed = claimedPrizes.has('fullHousie');
                const winner = claims.find(cl => cl.claimType === 'fullHousie');
                return (
                  <button disabled={isClaimed} onClick={() => doClaim('fullHousie')}
                    style={{
                      gridColumn: isMobile ? 'span 2' : 'auto',
                      padding: '12px 8px',
                      borderRadius: 12,
                      border: 'none',
                      background: isClaimed ? 'rgba(232,62,140,0.12)' : 'linear-gradient(135deg,#e83e8c,#c41f6e)',
                      color: 'white',
                      cursor: isClaimed ? 'not-allowed' : 'pointer',
                      fontFamily: G.font,
                      fontWeight: 800,
                      fontSize: isMobile ? '0.95rem' : '0.82rem',
                      textAlign: 'center',
                      opacity: isClaimed ? 0.5 : 1,
                      boxShadow: isClaimed ? 'none' : '0 6px 20px rgba(232,62,140,0.4)',
                      minHeight: isMobile ? 64 : 'auto'
                    }}>
                    <span style={{ display: 'block', fontSize: isMobile ? '1rem' : '1rem', marginBottom: 2 }}>🏠</span>
                    Full House
                    {isClaimed && <span style={{ display: 'block', fontSize: '0.6rem', marginTop: 2 }}>✓ {winner?.playerName}</span>}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>

        {/* RIGHT: Live Chat */}
        {isMobile && showChat && (
          <div onClick={() => setShowChat(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 999 }} />
        )}
        {(!isMobile || showChat) && (
          <div style={{
            ...(isMobile ? { position: 'fixed', bottom: 80, right: 16, left: 16, zIndex: 1000, height: '420px', borderRadius: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.8)', border: '1px solid rgba(108,78,245,0.4)' } : { background: '#15122b', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }),
            background: 'linear-gradient(180deg, #1e1b3d 0%, #0d0b1e 100%)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, flexShrink: 0, width: isMobile ? 'auto' : '300px'
          }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 9, flexShrink: 0, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <MessageCircle size={16} color="#a78bfa" />
                <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Live Chat</span>
              </div>
              {isMobile && <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>✕</button>}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 9, minHeight: 0 }}>
              {chatMsgs.length === 0 && <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.92rem', textAlign: 'center', marginTop: 24 }}>No messages yet 👋</p>}
              {chatMsgs.map((m, i) => {
                const isMe = m.playerName === playerName;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    {!isMe && <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 3, marginLeft: 4 }}>{m.playerName}</span>}
                    <div style={{ maxWidth: '88%', padding: '10px 14px', borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px', background: isMe ? 'linear-gradient(135deg,#6c4ef5,#4f35d2)' : '#252145', border: isMe ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.05)', fontSize: '0.95rem', wordBreak: 'break-word', color: '#fff', boxShadow: isMe ? '0 4px 12px rgba(108,78,245,0.3)' : '0 4px 12px rgba(0,0,0,0.2)' }}>{m.message}</div>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.28)', marginTop: 4, marginLeft: 4, marginRight: 4 }}>{m.time}</span>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, background: 'rgba(0,0,0,0.2)' }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Message…" style={{ flex: 1, minWidth: 0, background: '#1a1735', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', color: 'white', fontSize: '0.95rem', outline: 'none', fontFamily: G.font }} />
              <button onClick={sendChat} style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6c4ef5,#4f35d2)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Send size={16} /></button>
            </div>
          </div>
        )}

        {/* Floating Chat Button for Mobile */}
        {isMobile && !showChat && (
          <button onClick={() => { setShowChat(true); setUnreadCount(0); }} style={{ position: 'fixed', bottom: 24, right: 24, width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#6c4ef5,#4f35d2)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(108,78,245,0.5)', zIndex: 999, cursor: 'pointer' }}>
            <MessageCircle size={24} />
            {unreadCount > 0 && <div style={{ position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderRadius: '50%', background: '#10b981', border: '2px solid #1e1040', boxShadow: '0 0 8px #10b981' }} />}
          </button>
        )}
      </div>
    </div>
  );
}
