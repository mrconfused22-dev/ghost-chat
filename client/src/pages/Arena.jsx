import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API = 'https://ghost-chat-server-muzw.onrender.com/api'

const GHOST_COLORS = {
  Ghost_A: { color: '#a78bfa', dim: '#3b1f6e' },
  Ghost_B: { color: '#34d399', dim: '#064e35' },
  Ghost_C: { color: '#fb923c', dim: '#6b2800' },
  Ghost_D: { color: '#60a5fa', dim: '#1e3a5f' },
}

function GhostTag({ name }) {
  const c = GHOST_COLORS[name] || { color: '#888', dim: '#222' }
  return (
    <span style={{
      background: c.dim,
      color: c.color,
      border: `1px solid ${c.color}33`,
      borderRadius: '6px',
      padding: '2px 8px',
      fontSize: '0.72rem',
      fontWeight: 900,
      letterSpacing: '0.08em',
      fontFamily: 'monospace',
    }}>{name}</span>
  )
}

function MessageBubble({ msg, vote, votes }) {
  const c = GHOST_COLORS[msg.ghostName] || { color: '#888', dim: '#111' }
  const [voted, setVoted] = useState(false)

  const handleVote = async () => {
    if (voted) return
    setVoted(true)
    await vote(msg.id)
  }

  return (
    <div style={{ marginBottom: '1.25rem', animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <GhostTag name={msg.ghostName} />
        <span style={{ color: '#333', fontSize: '0.7rem' }}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div style={{
        background: '#0f0f0f',
        border: `1px solid ${c.color}22`,
        borderLeft: `3px solid ${c.color}`,
        borderRadius: '0 10px 10px 10px',
        padding: '0.85rem 1rem',
        color: '#e0e0e0',
        fontSize: '0.95rem',
        lineHeight: '1.6',
        maxWidth: '85%',
      }}>
        {msg.content}
      </div>
      <button
        onClick={handleVote}
        style={{
          marginTop: '6px',
          background: voted ? '#1a1a1a' : 'transparent',
          border: `1px solid ${voted ? '#333' : '#222'}`,
          borderRadius: '20px',
          color: voted ? '#888' : '#444',
          padding: '3px 10px',
          fontSize: '0.72rem',
          cursor: voted ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
        }}
      >
        <span>👻</span>
        <span>{votes || 0} {votes === 1 ? 'vote' : 'votes'}</span>
      </button>
    </div>
  )
}

function RevealCard({ reveal }) {
  return (
    <div style={{
      background: '#0a0a0a',
      border: '1px solid #222',
      borderRadius: '12px',
      padding: '1.5rem',
      marginTop: '1rem',
    }}>
      <div style={{ color: '#fff', fontWeight: 900, fontSize: '1rem', letterSpacing: '0.1em', marginBottom: '1rem', textAlign: 'center' }}>
        🎭 THE REVEAL
      </div>
      {Object.entries(reveal).map(([ghost, ai]) => {
        const c = GHOST_COLORS[ghost] || { color: '#888' }
        return (
          <div key={ghost} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 0',
            borderBottom: '1px solid #111',
          }}>
            <GhostTag name={ghost} />
            <span style={{ color: '#555', fontSize: '0.8rem' }}>was</span>
            <span style={{ color: c.color, fontWeight: 700, fontSize: '0.9rem', fontFamily: 'monospace' }}>{ai}</span>
          </div>
        )
      })}
    </div>
  )
}

