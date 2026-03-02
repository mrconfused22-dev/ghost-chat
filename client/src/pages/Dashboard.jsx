import { useState } from 'react'
import WorldChat from './WorldChat'
import Chats from './Chats'
import Friends from './Friends'
import Groups from './Groups'
import AdminPanel from './AdminPanel'

const NAV = [
  { id: 'world',   label: 'World',   svg: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z' },
  { id: 'chats',   label: 'Chats',   svg: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z' },
  { id: 'friends', label: 'Friends', svg: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
  { id: 'groups',  label: 'Groups',  svg: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
]

function SideBtn({ item, active, onClick, unread }) {
  const [hover, setHover] = useState(false)
  const col = active ? '#fff' : hover ? '#aaa' : '#444'
  const bg = active ? 'rgba(255,255,255,0.08)' : hover ? 'rgba(255,255,255,0.04)' : 'transparent'
  const ring = active ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent'
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={item.label}
      style={{ position: 'relative', width: '56px', height: '56px', background: bg, border: ring, borderRadius: '14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'all 0.2s', marginBottom: '4px' }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill={col} style={{ transition: 'fill 0.2s' }}>
        <path d={item.svg} />
      </svg>
      <span style={{ fontSize: '0.4rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: col, transition: 'color 0.2s', lineHeight: 1 }}>{item.label}</span>
      {unread > 0 && (
        <div style={{ position: 'absolute', top: '6px', right: '6px', background: '#ff4444', color: '#fff', borderRadius: '50%', minWidth: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', fontWeight: 900 }}>
          {unread > 99 ? '99+' : unread}
        </div>
      )}
    </button>
  )
}

function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState('world')
  const [chatsUnread, setChatsUnread] = useState(0)
  const [groupsUnread, setGroupsUnread] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsHover, setSettingsHover] = useState(false)

  const nav = [...NAV]
  if (user.isAdmin) nav.push({ id: 'admin', label: 'Admin', svg: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z' })

  const unreadMap = { chats: chatsUnread, groups: groupsUnread }
  const settingCol = showSettings ? '#fff' : settingsHover ? '#aaa' : '#444'
  const settingBg = showSettings ? 'rgba(255,255,255,0.08)' : settingsHover ? 'rgba(255,255,255,0.04)' : 'transparent'

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: '68px', background: '#050505', borderRight: '1px solid #111', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', flexShrink: 0 }}>
        {/* Ghost logo */}
        <div style={{ fontSize: '1.6rem', marginBottom: '20px', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))' }}><img src="/ghost.png" style={{width:"100%",height:"100%",objectFit:"contain"}} /></div>

        {/* Nav */}
        {nav.map(item => (
          <SideBtn key={item.id} item={item} active={!showSettings && tab === item.id} onClick={() => { setTab(item.id); setShowSettings(false) }} unread={unreadMap[item.id] || 0} />
        ))}

        <div style={{ flex: 1 }} />

        {/* Settings */}
        <button
          onClick={() => { setShowSettings(!showSettings); setTab('') }}
          onMouseEnter={() => setSettingsHover(true)}
          onMouseLeave={() => setSettingsHover(false)}
          title="Settings"
          style={{ width: '56px', height: '56px', background: settingBg, border: showSettings ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent', borderRadius: '14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'all 0.2s' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={settingCol} style={{ transition: 'fill 0.2s' }}>
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
          <span style={{ fontSize: '0.4rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: settingCol, lineHeight: 1 }}>SETTINGS</span>
        </button>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {showSettings && (
          <div style={{ height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
            <div style={{ maxWidth: '400px', width: '100%', zIndex: 1 }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}><img src="/ghost.png" style={{width:"100%",height:"100%",objectFit:"contain"}} /></div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', fontFamily: 'Arial Black, Impact, sans-serif', letterSpacing: '0.06em' }}>SETTINGS</div>
              </div>
              <div style={{ border: '1px solid #1a1a1a', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #1a1a1a' }}>
                  <div style={{ color: '#555', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Display Name</div>
                  <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>{user.displayName || 'Ghost'}</div>
                </div>
                <div style={{ padding: '1rem', borderBottom: '1px solid #1a1a1a' }}>
                  <div style={{ color: '#555', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Friend Code</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ color: '#fff', fontSize: '0.95rem', fontFamily: 'monospace', letterSpacing: '0.1em' }}>{user.friendCode}</div>
                    <button onClick={() => { navigator.clipboard.writeText(user.friendCode); alert('Copied!') }} style={{ background: '#fff', color: '#000', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 900 }}>COPY</button>
                  </div>
                </div>
                <div style={{ padding: '1rem' }}>
                  <div style={{ color: '#555', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Account Code</div>
                  <div style={{ color: '#333', fontSize: '0.8rem' }}>Hidden for security. Keep it saved somewhere safe.</div>
                </div>
              </div>
              <button onClick={onLogout}
                style={{ width: '100%', background: 'transparent', color: '#ff4444', border: '1px solid #ff4444', padding: '1rem', fontSize: '0.85rem', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ff4444'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ff4444' }}
              >Logout</button>
            </div>
          </div>
        )}
        {!showSettings && tab === 'world' && <WorldChat user={user} />}
        {!showSettings && tab === 'chats' && <Chats user={user} onUnreadChange={setChatsUnread} />}
        {!showSettings && tab === 'friends' && <Friends user={user} />}
        {!showSettings && tab === 'groups' && <Groups user={user} onUnreadChange={setGroupsUnread} />}
        {!showSettings && tab === 'admin' && user.isAdmin && <AdminPanel user={user} />}
      </div>
    </div>
  )
}

export default Dashboard