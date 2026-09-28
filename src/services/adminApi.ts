import type { UserRole } from '../types'
import { clientStorage } from './clientStorage'

const API_BASE = '/api'

export class AdminApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const isStaticHosting =
  typeof window !== 'undefined' &&
  (window.location.hostname.includes('vercel.app') ||
    (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')) &&
  !import.meta.env.VITE_API_URL

let isBackendAvailable = !isStaticHosting

function authHeader(): Record<string, string> {
  const token = sessionStorage.getItem('admin_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (isStaticHosting || isBackendAvailable === false) {
    throw new Error('BACKEND_UNAVAILABLE')
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: { ...authHeader(), ...options.headers }
    })

    if (!response.ok) {
      if ([404, 405, 502, 503].includes(response.status)) {
        isBackendAvailable = false
        throw new Error('BACKEND_UNAVAILABLE')
      }
      const data = await response.json().catch(() => ({}))
      throw new AdminApiError(data.error || 'Ocorreu um erro na requisição.', response.status)
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('text/html')) {
      isBackendAvailable = false
      throw new Error('BACKEND_UNAVAILABLE')
    }

    isBackendAvailable = true
    return (await response.json().catch(() => ({}))) as T
  } catch (err: any) {
    if (
      err.message === 'BACKEND_UNAVAILABLE' ||
      err.name === 'TypeError' ||
      err.message?.includes('fetch') ||
      err.message?.includes('NetworkError') ||
      err.message?.includes('Failed to fetch')
    ) {
      isBackendAvailable = false
      throw new Error('BACKEND_UNAVAILABLE')
    }
    throw err
  }
}

// Runs the backend request and transparently switches to the local storage engine when it is unreachable
async function withFallback<T>(backendCall: () => Promise<T>, localCall: () => Promise<T>): Promise<T> {
  if (isStaticHosting || !isBackendAvailable) {
    return localCall()
  }
  try {
    return await backendCall()
  } catch (err: any) {
    if (err.message === 'BACKEND_UNAVAILABLE') {
      return localCall()
    }
    throw err
  }
}

export const adminApi = {
  login: async (email: string, password: string) => {
    return withFallback(
      () => request<{ token: string; user: any }>('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      }),
      () => clientStorage.adminLogin(email, password)
    )
  },

  getTeams: async () => {
    return withFallback(
      () => request<any[]>('/admin/teams'),
      () => clientStorage.adminGetTeams()
    )
  },

  getUsers: async () => {
    return withFallback(
      () => request<any[]>('/admin/users'),
      () => clientStorage.adminGetUsers()
    )
  },

  createUser: async (payload: any) => {
    return withFallback(
      () => request<any>('/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }),
      () => clientStorage.adminCreateUser(payload)
    )
  },

  updateUser: async (id: string, payload: any) => {
    return withFallback(
      () => request<any>(`/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }),
      () => clientStorage.adminUpdateUser(id, payload)
    )
  },

  deleteUser: async (id: string) => {
    return withFallback(
      () => request<any>(`/admin/users/${id}`, { method: 'DELETE' }),
      () => clientStorage.adminDeleteUser(id)
    )
  },

  createTeam: async (payload: any) => {
    return withFallback(
      () => request<any>('/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }),
      () => clientStorage.createTeam(payload)
    )
  },

  updateTeam: async (id: string, payload: any) => {
    return withFallback(
      () => request<any>(`/admin/teams/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }),
      () => clientStorage.adminUpdateTeam(id, payload)
    )
  },

  deleteTeam: async (id: string) => {
    return withFallback(
      () => request<any>(`/admin/teams/${id}`, { method: 'DELETE' }),
      () => clientStorage.adminDeleteTeam(id)
    )
  }
}

export type { UserRole }
