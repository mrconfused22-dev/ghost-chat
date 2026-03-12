import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API = 'https://ghost-chat-server-muzw.onrender.com/api'

const GHOST_COLORS = {
  Ghost_A: { color: '#a78bfa', dim: '#2e1a5e' },
  Ghost_B: { color: '#34d399', dim: '#052e1c' },
  Ghost_C: { color: '#fb923c', dim: '#431407' },
  Ghost_D: { color: '#60a5fa', dim: '#0c2340' },
}

function GhostTag({ name }) {
  const c = GHOST_COLORS[name] || { color: '#888', dim: '#222' }
  return (
    <span style={{ background: c.dim, color: c.color, border: `1px solid ${c.color}33`, borderRadius: '6px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.08em', fontFamily: 'monospace' }}>
      {name}
    </span>
  )
}

function MessageBubble({ msg, vote, votes }) {
  const c = GHOST_COLORS[msg.ghostName] || { color: '#888' }
  const [voted, setVoted] = useState(false)

  return (
    <div style={{ marginBottom: '1.25rem', animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <GhostTag name={msg.ghostName} />
        <span style={{ color: '#333', fontSize: '0.7rem' }}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div style={{ background: '#0f0f0f', border: `1px solid ${c.color}22`, borderLeft: `3px solid ${c.color}`, borderRadius: '0 10px 10px 10px', padding: '0.85rem 1rem', color: '#e0e0e0', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '88%' }}>
        {msg.content}
      </div>
      <button onClick={() => { if (!voted) { setVoted(true); vote(msg.id) } }}
        style={{ marginTop: '6px', background: voted ? '#1a1a1a' : 'transparent', border: `1px solid ${voted ? '#333' : '#222'}`, borderRadius: '20px', color: voted ? '#888' : '#444', padding: '3px 10px', fontSize: '0.72rem', cursor: voted ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{ fontSize: '12px' }}>👍</span>
        <span>{votes || 0}</span>
      </button>
    </div>
  )
}

function ModeCard({ mode, selected, onSelect }) {
  const [hover, setHover] = useState(false)
  const isSelected = selected === mode.id
  return (
    <div onClick={() => onSelect(mode.id)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ border: `1px solid ${isSelected ? '#fff' : hover ? '#333' : '#1a1a1a'}`, borderRadius: '10px', padding: '1rem', cursor: 'pointer', background: isSelected ? '#111' : hover ? '#0a0a0a' : 'transparent', transition: 'all 0.15s', flex: '1 1 calc(50% - 8px)', minWidth: '140px' }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{mode.emoji}</div>
      <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>{mode.label}</div>
      <div style={{ color: '#555', fontSize: '0.75rem', lineHeight: 1.4 }}>{mode.description}</div>
    </div>
  )
}

function RevealCard({ reveal, mode }) {
  return (
    <div style={{ background: '#080808', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem', marginTop: '1rem' }}>
      <div style={{ color: '#fff', fontWeight: 900, fontSize: '1rem', letterSpacing: '0.1em', marginBottom: '1rem', textAlign: 'center' }}>🎭 THE REVEAL</div>
      {['Ghost_A', 'Ghost_B', 'Ghost_C', 'Ghost_D'].map(ghost => {
        const c = GHOST_COLORS[ghost]
        const info = reveal[ghost]
        if (!info) return null
        return (
          <div key={ghost} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #111', flexWrap: 'wrap', gap: '8px' }}>
            <GhostTag name={ghost} />
            <span style={{ color: '#444', fontSize: '0.75rem' }}>was</span>
            <span style={{ color: c.color, fontWeight: 700, fontSize: '0.85rem', fontFamily: 'monospace' }}>{info.ai}</span>
            {mode === 'debate' && reveal._sides?.[ghost] && (
              <span style={{ color: '#555', fontSize: '0.75rem' }}>({reveal._sides[ghost].side})</span>
            )}
            {mode === 'courtroom' && reveal._roles?.[ghost] && (
              <span style={{ color: '#555', fontSize: '0.75rem' }}>({reveal._roles[ghost]})</span>
            )}
          </div>
        )
      })}
      {mode === 'amongus' && reveal._imposter && (
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#1a0000', border: '1px solid #ff444433', borderRadius: '8px' }}>
          <div style={{ color: '#ff6666', fontWeight: 700, fontSize: '0.85rem' }}>🕵️ The Imposter was: {reveal._imposter}</div>
          <div style={{ color: '#ff444488', fontSize: '0.78rem', marginTop: '4px' }}>Goal: {reveal._imposterGoal}</div>
        </div>
      )}
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
          <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.color, animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  )
}

export default function Arena({ user }) {
  const [gameState, setGameState] = useState(null)
  const [modes, setModes] = useState([])
  const [selectedMode, setSelectedMode] = useState('roast')
  const [typing, setTyping] = useState(false)
  const [reveal, setReveal] = useState(null)
  const [votes, setVotes] = useState({})
  const [error, setError] = useState('')
  const [autoPlay, setAutoPlay] = useState(false)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const autoPlayRef = useRef(false)

  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetchModes()
    fetchState()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [gameState?.history, typing])

  useEffect(() => { autoPlayRef.current = autoPlay }, [autoPlay])

  const fetchModes = async () => {
    try {
      const res = await axios.get(`${API}/arena/modes`, { headers })
      setModes(res.data.modes)
    } catch (err) { console.error(err) }
  }

  const fetchState = async () => {
    try {
      const res = await axios.get(`${API}/arena/state`, { headers })
      if (res.data.started) {
        setGameState(res.data)
        setVotes(res.data.votes || {})
      }
    } catch (err) { console.error(err) }
  }

  const startGame = async () => {
    setLoading(true)
    setReveal(null)
    setError('')
    try {
      await axios.post(`${API}/arena/start`, { mode: selectedMode }, { headers })
      await fetchState()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start')
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
        setTimeout(() => { if (autoPlayRef.current) nextTurn() }, 2800)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
      setAutoPlay(false)
    }
    setTyping(false)
  }

  const handleVote = async (messageId) => {
    try {
      const res = await axios.post(`${API}/arena/vote`, { messageId }, { headers })
      setVotes(prev => ({ ...prev, [messageId]: res.data.votes }))
    } catch (err) { console.error(err) }
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
    if (next && gameState && !gameState.finished && !typing) nextTurn()
  }

  const progress = gameState ? (gameState.round / gameState.maxRounds) * 100 : 0
  const modeColor = { roast: '#fb923c', debate: '#60a5fa', amongus: '#a78bfa', courtroom: '#34d399' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#080808' }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
      `}</style>

      {/* Header */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #111', background: '#0a0a0a', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '0.05em', color: '#fff' }}>
              {gameState?.started ? `${gameState.modeEmoji || '👻'} ${gameState.modeLabel || 'AI ARENA'}` : '👻 AI ARENA'}
            </div>
            <div style={{ color: '#444', fontSize: '0.72rem', marginTop: '2px' }}>
              {gameState?.started
                ? gameState.publicContext?.topic ? `Topic: ${gameState.publicContext.topic}`
                  : gameState.publicContext?.crime ? `Crime: ${gameState.publicContext.crime}`
                  : gameState.publicContext?.hint || '4 anonymous AIs · identities hidden'
                : '4 AI models · multiple game modes · no one knows who\'s who'}
            </div>
          </div>
          {gameState?.started && (
            <button onClick={resetGame} style={{ background: 'transparent', border: '1px solid #222', color: '#555', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>
              Reset
            </button>
          )}
        </div>

        {gameState?.started && (
          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#333', fontSize: '0.7rem' }}>Round {gameState.round} / {gameState.maxRounds}</span>
              {!gameState.finished
                ? <span style={{ color: '#333', fontSize: '0.7rem' }}>Next: <span style={{ color: GHOST_COLORS[gameState.currentGhost]?.color }}>{gameState.currentGhost}</span></span>
                : <span style={{ color: '#f87171', fontSize: '0.7rem' }}>Game Over</span>}
            </div>
            <div style={{ height: '3px', background: '#111', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: modeColor[gameState.mode] || '#fff', transition: 'width 0.5s ease', borderRadius: '2px' }} />
            </div>
          </div>
        )}
      </div>

      {/* Ghost legend */}
      {gameState?.started && (
        <div style={{ display: 'flex', gap: '8px', padding: '0.6rem 1.5rem', borderBottom: '1px solid #0d0d0d', flexWrap: 'wrap', background: '#080808' }}>
          {GHOST_NAMES.map(g => <GhostTag key={g} name={g} />)}
          <span style={{ color: '#2a2a2a', fontSize: '0.72rem', alignSelf: 'center' }}>— identities hidden until reveal</span>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>

        {/* Mode selection screen */}
        {!gameState?.started && (
          <div style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem', paddingTop: '1rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👻</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>AI Arena</div>
              <div style={{ color: '#444', fontSize: '0.85rem' }}>4 AI models enter anonymously. Choose your game.</div>
            </div>

            <div style={{ color: '#333', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Select Mode</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1.5rem' }}>
              {modes.map(mode => (
                <ModeCard key={mode.id} mode={mode} selected={selectedMode} onSelect={setSelectedMode} />
              ))}
            </div>

            {error && (
              <div style={{ background: '#1a0000', border: '1px solid #ff444433', borderRadius: '8px', padding: '0.75rem', color: '#ff6666', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <button onClick={startGame} disabled={loading || !selectedMode}
              style={{ width: '100%', background: '#fff', color: '#000', border: 'none', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 900, letterSpacing: '0.05em' }}>
              {loading ? 'Starting...' : `▶ Start ${modes.find(m => m.id === selectedMode)?.emoji || ''} ${modes.find(m => m.id === selectedMode)?.label || 'Game'}`}
            </button>
          </div>
        )}

        {/* Messages */}
        {gameState?.history?.map(msg => (
          <MessageBubble key={msg.id} msg={msg} vote={handleVote} votes={votes[msg.id]} />
        ))}

        {typing && gameState?.currentGhost && <TypingIndicator ghostName={gameState.currentGhost} />}

        {error && gameState?.started && (
          <div style={{ background: '#1a0000', border: '1px solid #ff444433', borderRadius: '8px', padding: '0.75rem 1rem', color: '#ff6666', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {reveal && <RevealCard reveal={reveal} mode={gameState?.mode} />}
        <div ref={bottomRef} />
      </div>

      {/* Controls */}
      {gameState?.started && (
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #111', background: '#0a0a0a', display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          {!gameState.finished ? (
            <>
              <button onClick={nextTurn} disabled={typing || autoPlay}
                style={{ background: typing ? '#111' : '#fff', color: typing ? '#333' : '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: typing ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 900 }}>
                {typing ? 'Thinking...' : 'Next Turn'}
              </button>
              <button onClick={toggleAutoPlay}
                style={{ background: autoPlay ? '#0f1f0f' : 'transparent', color: autoPlay ? '#34d399' : '#444', border: `1px solid ${autoPlay ? '#34d39944' : '#222'}`, padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
                {autoPlay ? '⏸ Pause' : '▶ Auto'}
              </button>
            </>
          ) : (
            <>
              <button onClick={revealIdentities}
                style={{ background: '#fff', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 900 }}>
                🎭 Reveal
              </button>
              <button onClick={resetGame}
                style={{ background: 'transparent', color: '#555', border: '1px solid #222', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
                New Game
              </button>
            </>
          )}
          <span style={{ color: '#1a1a1a', fontSize: '0.72rem', marginLeft: 'auto' }}>{gameState.history?.length || 0} messages</span>
        </div>
      )}
    </div>
  )
}
