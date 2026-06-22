'use client'
import { useEffect, useState } from 'react'

export function useAuth() {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setToken(localStorage.getItem('token'))
    try {
      setUser(JSON.parse(localStorage.getItem('user') ?? 'null'))
    } catch {
      setUser(null)
    }
    setReady(true)
  }, [])

  const login = (token: string, user: any) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    window.location.href = '/dashboard'
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  return { token, user, login, logout, isAuthenticated: !!token, ready }
}