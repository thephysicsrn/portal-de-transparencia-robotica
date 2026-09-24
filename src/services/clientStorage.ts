import type {
  User,
  Team,
  Sponsorship,
  Expense,
  PurchaseRequest,
  PurchaseStatus,
  AuditLog,
  TeamFinancialSummary,
  DashboardData,
  StatementResponse,
  StatementItem
} from '../types'
import { INITIAL_MOCK_DATA } from './mockData'

const STORAGE_KEY = 'portal_robotica_client_db_v1'

interface ClientDbState {
  users: User[]
  teams: Team[]
  sponsorships: Sponsorship[]
  expenses: Expense[]
  purchaseRequests: PurchaseRequest[]
  auditLogs: AuditLog[]
}

function loadState(): ClientDbState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.users && parsed.teams && parsed.sponsorships) {
        return parsed
      }
    }
  } catch (err) {
    console.warn('Failed to parse client storage db, reinitializing with seed data', err)
  }
  const initial = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA))
  saveState(initial)
  return initial
}

function saveState(state: ClientDbState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('Failed to save client storage state to localStorage', err)
  }
}

function getSessionUser(): User | null {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function logAudit(
  db: ClientDbState,
  action: string,
  entityType: 'sponsorship' | 'expense' | 'purchase_request' | 'team' | 'auth',
  entityId: string,
  description: string,
  teamId: string | null = null,
  teamName: string | null = null,
  details?: Record<string, any>
) {
  const user = getSessionUser()
  const log: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    userId: user?.id || 'system',
    userName: user?.name || 'Sistema Local',
    userRole: user?.role || 'technical_lead',
    teamId,
    teamName,
    action,
    entityType,
    entityId,
    description,
    details
  }
  db.auditLogs.unshift(log)
}

function getTeamFinancialSummary(db: ClientDbState, teamId: string): TeamFinancialSummary {
  const team = db.teams.find(t => t.id === teamId)
  const teamName = team ? team.name : 'Equipe Desconhecida'
  const category = team ? team.category : ''

  const teamSponsorships = db.sponsorships.filter(s => s.teamId === teamId)
  const teamExpenses = db.expenses.filter(e => e.teamId === teamId)
  const teamPurchases = db.purchaseRequests.filter(p => p.teamId === teamId)

  const totalReceived = teamSponsorships.reduce((acc, s) => acc + (s.amount || 0), 0)
  const totalSpent = teamExpenses.reduce((acc, e) => acc + (e.amount || 0), 0)
  const currentBalance = totalReceived - totalSpent

  const inProgressPurchases = teamPurchases.filter(p =>
    ['aprovada', 'compra_em_andamento'].includes(p.status)
  )
  const inProgressPurchasesCount = inProgressPurchases.length
  const inProgressPurchasesApprovedTotal = inProgressPurchases.reduce(
    (acc, p) => acc + (p.approvedAmount || p.estimatedTotal || 0),
    0
  )

  const pendingRequestsCount = teamPurchases.filter(p =>
    ['enviada', 'em_analise', 'ajuste_solicitado'].includes(p.status)
  ).length

  return {
    teamId,
    teamName,
    category,
    totalReceived,
    totalSpent,
    currentBalance,
    inProgressPurchasesCount,
    inProgressPurchasesApprovedTotal,
    pendingRequestsCount
  }
}

