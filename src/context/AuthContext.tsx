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
  isSystemAdmin: boolean
  isTechnicalLead: boolean
  isCoach: boolean
  isStudent: boolean
  isTeamRep: boolean
  canApprovePurchases: boolean
  canManageFinances: boolean
  hasGlobalAccess: boolean
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

  const isSystemAdmin = user?.role === 'system_admin'
  const isTechnicalLead = user?.role === 'technical_lead'
  const isCoach = user?.role === 'team_coach' || user?.role === 'team_rep'
  const isStudent = user?.role === 'student'
  const isTeamRep = isCoach
  const canApprovePurchases = isCoach
  const hasGlobalAccess = isSystemAdmin || isTechnicalLead
  const canManageFinances = hasGlobalAccess || isCoach

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
    if (!hasGlobalAccess && user?.teamId) {
      setSelectedTeamId(user.teamId)
    }
  }, [user, hasGlobalAccess])

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.login(credentials)
    setToken(res.token)
    setUser(res.user)
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
    if (res.user.role !== 'system_admin' && res.user.role !== 'technical_lead' && res.user.teamId) {
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
        isSystemAdmin,
        isTechnicalLead,
        isCoach,
        isStudent,
        isTeamRep,
        canApprovePurchases,
        canManageFinances,
        hasGlobalAccess
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
