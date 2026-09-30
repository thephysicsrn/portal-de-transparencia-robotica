import { clientStorage } from './clientStorage'
import {
  fetchTeams,
  getCurrentProfile,
  getStatement as storeGetStatement,
  getDashboard as storeGetDashboard,
  fetchSponsorships,
  fetchExpenses,
  fetchPurchaseRequests,
  fetchAuditLogs,
  createSponsorship,
  createExpense,
  createPurchaseRequest,
  updatePurchaseRequest,
  deleteRecord,
  appendAuditLog
} from './firebase/store'

// Mesma superfície de `api` em api.ts, porém sobre o Firestore.
//
// O Firestore já registra as ações relevantes no log de auditoria, então os
// registros explícitos abaixo são evitados para não duplicar entradas.

export const firebaseApi = {
  // Auth: o AuthContext resolve login e perfil direto no Firebase Auth
  login: async (credentials: { email: string; password: string }) => {
    return await clientStorage.login(credentials)
  },

  getCurrentUser: async () => {
    const profile = getCurrentProfile()
    if (!profile) throw new Error('Sessão expirada. Entre novamente.')
    return { user: profile }
  },

  // Equipes
  getTeams: async () => {
    return await fetchTeams()
  },

  getTeam: async (id: string) => {
    const teams = await fetchTeams()
    const team = teams.find(t => t.id === id)
    if (!team) throw new Error('Equipe não encontrada.')
    return team
  },

  createTeam: async () => {
    throw new Error('A criação de equipes é feita apenas no painel administrativo.')
  },

  // Uploads continuam indo para o servidor
  uploadReceipt: async (file: File) => {
    return await clientStorage.uploadReceipt(file)
  },

  // Indicadores
  getDashboard: async (teamId?: string) => {
    return await storeGetDashboard(teamId, getCurrentProfile())
  },

  getStatement: async (params?: { teamId?: string; startDate?: string; endDate?: string; category?: string }) => {
    return await storeGetStatement(params || {}, getCurrentProfile())
  },

  // Patrocínios
  getSponsorships: async (teamId?: string) => {
    return await fetchSponsorships(teamId, getCurrentProfile())
  },

  createSponsorship: async (data: any) => {
    await createSponsorship(data)
    return data
  },

  deleteSponsorship: async (id: string) => {
    await deleteRecord('sponsorships', id)
  },

  // Despesas
  getExpenses: async (teamId?: string) => {
    return await fetchExpenses(teamId, getCurrentProfile())
  },

  createExpense: async (data: any) => {
    await createExpense(data)
    return data
  },

  deleteExpense: async (id: string) => {
    await deleteRecord('expenses', id)
  },

  // Solicitações de compra
  getPurchaseRequests: async (teamId?: string, status?: string) => {
    return await fetchPurchaseRequests(teamId, status, getCurrentProfile())
  },

  getPurchaseRequest: async (id: string) => {
    const all = await fetchPurchaseRequests(undefined, undefined, getCurrentProfile())
    const request = all.find(r => r.id === id)
    if (!request) throw new Error('Solicitação não encontrada.')
    return request
  },

  createPurchaseRequest: async (data: any) => {
    await createPurchaseRequest(data)
    return data
  },

  updatePurchaseRequest: async (id: string, data: any) => {
    await updatePurchaseRequest(id, data)
    return { success: true }
  },

  // Decisão sobre a solicitação. As regras do Firestore restringem a mudança
  // de status ao responsável técnica e ao admin de TI.
  updatePurchaseRequestStatus: async (
    id: string,
    data: { status: string; reviewNotes?: string; approvedAmount?: number }
  ) => {
    const result = await updatePurchaseRequest(id, {
      status: data.status,
      reviewNotes: data.reviewNotes,
      reviewComment: data.reviewNotes,
      approvedAmount: data.approvedAmount
    })
    return result
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
    const result = await updatePurchaseRequest(id, {
      finalActualAmount: data.finalActualAmount,
      finalReceiptUrl: data.finalReceiptUrl,
      finalReceiptFileName: data.finalReceiptFileName,
      notes: data.notes,
      supplier: data.supplier
    })
    return { success: true, request: result }
  },

  // Auditoria e manutenção
  getAuditLogs: async (teamId?: string) => {
    return await fetchAuditLogs({ teamId }, getCurrentProfile())
  },

  resetDemoData: async () => {
    throw new Error('A limpeza de dados agora é feita no painel administrativo.')
  },

  clearLocalData: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

export type FirebaseApi = typeof firebaseApi

export { appendAuditLog }