function TypingIndicator({ ghostName }) {
  const c = GHOST_COLORS[ghostName] || { color: '#888' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', opacity: 0.7 }}>
      <GhostTag name={ghostName} />
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: c.color,
            animation: `bounce 1.2s ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}

export default function Arena({ user }) {
  const [gameState, setGameState] = useState(null)
  const [loading, setLoading] = useState(false)
  const [typing, setTyping] = useState(false)
  const [reveal, setReveal] = useState(null)
  const [votes, setVotes] = useState({})
  const [error, setError] = useState('')
  const [autoPlay, setAutoPlay] = useState(false)
  const bottomRef = useRef(null)
  const autoPlayRef = useRef(false)

  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetchState()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [gameState?.history, typing])

  // Auto-play loop
  useEffect(() => {
    autoPlayRef.current = autoPlay
  }, [autoPlay])

  const fetchState = async () => {
    try {
      const res = await axios.get(`${API}/arena/state`, { headers })
      if (res.data.started) {
        setGameState(res.data)
        setVotes(res.data.votes || {})
      }
    } catch (err) {
      console.error('Fetch state error:', err)
    }
  }

  const startGame = async () => {
    setLoading(true)
    setReveal(null)
    setError('')
    try {
      await axios.post(`${API}/arena/start`, {}, { headers })
      await fetchState()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start game')
    }
    setLoading(false)
  }

  const nextTurn = async () => {
    if (typing) return
    setTyping(true)
    setError('')
    try {
      const res = await axios.post(`${API}/arena/turn`, {}, { headers })
      const { message, finished } = res.data

      setGameState(prev => ({
        ...prev,
        history: [...(prev?.history || []), message],
        round: res.data.round,
        currentGhost: res.data.nextGhost,
        finished,
      }))
      setVotes(prev => ({ ...prev, [message.id]: 0 }))

      if (finished) {
        setAutoPlay(false)
      } else if (autoPlayRef.current) {
        // Continue auto-play after delay
        setTimeout(() => {
          if (autoPlayRef.current) nextTurn()
        }, 2500)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'AI call failed. Check your API keys.')
      setAutoPlay(false)
    }
    setTyping(false)
  }

  const handleVote = async (messageId) => {
    try {
      const res = await axios.post(`${API}/arena/vote`, { messageId }, { headers })
      setVotes(prev => ({ ...prev, [messageId]: res.data.votes }))
    } catch (err) {
      console.error('Vote error:', err)
    }
  }

  const revealIdentities = async () => {
    try {
      const res = await axios.get(`${API}/arena/reveal`, { headers })
      setReveal(res.data.reveal)
    } catch (err) {
      setError(err.response?.data?.error || 'Cannot reveal yet')
    }
  }

  const resetGame = async () => {
    setAutoPlay(false)
    await axios.post(`${API}/arena/reset`, {}, { headers })
    setGameState(null)
    setReveal(null)
    setVotes({})
    setError('')
  }

  const toggleAutoPlay = () => {
    const next = !autoPlay
    setAutoPlay(next)
    if (next && gameState && !gameState.finished && !typing) {
      nextTurn()
    }
  }

  const progress = gameState ? (gameState.round / gameState.maxRounds) * 100 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#080808' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
      `}</style>

      {/* Header */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #151515', background: '#0a0a0a', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '0.05em', color: '#fff' }}>
              👻 AI ARENA
            </div>
            <div style={{ color: '#444', fontSize: '0.72rem', marginTop: '2px' }}>
              4 anonymous AIs · Truth or Dare · No one knows who's who
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {gameState?.started && !gameState.finished && (
              <button onClick={resetGame}
                style={{ background: 'transparent', border: '1px solid #222', color: '#555', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>
                Reset
              </button>
            )}
            {!gameState?.started && (
              <button onClick={startGame} disabled={loading}
                style={{ background: '#fff', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 900 }}>
                {loading ? 'Starting...' : 'Start Game'}
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {gameState?.started && (
          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#333', fontSize: '0.7rem' }}>Round {gameState.round} / {gameState.maxRounds}</span>
              {gameState.currentGhost && !gameState.finished && (
                <span style={{ color: '#333', fontSize: '0.7rem' }}>
                  Up next: <span style={{ color: GHOST_COLORS[gameState.currentGhost]?.color }}>{gameState.currentGhost}</span>
                </span>
              )}
              {gameState.finished && <span style={{ color: '#f87171', fontSize: '0.7rem' }}>Game Over</span>}
            </div>
            <div style={{ height: '3px', background: '#111', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#fff', transition: 'width 0.5s ease', borderRadius: '2px' }} />
            </div>
          </div>
        )}
      </div>

      {/* Ghost legend */}
      {gameState?.started && (
        <div style={{ display: 'flex', gap: '8px', padding: '0.75rem 1.5rem', borderBottom: '1px solid #111', flexWrap: 'wrap', background: '#080808' }}>
          {Object.keys(GHOST_COLORS).map(g => <GhostTag key={g} name={g} />)}
          <span style={{ color: '#333', fontSize: '0.72rem', alignSelf: 'center' }}>— identities hidden until reveal</span>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        {!gameState?.started && (
          <div style={{ textAlign: 'center', marginTop: '4rem', color: '#333' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👻</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#555', marginBottom: '0.5rem' }}>AI Arena</div>
            <div style={{ fontSize: '0.85rem', maxWidth: '300px', margin: '0 auto', lineHeight: 1.6 }}>
              4 AI models enter anonymously as Ghost_A through Ghost_D.<br />
              They play Truth or Dare with each other.<br />
              You watch. You vote. Then you guess who's who.
            </div>
            <button onClick={startGame} disabled={loading}
              style={{ marginTop: '2rem', background: '#fff', color: '#000', border: 'none', padding: '0.85rem 2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 900 }}>
              {loading ? 'Starting...' : '▶ Start the Game'}
            </button>
          </div>
        )}

        {gameState?.history?.map(msg => (
          <MessageBubble key={msg.id} msg={msg} vote={handleVote} votes={votes[msg.id]} />
        ))}

        {typing && gameState?.currentGhost && (
          <TypingIndicator ghostName={gameState.currentGhost} />
        )}

        {error && (
          <div style={{ background: '#1a0000', border: '1px solid #ff444433', borderRadius: '8px', padding: '0.75rem 1rem', color: '#ff6666', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {reveal && <RevealCard reveal={reveal} />}

        <div ref={bottomRef} />
      </div>

      {/* Controls */}
      {gameState?.started && (
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #111', background: '#0a0a0a', display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          {!gameState.finished ? (
            <>
              <button
                onClick={nextTurn}
                disabled={typing || autoPlay}
                style={{ background: typing ? '#111' : '#fff', color: typing ? '#333' : '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: typing ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 900 }}>
                {typing ? 'Thinking...' : 'Next Turn'}
              </button>
              <button
                onClick={toggleAutoPlay}
                style={{ background: autoPlay ? '#1a2a1a' : 'transparent', color: autoPlay ? '#34d399' : '#444', border: `1px solid ${autoPlay ? '#34d39944' : '#222'}`, padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
                {autoPlay ? '⏸ Pause' : '▶ Auto Play'}
              </button>
            </>
          ) : (
            <>
              <button onClick={revealIdentities}
                style={{ background: '#fff', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 900 }}>
                🎭 Reveal Identities
              </button>
              <button onClick={resetGame}
                style={{ background: 'transparent', color: '#555', border: '1px solid #222', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
                New Game
              </button>
            </>
          )}
          <span style={{ color: '#222', fontSize: '0.72rem', marginLeft: 'auto' }}>
            {gameState.history?.length || 0} messages
          </span>
        </div>
      )}
    </div>
  )
}
