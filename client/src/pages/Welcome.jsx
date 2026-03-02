import { useEffect, useState } from 'react'

function Welcome({ onNext }) {
  const [vis, setVis] = useState(false)
  useEffect(() => { setTimeout(() => setVis(true), 50) }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '12%', left: '18%', color: '#fff', fontSize: '2rem', opacity: 0.9, textShadow: '0 0 20px #fff, 0 0 40px #fff', lineHeight: 1 }}>&#10022;</div>
      <div style={{ position: 'absolute', top: '20%', right: '18%', color: '#fff', fontSize: '1rem', opacity: 0.35, lineHeight: 1 }}>&#10022;</div>
      <div style={{ position: 'absolute', bottom: '28%', left: '10%', color: '#fff', fontSize: '0.6rem', opacity: 0.25, lineHeight: 1 }}>&#10022;</div>
      <div style={{ position: 'absolute', bottom: '20%', right: '15%', color: '#fff', fontSize: '0.5rem', opacity: 0.2, lineHeight: 1 }}>&#10022;</div>
      <div style={{ fontSize: '5rem', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.4))', opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.6s ease' }}><img src="/ghost.png" style={{width:"100%",height:"100%",objectFit:"contain"}} /></div>
      <div style={{ opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.6s ease 0.1s' }}>
        <div style={{ fontSize: '5rem', fontWeight: 900, letterSpacing: '0.06em', lineHeight: 1, color: '#fff', fontFamily: 'Arial Black, Impact, sans-serif', textTransform: 'uppercase' }}>GHOST</div>
        <div style={{ fontSize: '5rem', fontWeight: 900, letterSpacing: '0.06em', lineHeight: 1, color: 'transparent', WebkitTextStroke: '2px #fff', fontFamily: 'Arial Black, Impact, sans-serif', textTransform: 'uppercase', marginBottom: '0.75rem' }}>CHAT</div>
      </div>
      <p style={{ color: '#444', fontSize: '0.75rem', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '3rem', opacity: vis ? 1 : 0, transition: 'all 0.6s ease 0.2s' }}>Anonymous · Encrypted · Ephemeral</p>
      <button onClick={onNext}
        style={{ background: '#fff', color: '#000', border: '2px solid #fff', padding: '1rem 3.5rem', fontSize: '0.85rem', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s', opacity: vis ? 1 : 0 }}
        onMouseEnter={e => { e.target.style.background = 'transparent'; e.target.style.color = '#fff' }}
        onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.color = '#000' }}
      >GET STARTED</button>
      <div style={{ position: 'absolute', bottom: '2rem', color: '#333', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Ghost Chat · Private By Design</div>
    </div>
  )
}

export default Welcome