// NotificationSettings.jsx
// Settings panel section for notification preferences
// Drop this inside Dashboard's settings panel

import { useNotifications } from '../hooks/useNotifications'

function Toggle({ enabled, onToggle, disabled }) {
  return (
    <div
      onClick={disabled ? undefined : onToggle}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        background: enabled ? '#00e87a' : '#222',
        border: `1px solid ${enabled ? '#00e87a' : '#333'}`,
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.25s',
        flexShrink: 0,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <div style={{
        position: 'absolute',
        top: '3px',
        left: enabled ? '22px' : '3px',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.25s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
      }} />
    </div>
  )
}

function NotificationSettings() {
  const { permission, prefs, togglePref, requestPermission } = useNotifications()

  const blocked = permission === 'denied'
  const needsGrant = permission === 'default'

  const rows = [
    {
      key: 'worldChat',
      icon: '🪐',
      label: 'World Chat',
      desc: 'New messages in the global chat room',
    },
    {
      key: 'privateChat',
      icon: '💬',
      label: 'Private Messages',
      desc: 'New messages from friends',
    },
    {
      key: 'friendRequests',
      icon: '👤',
      label: 'Friend Requests',
      desc: 'When someone sends you a friend request',
    },
  ]

  return (
    <div style={{ marginTop: '1.5rem' }}>
      {/* Section header */}
      <div style={{ color: '#555', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
        Notifications
      </div>

      {/* Permission banner */}
      {blocked && (
        <div style={{
          background: 'rgba(255,68,68,0.08)',
          border: '1px solid rgba(255,68,68,0.25)',
          borderRadius: '8px',
          padding: '0.85rem 1rem',
          marginBottom: '0.75rem',
          fontSize: '0.8rem',
          color: '#ff4444',
          lineHeight: 1.5,
        }}>
          🚫 Notifications are blocked in your browser. Enable them in your browser settings to use this feature.
        </div>
      )}

      {needsGrant && (
        <div style={{
          background: 'rgba(0,232,122,0.06)',
          border: '1px solid rgba(0,232,122,0.2)',
          borderRadius: '8px',
          padding: '0.85rem 1rem',
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}>
          <span style={{ color: '#888', fontSize: '0.8rem', lineHeight: 1.5 }}>
            Allow notifications to get alerts when you're away.
          </span>
          <button
            onClick={requestPermission}
            style={{
              background: '#00e87a',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              padding: '0.45rem 0.9rem',
              fontSize: '0.75rem',
              fontWeight: 900,
              letterSpacing: '0.05em',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ALLOW
          </button>
        </div>
      )}

      {/* Toggle rows */}
      <div style={{ border: '1px solid #1a1a1a', borderRadius: '8px', overflow: 'hidden' }}>
        {rows.map((row, i) => (
          <div
            key={row.key}
            style={{
              padding: '1rem',
              borderBottom: i < rows.length - 1 ? '1px solid #1a1a1a' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
            }}
          >
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{row.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#e8e8e8', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                {row.label}
              </div>
              <div style={{ color: '#555', fontSize: '0.75rem' }}>{row.desc}</div>
            </div>
            <Toggle
              enabled={prefs[row.key] && permission === 'granted'}
              onToggle={async () => {
                if (permission !== 'granted') {
                  const result = await requestPermission()
                  if (result !== 'granted') return
                }
                togglePref(row.key)
              }}
              disabled={blocked}
            />
          </div>
        ))}
      </div>

      {permission === 'granted' && (
        <p style={{ color: '#333', fontSize: '0.72rem', marginTop: '0.6rem', textAlign: 'center' }}>
          Notifications only fire when you're on a different tab or window.
        </p>
      )}
    </div>
  )
}

export default NotificationSettings
