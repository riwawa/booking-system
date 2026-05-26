'use client'

export function useAuth() {
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const getUser = () => {
    if (typeof window === 'undefined') return null
    try { return JSON.parse(localStorage.getItem('user') ?? 'null') } catch { return null }
  }
  const login = (token: string, user: any) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    window.location.reload()
  }
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }
  return { token: getToken(), user: getUser(), login, logout, isAuthenticated: !!getToken() }
}
