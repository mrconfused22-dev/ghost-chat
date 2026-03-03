import { useEffect, useState } from 'react'

function Welcome({ onNext }) {
  const [vis, setVis] = useState(false)
  useEffect(() => { setTimeout(() => setVis(true), 50) }, [])

  return (
    <div style={{
      minHeight: '100vh',
      minHeight: '100dvh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(1rem, 5vw, 2rem)',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
    }}>
      {/* Grid background */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

      {/* Decorative stars */}
      <div style={{ position: 'absolute', top: '12%', left: '18%', color: '#fff', fontSize: '2rem', opacity: 0.9, textShadow: '0 0 20px #fff', lineHeight: 1 }}>&#10022;</div>
      <div style={{ position: 'absolute', top: '20%', right: '18%', color: '#fff', fontSize: '1rem', opacity: 0.35, lineHeight: 1 }}>&#10022;</div>
      <div style={{ position: 'absolute', bottom: '28%', left: '10%', color: '#fff', fontSize: '0.6rem', opacity: 0.25, lineHeight: 1 }}>&#10022;</div>
      <div style={{ position: 'absolute', bottom: '20%', right: '15%', color: '#fff', fontSize: '0.5rem', opacity: 0.2, lineHeight: 1 }}>&#10022;</div>

      {/* Ghost image */}
      <div style={{
        width: 'clamp(60px, 15vw, 100px)',
        height: 'clamp(60px, 15vw, 100px)',
        marginBottom: '1.25rem',
        filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.4))',
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease',
      }}>
        <img src="/ghost.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>

      {/* Title */}
      <div style={{ opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.6s ease 0.1s' }}>
        <div style={{
          fontSize: 'clamp(2.5rem, 12vw, 5rem)',
          fontWeight: 900,
          letterSpacing: '0.06em',
          lineHeight: 1,
          color: '#fff',
          fontFamily: 'Arial Black, Impact, sans-serif',
          textTransform: 'uppercase',
        }}>GHOST</div>
        <div style={{
          fontSize: 'clamp(2.5rem, 12vw, 5rem)',
          fontWeight: 900,
          letterSpacing: '0.06em',
          lineHeight: 1,
          color: 'transparent',
          WebkitTextStroke: '2px #fff',
          fontFamily: 'Arial Black, Impact, sans-serif',
          textTransform: 'uppercase',
          marginBottom: '0.75rem',
        }}>CHAT</div>
      </div>

      <p style={{
        color: '#444',
        fontSize: 'clamp(0.65rem, 2vw, 0.75rem)',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        marginBottom: '2.5rem',
        opacity: vis ? 1 : 0,
        transition: 'all 0.6s ease 0.2s',
      }}>Anonymous · Encrypted · Ephemeral</p>

      <button onClick={onNext}
        style={{
          background: '#fff',
          color: '#000',
          border: '2px solid #fff',
          padding: '0.9rem clamp(2rem, 8vw, 3.5rem)',
          fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
          fontWeight: 900,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          opacity: vis ? 1 : 0,
          width: '100%',
          maxWidth: '320px',
        }}
        onMouseEnter={e => { e.target.style.background = 'transparent'; e.target.style.color = '#fff' }}
        onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.color = '#000' }}
      >GET STARTED</button>

      <div style={{ position: 'absolute', bottom: '1.25rem', color: '#333', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Ghost Chat · Private By Design</div>
    </div>
  )
}

export default Welcome