export const clientStorage = {
  // Reset
  resetDemoData: async () => {
    const initial = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA))
    saveState(initial)
    return { message: 'Dados de demonstração restaurados com sucesso!' }
  },

  // Auth
  login: async (credentials: { email: string; password: string }) => {
    const db = loadState()
    const email = credentials.email.trim().toLowerCase()
    const pass = credentials.password.trim()

    const user = db.users.find(u => u.email.toLowerCase() === email)
    if (!user) {
      throw new Error('E-mail não encontrado. Utilize uma das contas de demonstração (ex: responsavel@robotica.org) ou clique nos botões de Acesso Rápido.')
    }

    // Check credentials (accept standard demo passwords or any >= 3 chars during presentation)
    const valid =
      pass.length >= 3 ||
      pass === 'admin123' ||
      pass === 'equipe123' ||
      pass === '123456'

    if (!valid) {
      throw new Error('Senha incorreta. A senha padrão é admin123 ou equipe123.')
    }

    const team = user.teamId ? db.teams.find(t => t.id === user.teamId) || null : null
    const userWithTeam = { ...user, team }
    const token = `local-token-${user.id}-${Date.now()}`

    logAudit(db, 'LOGIN', 'auth', user.id, `Usuário ${user.name} acessou o sistema.`)
    saveState(db)

    return { token, user: userWithTeam }
  },

  getCurrentUser: async () => {
    const user = getSessionUser()
    if (!user) throw new Error('Sessão expirada.')
    const db = loadState()
    const freshUser = db.users.find(u => u.id === user.id) || user
    const team = freshUser.teamId ? db.teams.find(t => t.id === freshUser.teamId) || null : null
    return { user: { ...freshUser, team } }
  },

  // Teams
  getTeams: async () => {
    const db = loadState()
    return db.teams.map(t => ({
      ...t,
      summary: getTeamFinancialSummary(db, t.id)
    }))
  },

  getTeam: async (id: string) => {
    const db = loadState()
    const team = db.teams.find(t => t.id === id)
    if (!team) throw new Error('Equipe não encontrada.')
    return { ...team, summary: getTeamFinancialSummary(db, id) }
  },

  createTeam: async (data: any) => {
    const db = loadState()
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: data.name,
      code: (data.code || 'EQP').toUpperCase(),
      category: data.category,
      institution: data.institution || '',
      description: data.description || '',
      bankAccount: data.bankAccount || '',
      leaderName: data.leaderName || '',
      createdAt: new Date().toISOString()
    }
    db.teams.push(newTeam)
    logAudit(db, 'CRIOU_EQUIPE', 'team', newTeam.id, `Cadastrou nova equipe: ${newTeam.name}.`, newTeam.id, newTeam.name)
    saveState(db)
    return newTeam
  },

  // Sponsorships
  getSponsorships: async (params: { teamId?: string; search?: string } = {}) => {
    const db = loadState()
    let list = [...db.sponsorships]
    if (params.teamId && params.teamId !== 'all') {
      list = list.filter(s => s.teamId === params.teamId)
    }
    if (params.search) {
      const q = params.search.toLowerCase()
      list = list.filter(s =>
        s.sponsorName.toLowerCase().includes(q) ||
        s.purpose.toLowerCase().includes(q) ||
        (s.teamName && s.teamName.toLowerCase().includes(q))
      )
    }
    return list.sort((a, b) => new Date(b.receiptDate).getTime() - new Date(a.receiptDate).getTime())
  },

  createSponsorship: async (data: any) => {
    const db = loadState()
    const user = getSessionUser()
    const team = db.teams.find(t => t.id === data.teamId)

    const newSpon: Sponsorship = {
      id: `spon-${Date.now()}`,
      teamId: data.teamId,
      teamName: team?.name || 'Equipe',
      sponsorName: data.sponsorName,
      amount: parseFloat(data.amount) || 0,
      receiptDate: data.receiptDate || new Date().toISOString().split('T')[0],
      purpose: data.purpose,
      notes: data.notes || '',
      receiptUrl: data.receiptUrl || null,
      receiptFileName: data.receiptFileName || null,
      createdBy: user?.id || 'unknown',
      createdByName: user?.name || 'Usuário',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    db.sponsorships.push(newSpon)
    logAudit(
      db,
      'CRIOU_PATROCINIO',
      'sponsorship',
      newSpon.id,
      `Registrou patrocínio de R$ ${newSpon.amount.toFixed(2)} de ${newSpon.sponsorName} para ${team?.name}.`,
      newSpon.teamId,
      team?.name,
      { amount: newSpon.amount, sponsor: newSpon.sponsorName }
    )
    saveState(db)
    return newSpon
  },

  deleteSponsorship: async (id: string) => {
    const db = loadState()
    const spon = db.sponsorships.find(s => s.id === id)
    if (!spon) throw new Error('Patrocínio não encontrado.')
    db.sponsorships = db.sponsorships.filter(s => s.id !== id)
    logAudit(db, 'EXCLUIU_PATROCINIO', 'sponsorship', id, `Excluiu patrocínio de ${spon.sponsorName}.`, spon.teamId, spon.teamName)
    saveState(db)
    return { success: true }
  },

  // Expenses
  getExpenses: async (params: { teamId?: string; category?: string; search?: string } = {}) => {
    const db = loadState()
    let list = [...db.expenses]
    if (params.teamId && params.teamId !== 'all') {
      list = list.filter(e => e.teamId === params.teamId)
    }
    if (params.category && params.category !== 'all') {
      list = list.filter(e => e.category === params.category)
    }
    if (params.search) {
      const q = params.search.toLowerCase()
      list = list.filter(e =>
        e.supplier.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.teamName && e.teamName.toLowerCase().includes(q))
      )
    }
    return list.sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
  },

  createExpense: async (data: any) => {
    const db = loadState()
    const user = getSessionUser()
    const team = db.teams.find(t => t.id === data.teamId)

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      teamId: data.teamId,
      teamName: team?.name || 'Equipe',
      supplier: data.supplier,
      amount: parseFloat(data.amount) || 0,
      expenseDate: data.expenseDate || new Date().toISOString().split('T')[0],
      category: data.category,
      description: data.description,
      invoiceNumber: data.invoiceNumber || '',
      receiptUrl: data.receiptUrl || null,
      receiptFileName: data.receiptFileName || null,
      originPurchaseRequestId: data.originPurchaseRequestId || null,
      createdBy: user?.id || 'unknown',
      createdByName: user?.name || 'Usuário',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    db.expenses.push(newExpense)
    logAudit(
      db,
      'CRIOU_DESPESA',
      'expense',
      newExpense.id,
      `Lançou despesa de R$ ${newExpense.amount.toFixed(2)} (${newExpense.category}) para ${team?.name}.`,
      newExpense.teamId,
      team?.name,
      { amount: newExpense.amount, category: newExpense.category }
    )
    saveState(db)
    return newExpense
  },

  deleteExpense: async (id: string) => {
    const db = loadState()
    const exp = db.expenses.find(e => e.id === id)
    if (!exp) throw new Error('Despesa não encontrada.')
    db.expenses = db.expenses.filter(e => e.id !== id)
    logAudit(db, 'EXCLUIU_DESPESA', 'expense', id, `Excluiu despesa: ${exp.description}.`, exp.teamId, exp.teamName)
    saveState(db)
    return { success: true }
  },

  // Purchase Requests
  getPurchaseRequests: async (params: { teamId?: string; status?: string; search?: string } = {}) => {
    const db = loadState()
    let list = [...db.purchaseRequests]
    if (params.teamId && params.teamId !== 'all') {
      list = list.filter(p => p.teamId === params.teamId)
    }
    if (params.status && params.status !== 'all') {
      list = list.filter(p => p.status === params.status)
    }
    if (params.search) {
      const q = params.search.toLowerCase()
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.justification.toLowerCase().includes(q) ||
        (p.teamName && p.teamName.toLowerCase().includes(q))
      )
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  getPurchaseRequest: async (id: string) => {
    const db = loadState()
    const req = db.purchaseRequests.find(p => p.id === id)
    if (!req) throw new Error('Solicitação de compra não encontrada.')
    return req
  },

  createPurchaseRequest: async (data: any) => {
    const db = loadState()
    const user = getSessionUser()
    const team = db.teams.find(t => t.id === data.teamId)

    const items = (data.items || []).map((item: any, idx: number) => ({
      id: `item-${Date.now()}-${idx}`,
      description: item.description,
      quantity: Number(item.quantity) || 1,
      estimatedUnitPrice: Number(item.estimatedUnitPrice) || 0,
      linkOrSupplier: item.linkOrSupplier || ''
    }))

    const calculatedTotal = items.reduce(
      (acc: number, i: any) => acc + i.quantity * i.estimatedUnitPrice,
      0
    )

    const newReq: PurchaseRequest = {
      id: `req-${Date.now()}`,
      teamId: data.teamId,
      teamName: team?.name || 'Equipe',
      title: data.title,
      justification: data.justification,
      urgency: data.urgency || 'media',
      status: 'enviada',
      items,
      estimatedTotal: calculatedTotal || Number(data.estimatedTotal) || 0,
      createdBy: user?.id || 'unknown',
      createdByName: user?.name || 'Usuário',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          id: `tl-${Date.now()}`,
          fromStatus: null,
          toStatus: 'enviada',
          changedBy: user?.id || 'unknown',
          changedByName: user?.name || 'Usuário',
          changedByRole: user?.role || 'team_rep',
          timestamp: new Date().toISOString(),
          comment: 'Solicitação criada e enviada para análise técnica.'
        }
      ]
    }

    db.purchaseRequests.push(newReq)
    logAudit(
      db,
      'CRIOU_SOLICITACAO_COMPRA',
      'purchase_request',
      newReq.id,
      `Criou solicitação de compra "${newReq.title}" estimada em R$ ${newReq.estimatedTotal.toFixed(2)} para ${team?.name}.`,
      newReq.teamId,
      team?.name,
      { title: newReq.title, total: newReq.estimatedTotal }
    )
    saveState(db)
    return newReq
  },

  updatePurchaseStatus: async (id: string, data: { status: PurchaseStatus; comment?: string; approvedAmount?: number }) => {
    const db = loadState()
    const user = getSessionUser()
    const req = db.purchaseRequests.find(p => p.id === id)
    if (!req) throw new Error('Solicitação de compra não encontrada.')

    const oldStatus = req.status
    req.status = data.status
    req.updatedAt = new Date().toISOString()

    if (data.approvedAmount !== undefined) {
      req.approvedAmount = Number(data.approvedAmount)
    }

    req.timeline = req.timeline || []
    req.timeline.push({
      id: `tl-${Date.now()}`,
      fromStatus: oldStatus,
      toStatus: data.status,
      changedBy: user?.id || 'unknown',
      changedByName: user?.name || 'Usuário',
      changedByRole: user?.role || 'technical_lead',
      timestamp: new Date().toISOString(),
      comment: data.comment || `Status atualizado de ${oldStatus} para ${data.status}.`
    })

    logAudit(
      db,
      'ALTEROU_STATUS_COMPRA',
      'purchase_request',
      req.id,
      `Status da solicitação "${req.title}" alterado de ${oldStatus} para ${data.status}.`,
      req.teamId,
      req.teamName,
      { oldStatus, newStatus: data.status, comment: data.comment }
    )
    saveState(db)
    return req
  },

  completePurchase: async (id: string, data: any) => {
    const db = loadState()
    const user = getSessionUser()
    const req = db.purchaseRequests.find(p => p.id === id)
    if (!req) throw new Error('Solicitação não encontrada.')

    const finalAmount = parseFloat(data.finalActualAmount) || req.approvedAmount || req.estimatedTotal
    const oldStatus = req.status
    req.status = 'concluida'
    req.finalActualAmount = finalAmount
    req.finalReceiptUrl = data.finalReceiptUrl || null
    req.finalReceiptFileName = data.finalReceiptFileName || null
    req.updatedAt = new Date().toISOString()

    req.timeline = req.timeline || []
    req.timeline.push({
      id: `tl-${Date.now()}`,
      fromStatus: oldStatus,
      toStatus: 'concluida',
      changedBy: user?.id || 'unknown',
      changedByName: user?.name || 'Usuário',
      changedByRole: user?.role || 'technical_lead',
      timestamp: new Date().toISOString(),
      comment: data.comment || `Compra concluída. Valor final executado: R$ ${finalAmount.toFixed(2)}. Comprovante anexado.`
    })

    // Automatically generate the actual cash-flow expense
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      teamId: req.teamId,
      teamName: req.teamName,
      supplier: data.supplier || 'Fornecedor da Solicitação',
      amount: finalAmount,
      expenseDate: data.completionDate || new Date().toISOString().split('T')[0],
      category: data.category || 'Peças e Componentes',
      description: `[COMPRA CONCLUÍDA] ${req.title}`,
      invoiceNumber: data.invoiceNumber || '',
      receiptUrl: data.finalReceiptUrl || null,
      receiptFileName: data.finalReceiptFileName || null,
      originPurchaseRequestId: req.id,
      createdBy: user?.id || 'unknown',
      createdByName: user?.name || 'Usuário',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    db.expenses.push(newExpense)
    logAudit(
      db,
      'CONCLUIU_COMPRA',
      'purchase_request',
      req.id,
      `Compra "${req.title}" concluída com valor final de R$ ${finalAmount.toFixed(2)}. Débito lançado em despesas.`,
      req.teamId,
      req.teamName,
      { finalAmount, supplier: data.supplier }
    )
    saveState(db)
    return { purchaseRequest: req, generatedExpense: newExpense }
  },

  // Financial Statement
  getStatement: async (params: { teamId?: string; startDate?: string; endDate?: string; category?: string } = {}): Promise<StatementResponse> => {
    const db = loadState()
    const targetTeamId = params.teamId || 'all'

    let sponsorships = [...db.sponsorships]
    let expenses = [...db.expenses]

    if (targetTeamId !== 'all') {
      sponsorships = sponsorships.filter(s => s.teamId === targetTeamId)
      expenses = expenses.filter(e => e.teamId === targetTeamId)
    }

    if (params.startDate) {
      sponsorships = sponsorships.filter(s => s.receiptDate >= params.startDate!)
      expenses = expenses.filter(e => e.expenseDate >= params.startDate!)
    }

    if (params.endDate) {
      sponsorships = sponsorships.filter(s => s.receiptDate <= params.endDate!)
      expenses = expenses.filter(e => e.expenseDate <= params.endDate!)
    }

    if (params.category && params.category !== 'all') {
      expenses = expenses.filter(e => e.category === params.category)
      if (params.category !== 'Patrocínio') {
        sponsorships = []
      }
    }

    const entries: Array<{
      id: string
      type: 'sponsorship' | 'expense'
      teamId: string
      teamName: string
      date: string
      description: string
      category: string
      counterpart: string
      amount: number
      receiptUrl?: string | null
      receiptFileName?: string | null
      registeredByName: string
    }> = []

    sponsorships.forEach(s => {
      entries.push({
        id: s.id,
        type: 'sponsorship',
        teamId: s.teamId,
        teamName: s.teamName || 'Equipe',
        date: s.receiptDate,
        description: s.purpose,
        category: 'Patrocínio',
        counterpart: s.sponsorName,
        amount: s.amount,
        receiptUrl: s.receiptUrl,
        receiptFileName: s.receiptFileName,
        registeredByName: s.createdByName
      })
    })

    expenses.forEach(e => {
      entries.push({
        id: e.id,
        type: 'expense',
        teamId: e.teamId,
        teamName: e.teamName || 'Equipe',
        date: e.expenseDate,
        description: e.description,
        category: e.category,
        counterpart: e.supplier,
        amount: e.amount,
        receiptUrl: e.receiptUrl,
        receiptFileName: e.receiptFileName,
        registeredByName: e.createdByName
      })
    })

    // Sort chronologically ascending to compute progressive running balance
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    let runningBalance = 0
    let totalEntries = 0
    let totalExits = 0

    const statementWithBalance: StatementItem[] = entries.map(entry => {
      if (entry.type === 'sponsorship') {
        runningBalance += entry.amount
        totalEntries += entry.amount
      } else {
        runningBalance -= entry.amount
        totalExits += entry.amount
      }
      return {
        ...entry,
        balanceAfter: runningBalance
      }
    })

    return {
      targetTeamId,
      totalEntries,
      totalExits,
      currentBalance: runningBalance,
      items: statementWithBalance.reverse() // Newest first for UI presentation
    }
  },

  // Dashboard Metrics
  getDashboardMetrics: async (params: { teamId?: string } = {}): Promise<DashboardData> => {
    const db = loadState()
    const targetTeamId = params.teamId || 'all'

    let sponsorships = db.sponsorships
    let expenses = db.expenses
    let purchases = db.purchaseRequests

    if (targetTeamId !== 'all') {
      sponsorships = sponsorships.filter(s => s.teamId === targetTeamId)
      expenses = expenses.filter(e => e.teamId === targetTeamId)
      purchases = purchases.filter(p => p.teamId === targetTeamId)
    }

    const totalReceived = sponsorships.reduce((acc, s) => acc + (s.amount || 0), 0)
    const totalSpent = expenses.reduce((acc, e) => acc + (e.amount || 0), 0)
    const currentBalance = totalReceived - totalSpent

    const inProgressPurchases = purchases.filter(p =>
      ['aprovada', 'compra_em_andamento'].includes(p.status)
    )
    const inProgressPurchasesCount = inProgressPurchases.length
    const inProgressPurchasesApprovedTotal = inProgressPurchases.reduce(
      (acc, p) => acc + (p.approvedAmount || p.estimatedTotal || 0),
      0
    )

    const pendingRequests = purchases
      .filter(p => ['enviada', 'em_analise', 'ajuste_solicitado'].includes(p.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const teamsSummaries = db.teams.map(t => getTeamFinancialSummary(db, t.id))

    return {
      metrics: {
        totalReceived,
        totalSpent,
        currentBalance,
        inProgressPurchasesCount,
        inProgressPurchasesApprovedTotal,
        pendingRequestsCount: pendingRequests.length
      },
      teamsSummaries,
      pendingRequests,
      recentLogs: db.auditLogs.slice(0, 10)
    }
  },

  // Audit Logs
  getAuditLogs: async (params: { teamId?: string; entityType?: string; limit?: number } = {}) => {
    const db = loadState()
    let list = [...db.auditLogs]
    if (params.teamId && params.teamId !== 'all') {
      list = list.filter(l => l.teamId === params.teamId)
    }
    if (params.entityType && params.entityType !== 'all') {
      list = list.filter(l => l.entityType === params.entityType)
    }
    const limit = params.limit || 50
    return list.slice(0, limit)
  },

  // Upload receipt helper
  uploadReceipt: async (file: File) => {
    return new Promise<{ fileUrl: string; fileName: string }>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        resolve({
          fileUrl: reader.result as string,
          fileName: file.name
        })
      }
      reader.onerror = () => {
        resolve({
          fileUrl: URL.createObjectURL(file),
          fileName: file.name
        })
      }
      reader.readAsDataURL(file)
    })
  }
}
