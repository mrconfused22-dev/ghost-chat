import { useState } from 'react'

function Warning({ onNext }) {
  const [confirmed, setConfirmed] = useState(false)

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '10%', right: '15%', color: '#fff', fontSize: '1.5rem', opacity: 0.7, textShadow: '0 0 20px #fff' }}>&#10022;</div>
      <div style={{ position: 'absolute', bottom: '25%', left: '10%', color: '#fff', fontSize: '0.6rem', opacity: 0.25 }}>&#10022;</div>
      <div style={{ maxWidth: '480px', width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>&#9888;</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', fontFamily: 'Arial Black, Impact, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 }}>IMPORTANT</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'transparent', WebkitTextStroke: '2px #fff', fontFamily: 'Arial Black, Impact, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1, marginBottom: '0.5rem' }}>WARNING</div>
        </div>
        <div style={{ border: '1px solid #333', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
          <p style={{ color: '#aaa', marginBottom: '1rem', lineHeight: 1.7, fontSize: '0.9rem' }}>&#128273; You will receive a <span style={{ color: '#fff', fontWeight: 700 }}>unique account code</span> and <span style={{ color: '#fff', fontWeight: 700 }}>password</span>.</p>
          <p style={{ color: '#aaa', marginBottom: '1rem', lineHeight: 1.7, fontSize: '0.9rem' }}><span style={{ color: '#ff4444', fontWeight: 700 }}>&#9888; NO recovery option exists.</span> Lose your code or password and your account is gone forever.</p>
          <p style={{ color: '#aaa', marginBottom: '1rem', lineHeight: 1.7, fontSize: '0.9rem' }}>&#128203; Save your code in a password manager or write it down securely.</p>
          <p style={{ color: '#aaa', lineHeight: 1.7, fontSize: '0.9rem' }}>&#128274; We store zero personal information. Your privacy is absolute.</p>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', cursor: 'pointer', color: '#888', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
          <input type='checkbox' checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#fff' }} />
          I understand. I will save my account code safely.
        </label>
        <button onClick={onNext} disabled={!confirmed}
          style={{ width: '100%', background: confirmed ? '#fff' : 'transparent', color: confirmed ? '#000' : '#333', border: '2px solid ' + (confirmed ? '#fff' : '#333'), padding: '1rem', fontSize: '0.85rem', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', borderRadius: '4px', cursor: confirmed ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
        >I UNDERSTAND</button>
      </div>
      <div style={{ position: 'absolute', bottom: '2rem', color: '#333', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Ghost Chat · Private By Design</div>
    </div>
  )
}

export default Warning