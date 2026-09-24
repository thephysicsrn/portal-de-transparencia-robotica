const API_BASE = '/api'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const headers = {
    ...getAuthHeader(),
    ...options.headers
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  if (response.status === 401) {
    // If unauthorized, clear token
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

  return data as T
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    }),

  getCurrentUser: () => request<{ user: any }>('/auth/me'),

  // Teams
  getTeams: () => request<any[]>('/teams'),
  getTeam: (id: string) => request<any>(`/teams/${id}`),
  createTeam: (data: any) =>
    request<any>('/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  // File Upload
  uploadFile: async (file: File) => {
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

    const data = await response.json()
    if (!response.ok) {
      throw new ApiError(data.error || 'Falha ao enviar arquivo.', response.status)
    }
    return data as { fileUrl: string; fileName: string; originalName: string; size: number }
  },

  // Dashboard & Financial Reports
  getDashboard: (teamId?: string) => {
    const query = teamId && teamId !== 'all' ? `?teamId=${teamId}` : ''
    return request<any>(`/reports/dashboard${query}`)
  },

  getStatement: (params?: { teamId?: string; startDate?: string; endDate?: string; category?: string }) => {
    const query = new URLSearchParams()
    if (params?.teamId && params.teamId !== 'all') query.set('teamId', params.teamId)
    if (params?.startDate) query.set('startDate', params.startDate)
    if (params?.endDate) query.set('endDate', params.endDate)
    if (params?.category && params.category !== 'all') query.set('category', params.category)

    const qStr = query.toString() ? `?${query.toString()}` : ''
    return request<any>(`/reports/statement${qStr}`)
  },

  // Sponsorships
  getSponsorships: (teamId?: string) => {
    const query = teamId && teamId !== 'all' ? `?teamId=${teamId}` : ''
    return request<any[]>(`/sponsorships${query}`)
  },

  createSponsorship: (data: any) =>
    request<any>('/sponsorships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  deleteSponsorship: (id: string) =>
    request<any>(`/sponsorships/${id}`, {
      method: 'DELETE'
    }),

  // Expenses
  getExpenses: (teamId?: string) => {
    const query = teamId && teamId !== 'all' ? `?teamId=${teamId}` : ''
    return request<any[]>(`/expenses${query}`)
  },

  createExpense: (data: any) =>
    request<any>('/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  deleteExpense: (id: string) =>
    request<any>(`/expenses/${id}`, {
      method: 'DELETE'
    }),

  // Purchase Requests
  getPurchaseRequests: (teamId?: string, status?: string) => {
    const query = new URLSearchParams()
    if (teamId && teamId !== 'all') query.set('teamId', teamId)
    if (status && status !== 'all') query.set('status', status)
    const qStr = query.toString() ? `?${query.toString()}` : ''
    return request<any[]>(`/purchase-requests${qStr}`)
  },

  getPurchaseRequest: (id: string) => request<any>(`/purchase-requests/${id}`),

  createPurchaseRequest: (data: any) =>
    request<any>('/purchase-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  updatePurchaseRequest: (id: string, data: any) =>
    request<any>(`/purchase-requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  updatePurchaseRequestStatus: (
    id: string,
    data: { status: string; reviewNotes?: string; approvedAmount?: number }
  ) =>
    request<any>(`/purchase-requests/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  completePurchaseRequest: (
    id: string,
    data: {
      finalActualAmount: number
      finalReceiptUrl?: string | null
      finalReceiptFileName?: string | null
      notes?: string
      supplier?: string
    }
  ) =>
    request<any>(`/purchase-requests/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  // Audit Logs
  getAuditLogs: (teamId?: string) => {
    const query = teamId && teamId !== 'all' ? `?teamId=${teamId}` : ''
    return request<any[]>(`/audit-logs${query}`)
  },

  // Reset demo
  resetDemoData: () =>
    request<any>('/admin/reset-demo', {
      method: 'POST'
    })
}
