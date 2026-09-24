import type { StatementResponse } from '../types'
import { formatDate } from './formatters'


export function exportStatementToCSV(statement: StatementResponse, filename = 'extrato_financeiro_robotica.csv') {
  const headers = [
    'Data',
    'Tipo',
    'Equipe',
    'Categoria',
    'Descricao',
    'Patrocinador_Fornecedor',
    'Valor_R$',
    'Saldo_Apos_R$',
    'Responsavel_Lancamento'
  ]

  const rows = statement.items.map(item => {
    const isEntry = item.type === 'sponsorship'
    const signedAmount = (isEntry ? item.amount : -item.amount).toFixed(2)
    
    return [
      `"${formatDate(item.date)}"`,
      `"${isEntry ? 'Entrada' : 'Saida'}"`,
      `"${item.teamName.replace(/"/g, '""')}"`,
      `"${item.category.replace(/"/g, '""')}"`,
      `"${item.description.replace(/"/g, '""')}"`,
      `"${item.counterpart.replace(/"/g, '""')}"`,
      signedAmount,
      item.balanceAfter.toFixed(2),
      `"${item.registeredByName.replace(/"/g, '""')}"`
    ].join(';')
  })

  // Prepend UTF-8 BOM for Excel compatibility in Portuguese
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
