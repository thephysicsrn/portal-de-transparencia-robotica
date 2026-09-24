import type { PurchaseStatus } from '../types'


export function formatCurrency(value: number | string | undefined | null): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (num === undefined || num === null || isNaN(num)) return 'R$ 0,00'
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-'
  try {
    // If YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-')
      return `${day}/${month}/${year}`
    }
    const d = new Date(dateString)
    return d.toLocaleDateString('pt-BR')
  } catch {
    return dateString
  }
}

export function formatDateTime(dateTimeString: string | undefined | null): string {
  if (!dateTimeString) return '-'
  try {
    const d = new Date(dateTimeString)
    return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  } catch {
    return dateTimeString
  }
}

export interface StatusConfig {
  label: string
  className: string
  color: string
}

export const PURCHASE_STATUS_CONFIG: Record<PurchaseStatus, StatusConfig> = {
  enviada: {
    label: 'Aguardando Decisão',
    className: 'badge-enviada',
    color: '#f59e0b'
  },
  em_analise: {
    label: 'Em Análise Técnica',
    className: 'badge-em_analise',
    color: '#38bdf8'
  },
  ajuste_solicitado: {
    label: 'Ajuste Solicitado',
    className: 'badge-ajuste_solicitado',
    color: '#c084fc'
  },
  aprovada: {
    label: 'Aprovada',
    className: 'badge-aprovada',
    color: '#2dd4bf'
  },
  rejeitada: {
    label: 'Rejeitada',
    className: 'badge-rejeitada',
    color: '#f43f5e'
  },
  compra_em_andamento: {
    label: 'Compra em Andamento',
    className: 'badge-compra_em_andamento',
    color: '#818cf8'
  },
  concluida: {
    label: 'Concluída',
    className: 'badge-concluida',
    color: '#10b981'
  }
}

export function getPurchaseStatusConfig(status: PurchaseStatus): StatusConfig {
  return PURCHASE_STATUS_CONFIG[status] || {
    label: status,
    className: 'badge-enviada',
    color: '#94a3b8'
  }
}

export const EXPENSE_CATEGORIES = [
  'Peças e Componentes',
  'Eletrônica e Sensores',
  'Ferramentas e Usinagem',
  'Inscrições e Torneios',
  'Transporte e Viagem',
  'Alimentação',
  'Marketing e Uniformes',
  'Outros'
] as const

export function getCategoryBadgeColor(category: string): string {
  switch (category) {
    case 'Peças e Componentes': return '#06b6d4'
    case 'Eletrônica e Sensores': return '#3b82f6'
    case 'Ferramentas e Usinagem': return '#f59e0b'
    case 'Inscrições e Torneios': return '#ec4899'
    case 'Transporte e Viagem': return '#8b5cf6'
    case 'Alimentação': return '#10b981'
    case 'Marketing e Uniformes': return '#f97316'
    default: return '#64748b'
  }
}
