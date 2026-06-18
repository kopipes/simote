'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, User } from '@/lib/api'

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

  const login = async (email: string, password: string) => {
    const { user } = await api.login(email, password)
    setUser(user)
  }

  const register = async (name: string, email: string, password: string, username?: string) => {
    const { user } = await api.register(name, email, password, username)
    setUser(user)
  }

  const logout = async () => {
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
