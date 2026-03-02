import { useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:3001/api'

function Login({ onLogin }) {
  const [mode, setMode] = useState('choice')
  const [accountCode, setAccountCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newAccount, setNewAccount] = useState(null)
  const [saved, setSaved] = useState(false)

  const handleCreateAccount = async () => {
    setError('')
    if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const res = await axios.post(API + '/auth/register', { password })
      localStorage.clear()
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('accountCode', res.data.accountCode)
      localStorage.setItem('friendCode', res.data.friendCode)
      setNewAccount(res.data)
      setMode('created')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account')
    }
    setLoading(false)
  }

  const handleLogin = async () => {
    setError('')
    if (!accountCode || !password) { setError('Please enter your account code and password'); return }
    setLoading(true)
    try {
      const res = await axios.post(API + '/auth/login', { accountCode: accountCode.trim().toUpperCase(), password })
      localStorage.clear()
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('accountCode', res.data.accountCode)
      localStorage.setItem('friendCode', res.data.friendCode)
      localStorage.setItem('isAdmin', res.data.isAdmin ? 'true' : 'false')
      if (res.data.displayName) localStorage.setItem('displayName', res.data.displayName)
      onLogin({ accountCode: res.data.accountCode, friendCode: res.data.friendCode, displayName: res.data.displayName, isAdmin: res.data.isAdmin })
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid account code or password')
    }
    setLoading(false)
  }

  const inputStyle = { width: '100%', padding: '0.9rem 1rem', background: 'transparent', border: '1px solid #333', borderRadius: '4px', color: '#fff', fontSize: '0.9rem', letterSpacing: '0.05em', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }
  const btnPrimary = { width: '100%', background: '#fff', color: '#000', border: '2px solid #fff', padding: '1rem', fontSize: '0.85rem', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s', marginTop: '0.5rem' }
  const btnOutline = { width: '100%', background: 'transparent', color: '#fff', border: '1px solid #333', padding: '1rem', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s' }

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '10%', left: '15%', color: '#fff', fontSize: '2rem', opacity: 0.8, textShadow: '0 0 20px #fff' }}>&#10022;</div>
      <div style={{ position: 'absolute', top: '18%', right: '18%', color: '#fff', fontSize: '0.8rem', opacity: 0.3 }}>&#10022;</div>

      <div style={{ maxWidth: '420px', width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.3))', marginBottom: '0.75rem' }}><img src="/ghost.png" style={{width:"100%",height:"100%",objectFit:"contain"}} /></div>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', fontFamily: 'Arial Black, Impact, sans-serif', letterSpacing: '0.06em', lineHeight: 1 }}>GHOST</div>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: 'transparent', WebkitTextStroke: '2px #fff', fontFamily: 'Arial Black, Impact, sans-serif', letterSpacing: '0.06em', lineHeight: 1, marginBottom: '0.25rem' }}>CHAT</div>
        </div>

        {error && <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid #ff4444', borderRadius: '4px', padding: '0.75rem', marginBottom: '1rem', color: '#ff4444', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}

        {mode === 'choice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button onClick={() => setMode('create')} style={btnPrimary}
              onMouseEnter={e => { e.target.style.background = 'transparent'; e.target.style.color = '#fff' }}
              onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.color = '#000' }}
            >Create New Account</button>
            <button onClick={() => setMode('login')} style={btnOutline}
              onMouseEnter={e => { e.target.style.borderColor = '#fff'; e.target.style.color = '#fff' }}
              onMouseLeave={e => { e.target.style.borderColor = '#333'; e.target.style.color = '#fff' }}
            >I Already Have An Account</button>
          </div>
        )}

        {mode === 'create' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input type='password' placeholder='Create a password' value={password} onChange={e => setPassword(e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#fff'} onBlur={e => e.target.style.borderColor = '#333'} />
            <input type='password' placeholder='Confirm password' value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#fff'} onBlur={e => e.target.style.borderColor = '#333'} />
            <button onClick={handleCreateAccount} disabled={loading} style={btnPrimary}
              onMouseEnter={e => { e.target.style.background = 'transparent'; e.target.style.color = '#fff' }}
              onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.color = '#000' }}
            >{loading ? 'Creating...' : 'Create Account'}</button>
            <button onClick={() => { setMode('choice'); setError('') }} style={btnOutline}>Back</button>
          </div>
        )}

        {mode === 'created' && newAccount && (
          <div>
            <p style={{ color: '#888', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', textAlign: 'center' }}>Your Account Code</p>
            <div style={{ background: 'transparent', border: '1px solid #fff', borderRadius: '4px', padding: '1.25rem', fontSize: '1.4rem', letterSpacing: '0.2em', textAlign: 'center', fontFamily: 'monospace', color: '#fff', marginBottom: '0.5rem', fontWeight: 700 }}>
              {newAccount.accountCode}
            </div>
            <p style={{ color: '#ff4444', fontSize: '0.78rem', letterSpacing: '0.05em', marginBottom: '1.5rem', textAlign: 'center' }}>
              &#9888; Save this code now. You cannot recover it later.
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', cursor: 'pointer', color: '#888', fontSize: '0.82rem' }}>
              <input type='checkbox' checked={saved} onChange={e => setSaved(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#fff' }} />
              I have saved my account code safely
            </label>
            <button onClick={() => {
              if (!saved) { setError('Please confirm you have saved your code'); return }
              onLogin({ accountCode: newAccount.accountCode, friendCode: newAccount.friendCode, displayName: null, isAdmin: false })
            }} disabled={!saved} style={{ ...btnPrimary, background: saved ? '#fff' : 'transparent', color: saved ? '#000' : '#333', borderColor: saved ? '#fff' : '#333' }}
              onMouseEnter={e => { if (saved) { e.target.style.background = 'transparent'; e.target.style.color = '#fff' } }}
              onMouseLeave={e => { if (saved) { e.target.style.background = '#fff'; e.target.style.color = '#000' } }}
            >Enter Ghost Chat</button>
          </div>
        )}

        {mode === 'login' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input type='text' placeholder='Account code (XXXX-XXXX-XXXX-XXXX)' value={accountCode} onChange={e => setAccountCode(e.target.value)} style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.1em' }}
              onFocus={e => e.target.style.borderColor = '#fff'} onBlur={e => e.target.style.borderColor = '#333'} />
            <input type='password' placeholder='Password' value={password} onChange={e => setPassword(e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#fff'} onBlur={e => e.target.style.borderColor = '#333'}
              onKeyDown={e => { if (e.key === 'Enter') handleLogin() }} />
            <button onClick={handleLogin} disabled={loading} style={btnPrimary}
              onMouseEnter={e => { e.target.style.background = 'transparent'; e.target.style.color = '#fff' }}
              onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.color = '#000' }}
            >{loading ? 'Logging in...' : 'Login'}</button>
            <button onClick={() => { setMode('choice'); setError('') }} style={btnOutline}>Back</button>
          </div>
        )}
      </div>
      <div style={{ position: 'absolute', bottom: '2rem', color: '#333', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Ghost Chat · Private By Design</div>
    </div>
  )
}

export default Login