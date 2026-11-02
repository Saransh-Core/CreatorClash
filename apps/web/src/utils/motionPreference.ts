import { useEffect, useSyncExternalStore } from 'react'

const settingsKey = 'creator-clash-community-settings'
const preferenceEvent = 'creator-clash-motion-preference-change'

function getStoredPreference() {
  try {
    const settings = localStorage.getItem(settingsKey)
    if (!settings) return false
    return Boolean((JSON.parse(settings) as { reducedMotion?: unknown }).reducedMotion)
  } catch {
    return false
  }
}

function getSnapshot() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches || getStoredPreference()
}

function subscribe(callback: () => void) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  media.addEventListener('change', callback)
  window.addEventListener(preferenceEvent, callback)
  return () => {
    media.removeEventListener('change', callback)
    window.removeEventListener(preferenceEvent, callback)
  }
}

export function useMotionPreference() {
  const reducedMotion = useSyncExternalStore(subscribe, getSnapshot, () => false)
  useEffect(() => {
    document.documentElement.dataset['reducedMotion'] = String(reducedMotion)
  }, [reducedMotion])
  return reducedMotion
}

export function announceMotionPreferenceChange() {
  window.dispatchEvent(new Event(preferenceEvent))
}
