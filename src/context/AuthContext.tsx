'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { api, User } from '@/lib/api'
import { useRouter } from 'next/navigation'

const INACTIVITY_TIMEOUT = 15 * 60 * 1000 // 15 minutes
const THROTTLE_DELAY = 2000               // 2 seconds throttle
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'] as const

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, username?: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const defaultValue: AuthContextValue = {
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refresh: async () => {},
}

const AuthContext = createContext<AuthContextValue>(defaultValue)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Use refs to avoid stale closures and unnecessary effect re-runs
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const throttleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const throttleActive = useRef(false)
  const routerRef = useRef(router)
  const userRef = useRef(user)

  // Keep refs in sync with latest values without causing effect re-runs
  useEffect(() => { routerRef.current = router }, [router])
  useEffect(() => { userRef.current = user }, [user])

  const refresh = useCallback(async () => {
    try {
      const { user } = await api.me()
      setUser(user)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  // Stable ref-based reset — never changes identity, so no event listener churn
  const resetInactivityTimer = useRef(() => {
    // Throttle: ignore if within 2 seconds of last reset
    if (throttleActive.current) return
    throttleActive.current = true

    if (throttleTimer.current) clearTimeout(throttleTimer.current)
    throttleTimer.current = setTimeout(() => {
      throttleActive.current = false
    }, THROTTLE_DELAY)

    // Reset the inactivity countdown
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(async () => {
      if (!userRef.current) return
      try {
        await api.logout()
      } catch {}
      setUser(null)
      routerRef.current.push('/login')
    }, INACTIVITY_TIMEOUT)
  })

  useEffect(() => {
    if (!user) {
      // Clear timers when not logged in
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      if (throttleTimer.current) clearTimeout(throttleTimer.current)
      throttleActive.current = false
      return
    }

    const handler = resetInactivityTimer.current

    // Start the initial countdown
    handler()

    // Attach activity listeners once
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, handler, { passive: true })
    )

    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      if (throttleTimer.current) clearTimeout(throttleTimer.current)
      throttleActive.current = false
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, handler)
      )
    }
  }, [user]) // only re-run when login state changes

  const login = async (email: string, password: string) => {
    const { user } = await api.login(email, password)
    setUser(user)
  }

  const register = async (name: string, email: string, password: string, username?: string) => {
    const { user } = await api.register(name, email, password, username)
    setUser(user)
  }

  const logout = async () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    if (throttleTimer.current) clearTimeout(throttleTimer.current)
    await api.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
