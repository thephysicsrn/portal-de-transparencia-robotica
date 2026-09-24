import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User, Team } from '../types'
import { api } from '../services/api'


interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  selectedTeamId: string
  setSelectedTeamId: (teamId: string) => void
  teams: Team[]
  login: (credentials: { email: string; password: string }) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  refreshTeams: () => Promise<void>
  isTechnicalLead: boolean
  isTeamRep: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  const isTechnicalLead = user?.role === 'technical_lead'
  const isTeamRep = user?.role === 'team_rep'

  const loadTeams = async () => {
    try {
      const data = await api.getTeams()
      setTeams(data)
    } catch (err) {
      console.error('Erro ao carregar equipes:', err)
    }
  }

  const refreshUser = async () => {
    if (!token) {
      setIsLoading(false)
      return
    }
    try {
      const { user: updatedUser } = await api.getCurrentUser()
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
    } catch {
      logout()
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      refreshUser()
      loadTeams()
    } else {
      setIsLoading(false)
    }

    const handleUnauthorized = () => {
      logout()
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [token])

  useEffect(() => {
    if (isTeamRep && user?.teamId) {
      setSelectedTeamId(user.teamId)
    }
  }, [user, isTeamRep])

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.login(credentials)
    setToken(res.token)
    setUser(res.user)
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
    if (res.user.role === 'team_rep' && res.user.teamId) {
      setSelectedTeamId(res.user.teamId)
    } else {
      setSelectedTeamId('all')
    }
    await loadTeams()
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setSelectedTeamId('all')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        selectedTeamId,
        setSelectedTeamId,
        teams,
        login,
        logout,
        refreshUser,
        refreshTeams: loadTeams,
        isTechnicalLead,
        isTeamRep
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
