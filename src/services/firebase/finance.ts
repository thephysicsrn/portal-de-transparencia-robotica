import type {
  AuditLog,
  DashboardData,
  Expense,
  PurchaseRequest,
  Sponsorship,
  StatementItem,
  StatementResponse,
  Team,
  TeamFinancialSummary
} from '../../types'

// Funcoes puras de agregacao financeira.
//
// Ficam separadas da camada de armazenamento de proposito: tanto o Firestore
// quanto o localStorage calculam os mesmos numeros a partir das mesmas
// colecoes, entao o painel administrativo e o portal mostram valores iguais.

export function computeTeamFinancialSummary(
  teams: Team[],
  sponsorships: Sponsorship[],
  expenses: Expense[],
  purchases: PurchaseRequest[],
  teamId: string
): TeamFinancialSummary {
  const team = teams.find(t => t.id === teamId)
  const teamName = team ? team.name : 'Equipe Desconhecida'
  const category = team ? team.category : ''

  const teamSponsorships = sponsorships.filter(s => s.teamId === teamId)
  const teamExpenses = expenses.filter(e => e.teamId === teamId)
  const teamPurchases = purchases.filter(p => p.teamId === teamId)

  const totalReceived = teamSponsorships.reduce((acc, s) => acc + (s.amount || 0), 0)
  const totalSpent = teamExpenses.reduce((acc, e) => acc + (e.amount || 0), 0)
  const currentBalance = totalReceived - totalSpent

  const inProgressPurchases = teamPurchases.filter(p =>
    ['aprovada', 'compra_em_andamento'].includes(p.status)
  )
  const pendingRequests = teamPurchases.filter(p =>
    ['enviada', 'em_analise', 'ajuste_solicitado'].includes(p.status)
  )

  return {
    teamId,
    teamName,
    category,
    totalReceived,
    totalSpent,
    currentBalance,
    inProgressPurchasesCount: inProgressPurchases.length,
    inProgressPurchasesApprovedTotal: inProgressPurchases.reduce(
      (acc, p) => acc + (p.approvedAmount || p.estimatedTotal || 0),
      0
    ),
    pendingRequestsCount: pendingRequests.length
  }
}

export function buildStatement(params: {
  sponsorships: Sponsorship[]
  expenses: Expense[]
  targetTeamId: string
  startDate?: string
  endDate?: string
  category?: string
}): StatementResponse {
  const { targetTeamId, startDate, endDate, category } = params
  let sponsorships = [...params.sponsorships]
  let expenses = [...params.expenses]

  if (targetTeamId !== 'all') {
    sponsorships = sponsorships.filter(s => s.teamId === targetTeamId)
    expenses = expenses.filter(e => e.teamId === targetTeamId)
  }

  if (startDate) {
    sponsorships = sponsorships.filter(s => s.receiptDate >= startDate)
    expenses = expenses.filter(e => e.expenseDate >= startDate)
  }

  if (endDate) {
    sponsorships = sponsorships.filter(s => s.receiptDate <= endDate)
    expenses = expenses.filter(e => e.expenseDate <= endDate)
  }

  if (category && category !== 'all') {
    expenses = expenses.filter(e => e.category === category)
    if (category !== 'Patrocínio') {
      sponsorships = []
    }
  }

  const entries: Omit<StatementItem, 'balanceAfter'>[] = []

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

  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  let runningBalance = 0
  let totalEntries = 0
  let totalExits = 0

  const withBalance = entries.map(entry => {
    if (entry.type === 'sponsorship') {
      runningBalance += entry.amount
      totalEntries += entry.amount
    } else {
      runningBalance -= entry.amount
      totalExits += entry.amount
    }
    return { ...entry, balanceAfter: runningBalance }
  })

  return {
    targetTeamId,
    totalEntries,
    totalExits,
    currentBalance: runningBalance,
    items: withBalance.reverse()
  }
}

export function buildDashboardMetrics(params: {
  teams: Team[]
  sponsorships: Sponsorship[]
  expenses: Expense[]
  purchases: PurchaseRequest[]
  logs: AuditLog[]
  targetTeamId: string
}): DashboardData {
  const { targetTeamId } = params

  const sponsorships = targetTeamId === 'all'
    ? params.sponsorships
    : params.sponsorships.filter(s => s.teamId === targetTeamId)
  const expenses = targetTeamId === 'all'
    ? params.expenses
    : params.expenses.filter(e => e.teamId === targetTeamId)
  const purchases = targetTeamId === 'all'
    ? params.purchases
    : params.purchases.filter(p => p.teamId === targetTeamId)

  const totalReceived = sponsorships.reduce((acc, s) => acc + (s.amount || 0), 0)
  const totalSpent = expenses.reduce((acc, e) => acc + (e.amount || 0), 0)

  const inProgressPurchases = purchases.filter(p =>
    ['aprovada', 'compra_em_andamento'].includes(p.status)
  )

  const pendingRequests = purchases
    .filter(p => ['enviada', 'em_analise', 'ajuste_solicitado'].includes(p.status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const teamsSummaries = params.teams.map(t =>
    computeTeamFinancialSummary(params.teams, params.sponsorships, params.expenses, params.purchases, t.id)
  )

  const logs = targetTeamId === 'all'
    ? params.logs
    : params.logs.filter(l => l.teamId === targetTeamId)

  return {
    metrics: {
      totalReceived,
      totalSpent,
      currentBalance: totalReceived - totalSpent,
      inProgressPurchasesCount: inProgressPurchases.length,
      inProgressPurchasesApprovedTotal: inProgressPurchases.reduce(
        (acc, p) => acc + (p.approvedAmount || p.estimatedTotal || 0),
        0
      ),
      pendingRequestsCount: pendingRequests.length
    },
    teamsSummaries,
    pendingRequests,
    recentLogs: logs.slice(0, 10)
  }
}