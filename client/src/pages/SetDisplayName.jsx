import { useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:3001/api'

function SetDisplayName({ onDone }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    if (!name.trim() || name.trim().length < 2) { setError('Name must be at least 2 characters'); return }
    if (name.trim().length > 30) { setError('Name must be under 30 characters'); return }
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post(API + '/auth/set-display-name', { displayName: name.trim() }, { headers: { Authorization: 'Bearer ' + token } })
      localStorage.setItem('displayName', name.trim())
      onDone(name.trim())
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to set display name')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '10%', left: '15%', color: '#fff', fontSize: '2rem', opacity: 0.8, textShadow: '0 0 20px #fff' }}>&#10022;</div>
      <div style={{ position: 'absolute', top: '18%', right: '18%', color: '#fff', fontSize: '0.8rem', opacity: 0.3 }}>&#10022;</div>

      <div style={{ maxWidth: '420px', width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}><img src="/ghost.png" style={{width:"100%",height:"100%",objectFit:"contain"}} /></div>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', fontFamily: 'Arial Black, Impact, sans-serif', letterSpacing: '0.06em', lineHeight: 1 }}>CHOOSE</div>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: 'transparent', WebkitTextStroke: '2px #fff', fontFamily: 'Arial Black, Impact, sans-serif', letterSpacing: '0.06em', lineHeight: 1, marginBottom: '0.5rem' }}>YOUR NAME</div>
          <p style={{ color: '#555', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '0.75rem' }}>This is how others will see you</p>
        </div>

        <div style={{ border: '1px solid #222', borderRadius: '4px', padding: '1rem', marginBottom: '1.5rem', background: 'rgba(255,68,68,0.05)' }}>
          <p style={{ color: '#888', fontSize: '0.82rem', lineHeight: 1.6, textAlign: 'center' }}>
            &#9888; <span style={{ color: '#ff4444' }}>Do not use your real name.</span> Choose an anonymous display name to protect your identity.
          </p>
        </div>

        {error && <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid #ff4444', borderRadius: '4px', padding: '0.75rem', marginBottom: '1rem', color: '#ff4444', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}

        <input
          type='text'
          placeholder='e.g. ghost_rider, shadow99...'
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
          maxLength={30}
          style={{ width: '100%', padding: '0.9rem 1rem', background: 'transparent', border: '1px solid #333', borderRadius: '4px', color: '#fff', fontSize: '0.9rem', letterSpacing: '0.05em', outline: 'none', boxSizing: 'border-box', marginBottom: '0.75rem' }}
          onFocus={e => e.target.style.borderColor = '#fff'}
          onBlur={e => e.target.style.borderColor = '#333'}
        />
        <div style={{ color: '#444', fontSize: '0.75rem', textAlign: 'right', marginBottom: '1rem' }}>{name.length}/30</div>

        <button onClick={handleSubmit} disabled={loading || !name.trim()}
          style={{ width: '100%', background: name.trim() ? '#fff' : 'transparent', color: name.trim() ? '#000' : '#333', border: '2px solid ' + (name.trim() ? '#fff' : '#333'), padding: '1rem', fontSize: '0.85rem', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', borderRadius: '4px', cursor: name.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
          onMouseEnter={e => { if (name.trim()) { e.target.style.background = 'transparent'; e.target.style.color = '#fff' } }}
          onMouseLeave={e => { if (name.trim()) { e.target.style.background = '#fff'; e.target.style.color = '#000' } }}
        >{loading ? 'Saving...' : 'Enter Ghost Chat'}</button>
      </div>
      <div style={{ position: 'absolute', bottom: '2rem', color: '#333', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Ghost Chat · Private By Design</div>
    </div>
  )
}

export default SetDisplayName