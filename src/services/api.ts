import type { PurchaseStatus } from '../types'
import { clientStorage } from './clientStorage'

const API_BASE = '/api'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

let isBackendAvailable: boolean | null = null

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // If we already detected the backend is unavailable (e.g. running on Vercel static hosting)
  if (isBackendAvailable === false) {
    throw new Error('BACKEND_UNAVAILABLE')
  }

  try {
    const url = `${API_BASE}${endpoint}`
    const headers = {
      ...getAuthHeader(),
      ...options.headers
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    // If Vercel or static hosting returns 404 or index.html SPA fallback
    if (response.status === 404 || response.status === 502 || response.status === 503) {
      isBackendAvailable = false
      throw new Error('BACKEND_UNAVAILABLE')
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('text/html')) {
      isBackendAvailable = false
      throw new Error('BACKEND_UNAVAILABLE')
    }

    if (response.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.dispatchEvent(new Event('auth:unauthorized'))
      }
    }

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new ApiError(data.error || 'Ocorreu um erro na requisição.', response.status)
    }

    isBackendAvailable = true
    return data as T
  } catch (err: any) {
    if (err.message === 'BACKEND_UNAVAILABLE' || err.name === 'TypeError' || err.message?.includes('fetch')) {
      isBackendAvailable = false
      throw new Error('BACKEND_UNAVAILABLE')
    }
    throw err
  }
}

