import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { StatementResponse, Team } from '../types'
import { formatCurrency, formatDate } from './formatters'


export function generateAccountabilityPDF(
  statement: StatementResponse,
  team: Team | null,
  periodLabel: string = 'Todos os Períodos'
) {
  const doc = new jsPDF()
  const teamName = team ? team.name : 'Todas as Equipes (Consolidado Geral)'
  const teamCategory = team ? team.category : 'Visão Geral do Programa'

  // Header Background Banner
  doc.setFillColor(15, 23, 42) // Dark cyber slate
  doc.rect(0, 0, 210, 38, 'F')

  // Accent Line
  doc.setFillColor(6, 182, 212) // Cyan accent
  doc.rect(0, 36, 210, 2, 'F')

  // Header Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('PORTAL DE TRANSPARÊNCIA DA ROBÓTICA', 14, 16)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('RELATÓRIO OFICIAL DE PRESTAÇÃO DE CONTAS E EXTRATO FINANCEIRO', 14, 24)
  doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 30)

  // Scope & Meta Information
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`Equipe / Unidade: ${teamName}`, 14, 48)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text(`Modalidade: ${teamCategory} | Filtro de Período: ${periodLabel}`, 14, 54)
  if (team?.institution) {
    doc.text(`Instituição: ${team.institution} | Conta: ${team.bankAccount}`, 14, 60)
  }

  // Summary Metrics Box
  const startY = team?.institution ? 66 : 60
  doc.setFillColor(241, 245, 249)
  doc.roundedRect(14, startY, 182, 22, 3, 3, 'F')

  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('TOTAL PATROCÍNIOS (ENTRADAS)', 20, startY + 8)
  doc.text('TOTAL DESPESAS (SAÍDAS)', 82, startY + 8)
  doc.text('SALDO FINAL DISPONÍVEL', 144, startY + 8)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(16, 185, 129) // Emerald
  doc.text(formatCurrency(statement.totalEntries), 20, startY + 16)

  doc.setTextColor(244, 63, 94) // Rose
  doc.text(formatCurrency(statement.totalExits), 82, startY + 16)

  const balanceColor = statement.currentBalance >= 0 ? [2, 132, 199] : [244, 63, 94]
  doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2])
  doc.text(formatCurrency(statement.currentBalance), 144, startY + 16)

  // Table Data
  const tableRows = statement.items.map((item, index) => {
    const isEntry = item.type === 'sponsorship'
    const sign = isEntry ? '+' : '-'
    return [
      String(index + 1),
      formatDate(item.date),
      isEntry ? 'ENTRADA' : 'SAÍDA',
      item.teamName,
      item.category,
      item.description,
      item.counterpart,
      `${sign} ${formatCurrency(item.amount)}`,
      formatCurrency(item.balanceAfter)
    ]
  })

  autoTable(doc, {
    startY: startY + 28,
    head: [['#', 'Data', 'Tipo', 'Equipe', 'Categoria', 'Descrição / Finalidade', 'Origem/Destino', 'Valor', 'Saldo Acum.']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18 },
      2: { cellWidth: 16, fontStyle: 'bold' },
      3: { cellWidth: 22 },
      4: { cellWidth: 25 },
      5: { cellWidth: 42 },
      6: { cellWidth: 26 },
      7: { cellWidth: 20, halign: 'right', fontStyle: 'bold' },
      8: { cellWidth: 22, halign: 'right' }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        const text = String(data.cell.raw)
        if (text.startsWith('+')) {
          data.cell.styles.textColor = [16, 185, 129] // Emerald green
        } else {
          data.cell.styles.textColor = [225, 29, 72] // Crimson red
        }
      }
    },
    margin: { left: 14, right: 14 }
  })

  // Add Page Numbers and Security Signature
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `Portal de Transparência da Robótica | Documento auditável | Página ${i} de ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    )
  }

  // Save the PDF
  const sanitizedTeam = teamName.replace(/[^a-zA-Z0-9]/g, '_')
  doc.save(`Prestacao_Contas_${sanitizedTeam}_${Date.now()}.pdf`)
}
