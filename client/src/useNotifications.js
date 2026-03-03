// useNotifications.js
// Central hook for all Ghost Chat notifications
// Handles: browser push permission, preferences (localStorage), and firing notifications

import { useState, useEffect, useCallback } from 'react'

const PREF_KEY = 'ghost_notif_prefs'

const defaultPrefs = {
  worldChat: false,
  privateChat: true,
  friendRequests: true,
}

export function useNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )

  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem(PREF_KEY)
      return saved ? { ...defaultPrefs, ...JSON.parse(saved) } : defaultPrefs
    } catch {
      return defaultPrefs
    }
  })

  // Save prefs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs))
  }, [prefs])

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'denied'
    if (Notification.permission === 'granted') {
      setPermission('granted')
      return 'granted'
    }
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }, [])

  // Toggle a single preference
  const togglePref = useCallback((key) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  // Fire a notification if permission granted and pref enabled
  const notify = useCallback((type, title, body, icon = '/ghost.png') => {
    if (
      typeof Notification === 'undefined' ||
      Notification.permission !== 'granted' ||
      !prefs[type]
    ) return

    // Don't notify if tab is visible/focused
    if (document.visibilityState === 'visible') return

    try {
      const n = new Notification(title, { body, icon, badge: '/ghost.png', silent: false })
      n.onclick = () => { window.focus(); n.close() }
      // Auto-close after 5 seconds
      setTimeout(() => n.close(), 5000)
    } catch (e) {
      console.warn('Notification failed:', e)
    }
  }, [prefs])

  return { permission, prefs, togglePref, requestPermission, notify }
}