export const api = {
  // Auth
  login: async (credentials: { email: string; password: string }) => {
    try {
      return await request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE') {
        return await clientStorage.login(credentials)
      }
      throw err
    }
  },

  getCurrentUser: async () => {
    try {
      return await request<{ user: any }>('/auth/me')
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE') {
        return await clientStorage.getCurrentUser()
      }
      throw err
    }
  },

  // Teams
  getTeams: async () => {
    try {
      return await request<any[]>('/teams')
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE') {
        return await clientStorage.getTeams()
      }
      throw err
    }
  },

  getTeam: async (id: string) => {
    try {
      return await request<any>(`/teams/${id}`)
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE') {
        return await clientStorage.getTeam(id)
      }
      throw err
    }
  },

  createTeam: async (data: any) => {
    try {
      return await request<any>('/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE') {
        return await clientStorage.createTeam(data)
      }
      throw err
    }
  },

  // File Upload
  uploadFile: async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const token = localStorage.getItem('token')

      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      })

      if (response.status === 404 || response.status === 502) {
        throw new Error('BACKEND_UNAVAILABLE')
      }

      const data = await response.json()
      if (!response.ok) {
        throw new ApiError(data.error || 'Falha ao enviar arquivo.', response.status)
      }
      return data as { fileUrl: string; fileName: string; originalName: string; size: number }
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE' || err.name === 'TypeError') {
        const localFile = await clientStorage.uploadReceipt(file)
        return {
          fileUrl: localFile.fileUrl,
          fileName: localFile.fileName,
          originalName: file.name,
          size: file.size
        }
      }
      throw err
    }
  },

  // Dashboard & Financial Reports
  getDashboard: async (teamId?: string) => {
    try {
      const query = teamId && teamId !== 'all' ? `?teamId=${teamId}` : ''
      return await request<any>(`/reports/dashboard${query}`)
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE') {
        return await clientStorage.getDashboardMetrics({ teamId })
      }
      throw err
    }
  },

  getStatement: async (params?: { teamId?: string; startDate?: string; endDate?: string; category?: string }) => {
    try {
      const query = new URLSearchParams()
      if (params?.teamId && params.teamId !== 'all') query.set('teamId', params.teamId)
      if (params?.startDate) query.set('startDate', params.startDate)
      if (params?.endDate) query.set('endDate', params.endDate)
      if (params?.category && params.category !== 'all') query.set('category', params.category)

      const qStr = query.toString() ? `?${query.toString()}` : ''
      return await request<any>(`/reports/statement${qStr}`)
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE') {
        return await clientStorage.getStatement(params)
      }
      throw err
    }
  },

  // Sponsorships
  getSponsorships: async (teamId?: string) => {
    try {
      const query = teamId && teamId !== 'all' ? `?teamId=${teamId}` : ''
      return await request<any[]>(`/sponsorships${query}`)
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE') {
        return await clientStorage.getSponsorships({ teamId })
      }
      throw err
    }
  },

  createSponsorship: async (data: any) => {
    try {
      return await request<any>('/sponsorships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE') {
        return await clientStorage.createSponsorship(data)
      }
      throw err
    }
  },

  deleteSponsorship: async (id: string) => {
    try {
      return await request<any>(`/sponsorships/${id}`, {
        method: 'DELETE'
      })
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE') {
        return await clientStorage.deleteSponsorship(id)
      }
      throw err
    }
  },

  // Expenses
  getExpenses: async (teamId?: string) => {
    try {
      const query = teamId && teamId !== 'all' ? `?teamId=${teamId}` : ''
      return await request<any[]>(`/expenses${query}`)
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE') {
        return await clientStorage.getExpenses({ teamId })
      }
      throw err
    }
  },

  createExpense: async (data: any) => {
    try {
      return await request<any>('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE') {
        return await clientStorage.createExpense(data)
      }
      throw err
    }
  },

  deleteExpense: async (id: string) => {
    try {
      return await request<any>(`/expenses/${id}`, {
        method: 'DELETE'
      })
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE') {
        return await clientStorage.deleteExpense(id)
      }
      throw err
    }
  },

  // Purchase Requests
  getPurchaseRequests: async (teamId?: string, status?: string) => {
    try {
      const query = new URLSearchParams()
      if (teamId && teamId !== 'all') query.set('teamId', teamId)
      if (status && status !== 'all') query.set('status', status)
      const qStr = query.toString() ? `?${query.toString()}` : ''
      return await request<any[]>(`/purchase-requests${qStr}`)
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE') {
        return await clientStorage.getPurchaseRequests({ teamId, status })
      }
      throw err
    }
  },

  getPurchaseRequest: async (id: string) => {
    try {
      return await request<any>(`/purchase-requests/${id}`)
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE') {
        return await clientStorage.getPurchaseRequest(id)
      }
      throw err
    }
  },

  createPurchaseRequest: async (data: any) => {
    try {
      return await request<any>('/purchase-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE') {
        return await clientStorage.createPurchaseRequest(data)
      }
      throw err
    }
  },

  updatePurchaseRequest: async (id: string, data: any) => {
    try {
      return await request<any>(`/purchase-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE') {
        return await clientStorage.updatePurchaseStatus(id, data)
      }
      throw err
    }
  },

  updatePurchaseRequestStatus: async (
    id: string,
    data: { status: string; reviewNotes?: string; approvedAmount?: number }
  ) => {
    try {
      return await request<any>(`/purchase-requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE') {
        return await clientStorage.updatePurchaseStatus(id, {
          status: data.status as PurchaseStatus,
          comment: data.reviewNotes,
          approvedAmount: data.approvedAmount
        })
      }
      throw err
    }
  },

  completePurchaseRequest: async (
    id: string,
    data: {
      finalActualAmount: number
      finalReceiptUrl?: string | null
      finalReceiptFileName?: string | null
      notes?: string
      supplier?: string
    }
  ) => {
    try {
      return await request<any>(`/purchase-requests/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE') {
        return await clientStorage.completePurchase(id, data)
      }
      throw err
    }
  },

  // Audit Logs
  getAuditLogs: async (teamId?: string) => {
    try {
      const query = teamId && teamId !== 'all' ? `?teamId=${teamId}` : ''
      return await request<any[]>(`/audit-logs${query}`)
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE') {
        return await clientStorage.getAuditLogs({ teamId })
      }
      throw err
    }
  },

  // Reset demo
  resetDemoData: async () => {
    try {
      return await request<any>('/admin/reset-demo', {
        method: 'POST'
      })
    } catch (err: any) {
      if (err.message === 'BACKEND_UNAVAILABLE') {
        return await clientStorage.resetDemoData()
      }
      throw err
    }
  }
}
