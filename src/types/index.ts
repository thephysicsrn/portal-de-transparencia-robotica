export type UserRole = 'technical_lead' | 'team_rep'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  teamId: string | null
  title?: string
  avatar?: string
  team?: Team | null
  createdAt: string
}

export interface Team {
  id: string
  name: string
  code: string
  category: string
  institution: string
  description: string
  bankAccount: string
  leaderName: string
  createdAt: string
  summary?: TeamFinancialSummary
}

export interface Sponsorship {
  id: string
  teamId: string
  teamName?: string
  sponsorName: string
  amount: number
  receiptDate: string
  purpose: string
  notes?: string
  receiptUrl?: string | null
  receiptFileName?: string | null
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

export interface Expense {
  id: string
  teamId: string
  teamName?: string
  category: 
    | 'Peças e Componentes'
    | 'Eletrônica e Sensores'
    | 'Ferramentas e Usinagem'
    | 'Inscrições e Torneios'
    | 'Transporte e Viagem'
    | 'Alimentação'
    | 'Marketing e Uniformes'
    | 'Outros'
  description: string
  amount: number
  expenseDate: string
  supplier: string
  receiptUrl?: string | null
  receiptFileName?: string | null
  purchaseRequestId?: string | null
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

export type PurchaseStatus = 
  | 'enviada'
  | 'em_analise'
  | 'ajuste_solicitado'
  | 'aprovada'
  | 'rejeitada'
  | 'compra_em_andamento'
  | 'concluida'

export interface PurchaseItem {
  id: string
  name: string
  quantity: number
  unitPriceEstimated: number
  totalEstimated: number
  referenceLink?: string
}

export interface PurchaseRequest {
  id: string
  teamId: string
  teamName?: string
  title: string
  items: PurchaseItem[]
  estimatedTotal: number
  purpose: string
  justification: string
  urgency: 'baixa' | 'media' | 'alta' | 'critica'
  status: PurchaseStatus
  reviewNotes?: string | null
  approvedAmount?: number | null
  reviewedBy?: string | null
  reviewedByName?: string | null
  reviewedAt?: string | null
  finalActualAmount?: number | null
  finalReceiptUrl?: string | null
  finalReceiptFileName?: string | null
  expenseId?: string | null
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

export interface AuditLog {
  id: string
  timestamp: string
  userId: string
  userName: string
  userRole: UserRole
  teamId: string | null
  teamName: string | null
  action: string
  entityType: 'sponsorship' | 'expense' | 'purchase_request' | 'team' | 'auth'
  entityId: string
  description: string
  details?: Record<string, any>
}

export interface TeamFinancialSummary {
  teamId: string
  teamName: string
  category: string
  totalReceived: number
  totalSpent: number
  currentBalance: number
  inProgressPurchasesCount: number
  inProgressPurchasesApprovedTotal: number
  pendingRequestsCount: number
}

export interface DashboardData {
  metrics: {
    totalReceived: number
    totalSpent: number
    currentBalance: number
    inProgressPurchasesCount: number
    inProgressPurchasesApprovedTotal: number
    pendingRequestsCount: number
  }
  teamsSummaries: TeamFinancialSummary[]
  pendingRequests: PurchaseRequest[]
  recentLogs: AuditLog[]
}

export interface StatementItem {
  id: string
  type: 'sponsorship' | 'expense'
  teamId: string
  teamName: string
  date: string
  description: string
  category: string
  counterpart: string
  amount: number
  balanceAfter: number
  receiptUrl?: string | null
  receiptFileName?: string | null
  registeredByName: string
}

export interface StatementResponse {
  targetTeamId: string
  totalEntries: number
  totalExits: number
  currentBalance: number
  items: StatementItem[]
}
