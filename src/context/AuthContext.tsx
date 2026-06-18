'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { api, User } from '@/lib/api'
import { useRouter } from 'next/navigation'

const INACTIVITY_TIMEOUT = 15 * 60 * 1000 // 15 minutes in ms
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click']

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
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Inactivity auto-logout
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(async () => {
      // Only logout if user is logged in
      try {
        await api.logout()
      } catch {}
      setUser(null)
      router.push('/login')
    }, INACTIVITY_TIMEOUT)
  }, [router])

  useEffect(() => {
    if (!user) {
      // Clear timer when logged out
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      return
    }

    // Start timer on login
    resetInactivityTimer()

    // Listen for activity events
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetInactivityTimer, { passive: true })
    )

    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, resetInactivityTimer)
      )
    }
  }, [user, resetInactivityTimer])

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
