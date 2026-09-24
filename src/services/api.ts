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

// Check if running on Vercel or any static production host without an explicit API URL
const isStaticHosting =
  typeof window !== 'undefined' &&
  (window.location.hostname.includes('vercel.app') ||
    (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')) &&
  !import.meta.env.VITE_API_URL

let isBackendAvailable = !isStaticHosting

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (isStaticHosting || isBackendAvailable === false) {
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

    if (!response.ok) {
      if ([404, 405, 502, 503].includes(response.status)) {
        isBackendAvailable = false
        throw new Error('BACKEND_UNAVAILABLE')
      }
      const data = await response.json().catch(() => ({}))
      throw new ApiError(data.error || 'Ocorreu um erro na requisição.', response.status)
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
    isBackendAvailable = true
    return data as T
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

export const api = {
  // Auth
  login: async (credentials: { email: string; password: string }) => {
    if (isStaticHosting || !isBackendAvailable) {
      return await clientStorage.login(credentials)
    }
    try {
      return await request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })
    } catch {
      return await clientStorage.login(credentials)
    }
  },

  getCurrentUser: async () => {
    if (isStaticHosting || !isBackendAvailable) {
      return await clientStorage.getCurrentUser()
    }
    try {
      return await request<{ user: any }>('/auth/me')
    } catch {
      return await clientStorage.getCurrentUser()
    }
  },

  // Teams
  getTeams: async () => {
    if (isStaticHosting || !isBackendAvailable) {
      return await clientStorage.getTeams()
    }
    try {
      return await request<any[]>('/teams')
    } catch {
      return await clientStorage.getTeams()
    }
  },

  getTeam: async (id: string) => {
    if (isStaticHosting || !isBackendAvailable) {
      return await clientStorage.getTeam(id)
    }
    try {
      return await request<any>(`/teams/${id}`)
    } catch {
      return await clientStorage.getTeam(id)
    }
  },

  createTeam: async (data: any) => {
    if (isStaticHosting || !isBackendAvailable) {
      return await clientStorage.createTeam(data)
    }
    try {
      return await request<any>('/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch {
      return await clientStorage.createTeam(data)
    }
  },

  // File Upload
  uploadFile: async (file: File) => {
    if (isStaticHosting || !isBackendAvailable) {
      const localFile = await clientStorage.uploadReceipt(file)
      return {
        fileUrl: localFile.fileUrl,
        fileName: localFile.fileName,
        originalName: file.name,
        size: file.size
      }
    }
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

      if (!response.ok) {
        throw new Error('BACKEND_UNAVAILABLE')
      }

      const data = await response.json()
      return data as { fileUrl: string; fileName: string; originalName: string; size: number }
    } catch {
      const localFile = await clientStorage.uploadReceipt(file)
      return {
        fileUrl: localFile.fileUrl,
        fileName: localFile.fileName,
        originalName: file.name,
        size: file.size
      }
    }
  },

  // Dashboard & Financial Reports
  getDashboard: async (teamId?: string) => {
    if (isStaticHosting || !isBackendAvailable) {
      return await clientStorage.getDashboardMetrics({ teamId })
    }
    try {
      const query = teamId && teamId !== 'all' ? `?teamId=${teamId}` : ''
      return await request<any>(`/reports/dashboard${query}`)
    } catch {
      return await clientStorage.getDashboardMetrics({ teamId })
    }
  },

  getStatement: async (params?: { teamId?: string; startDate?: string; endDate?: string; category?: string }) => {
    if (isStaticHosting || !isBackendAvailable) {
      return await clientStorage.getStatement(params)
    }
    try {
      const query = new URLSearchParams()
      if (params?.teamId && params.teamId !== 'all') query.set('teamId', params.teamId)
      if (params?.startDate) query.set('startDate', params.startDate)
      if (params?.endDate) query.set('endDate', params.endDate)
      if (params?.category && params.category !== 'all') query.set('category', params.category)

      const qStr = query.toString() ? `?${query.toString()}` : ''
      return await request<any>(`/reports/statement${qStr}`)
    } catch {
      return await clientStorage.getStatement(params)
    }
  },

  // Sponsorships
  getSponsorships: async (teamId?: string) => {
    if (isStaticHosting || !isBackendAvailable) {
      return await clientStorage.getSponsorships({ teamId })
    }
    try {
      const query = teamId && teamId !== 'all' ? `?teamId=${teamId}` : ''
      return await request<any[]>(`/sponsorships${query}`)
    } catch {
      return await clientStorage.getSponsorships({ teamId })
    }
  },

  createSponsorship: async (data: any) => {
    if (isStaticHosting || !isBackendAvailable) {
      return await clientStorage.createSponsorship(data)
    }
    try {
      return await request<any>('/sponsorships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch {
      return await clientStorage.createSponsorship(data)
    }
  },

  deleteSponsorship: async (id: string) => {
    if (isStaticHosting || !isBackendAvailable) {
      return await clientStorage.deleteSponsorship(id)
    }
    try {
      return await request<any>(`/sponsorships/${id}`, {
        method: 'DELETE'
      })
    } catch {
      return await clientStorage.deleteSponsorship(id)
    }
  },

  // Expenses
  getExpenses: async (teamId?: string) => {
    if (isStaticHosting || !isBackendAvailable) {
      return await clientStorage.getExpenses({ teamId })
    }
    try {
      const query = teamId && teamId !== 'all' ? `?teamId=${teamId}` : ''
      return await request<any[]>(`/expenses${query}`)
    } catch {
      return await clientStorage.getExpenses({ teamId })
    }
  },

  createExpense: async (data: any) => {
    if (isStaticHosting || !isBackendAvailable) {
      return await clientStorage.createExpense(data)
    }
    try {
      return await request<any>('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch {
      return await clientStorage.createExpense(data)
    }
  },

  deleteExpense: async (id: string) => {
    if (isStaticHosting || !isBackendAvailable) {
      return await clientStorage.deleteExpense(id)
    }
    try {
      return await request<any>(`/expenses/${id}`, {
        method: 'DELETE'
      })
    } catch {
      return await clientStorage.deleteExpense(id)
    }
  },

  // Purchase Requests
  getPurchaseRequests: async (teamId?: string, status?: string) => {
    if (isStaticHosting || !isBackendAvailable) {
      return await clientStorage.getPurchaseRequests({ teamId, status })
    }
    try {
      const query = new URLSearchParams()
      if (teamId && teamId !== 'all') query.set('teamId', teamId)
      if (status && status !== 'all') query.set('status', status)
      const qStr = query.toString() ? `?${query.toString()}` : ''
      return await request<any[]>(`/purchase-requests${qStr}`)
    } catch {
      return await clientStorage.getPurchaseRequests({ teamId, status })
    }
  },

  getPurchaseRequest: async (id: string) => {
    if (isStaticHosting || !isBackendAvailable) {
      return await clientStorage.getPurchaseRequest(id)
    }
    try {
      return await request<any>(`/purchase-requests/${id}`)
    } catch {
      return await clientStorage.getPurchaseRequest(id)
    }
  },

  createPurchaseRequest: async (data: any) => {
    if (isStaticHosting || !isBackendAvailable) {
      return await clientStorage.createPurchaseRequest(data)
    }
    try {
      return await request<any>('/purchase-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch {
      return await clientStorage.createPurchaseRequest(data)
    }
  },

  updatePurchaseRequest: async (id: string, data: any) => {
    if (isStaticHosting || !isBackendAvailable) {
      return await clientStorage.updatePurchaseStatus(id, data)
    }
    try {
      return await request<any>(`/purchase-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch {
      return await clientStorage.updatePurchaseStatus(id, data)
    }
  },

  updatePurchaseRequestStatus: async (
    id: string,
    data: { status: string; reviewNotes?: string; approvedAmount?: number }
  ) => {
    if (isStaticHosting || !isBackendAvailable) {
      return await clientStorage.updatePurchaseStatus(id, {
        status: data.status as PurchaseStatus,
        comment: data.reviewNotes,
        approvedAmount: data.approvedAmount
      })
    }
    try {
      return await request<any>(`/purchase-requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch {
      return await clientStorage.updatePurchaseStatus(id, {
        status: data.status as PurchaseStatus,
        comment: data.reviewNotes,
        approvedAmount: data.approvedAmount
      })
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
    if (isStaticHosting || !isBackendAvailable) {
      return await clientStorage.completePurchase(id, data)
    }
    try {
      return await request<any>(`/purchase-requests/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch {
      return await clientStorage.completePurchase(id, data)
    }
  },

  // Audit Logs
  getAuditLogs: async (teamId?: string) => {
    if (isStaticHosting || !isBackendAvailable) {
      return await clientStorage.getAuditLogs({ teamId })
    }
    try {
      const query = teamId && teamId !== 'all' ? `?teamId=${teamId}` : ''
      return await request<any[]>(`/audit-logs${query}`)
    } catch {
      return await clientStorage.getAuditLogs({ teamId })
    }
  },

  // Reset demo
  resetDemoData: async () => {
    if (isStaticHosting || !isBackendAvailable) {
      return await clientStorage.resetDemoData()
    }
    try {
      return await request<any>('/admin/reset-demo', {
        method: 'POST'
      })
    } catch {
      return await clientStorage.resetDemoData()
    }
  }
}
