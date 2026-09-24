export type UserRole = 'technical_lead' | 'team_rep'

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  role: UserRole
  teamId: string | null
  title?: string
  avatar?: string
  createdAt: string
}

export interface Team {
  id: string
  name: string
  code: string
  category: string // FRC, FTC, FLL, Combate, Autônomos
  institution: string
  description: string
  bankAccount: string
  leaderName: string
  createdAt: string
}

export interface Sponsorship {
  id: string
  teamId: string
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
  category: 'Peças e Componentes' | 'Eletrônica e Sensores' | 'Ferramentas e Usinagem' | 'Inscrições e Torneios' | 'Transporte e Viagem' | 'Alimentação' | 'Marketing e Uniformes' | 'Outros'
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
  action: 
    | 'CRIOU_PATROCINIO'
    | 'EDITOU_PATROCINIO'
    | 'EXCLUIU_PATROCINIO'
    | 'CRIOU_DESPESA'
    | 'EDITOU_DESPESA'
    | 'EXCLUIU_DESPESA'
    | 'CRIOU_SOLICITACAO_COMPRA'
    | 'EDITOU_SOLICITACAO_COMPRA'
    | 'ANALISE_INICIADA'
    | 'SOLICITOU_AJUSTE'
    | 'REENVIOU_SOLICITACAO'
    | 'APROVOU_SOLICITACAO'
    | 'REJEITOU_SOLICITACAO'
    | 'INICIOU_COMPRA'
    | 'CONCLUIU_COMPRA'
    | 'LOGIN'
  entityType: 'sponsorship' | 'expense' | 'purchase_request' | 'team' | 'auth'
  entityId: string
  description: string
  details?: Record<string, any>
}

export interface DatabaseSchema {
  users: User[]
  teams: Team[]
  sponsorships: Sponsorship[]
  expenses: Expense[]
  purchaseRequests: PurchaseRequest[]
  auditLogs: AuditLog[]
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
