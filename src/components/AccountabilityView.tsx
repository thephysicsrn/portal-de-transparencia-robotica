import React, { useState, useEffect } from 'react'
import {
  FileSpreadsheet,
  Download,
  FileDown,
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Building,
  ShieldCheck,
  CreditCard,
  RotateCcw
} from 'lucide-react'
import type { StatementResponse, Team } from '../types'
import { api } from '../services/api'

import { formatCurrency, formatDate } from '../utils/formatters'
import { generateAccountabilityPDF } from '../utils/pdfGenerator'
import { exportStatementToCSV } from '../utils/csvExporter'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { ReceiptViewerModal } from './ReceiptViewerModal'

interface AccountabilityViewProps {
  teams: Team[]
  initialTeamFilter?: string
  refreshTrigger: number
}

export const AccountabilityView: React.FC<AccountabilityViewProps> = ({
  teams,
  initialTeamFilter,
  refreshTrigger
}) => {
  const { user, selectedTeamId, isTechnicalLead } = useAuth()
  const { showToast } = useToast()

  const [statement, setStatement] = useState<StatementResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [teamFilter, setTeamFilter] = useState(initialTeamFilter || (isTechnicalLead && selectedTeamId ? selectedTeamId : 'all'))
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Keep teamFilter in sync whenever initialTeamFilter or global selectedTeamId changes
  useEffect(() => {
    if (initialTeamFilter) {
      setTeamFilter(initialTeamFilter)
    } else if (isTechnicalLead && selectedTeamId) {
      setTeamFilter(selectedTeamId)
    }
  }, [initialTeamFilter, selectedTeamId, isTechnicalLead])

  const [selectedReceipt, setSelectedReceipt] = useState<{
    isOpen: boolean
    title: string
    receiptUrl?: string | null
    fileName?: string | null
    amount?: number
    date?: string
    counterpart?: string
  }>({ isOpen: false, title: '' })

  const fetchStatement = async () => {
    try {
      setLoading(true)
      const data = await api.getStatement({
        teamId: isTechnicalLead ? teamFilter : user?.teamId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined
      })
      setStatement(data)
    } catch (err: any) {
      showToast(err.message || 'Erro ao carregar extrato de prestação de contas.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatement()
  }, [teamFilter, startDate, endDate, categoryFilter, refreshTrigger])

  const currentSelectedTeam = teams.find(t => t.id === teamFilter) || null

  const handleExportPDF = () => {
    if (!statement) return
    try {
      let periodLabel = 'Todo o período'
      if (startDate && endDate) {
        periodLabel = `${formatDate(startDate)} até ${formatDate(endDate)}`
      } else if (startDate) {
        periodLabel = `A partir de ${formatDate(startDate)}`
      } else if (endDate) {
        periodLabel = `Até ${formatDate(endDate)}`
      }

      generateAccountabilityPDF(statement, currentSelectedTeam, periodLabel)
      showToast('Relatório de Prestação de Contas gerado em PDF com sucesso!', 'success')
    } catch (err: any) {
      showToast('Erro ao gerar relatório em PDF.', 'error')
    }
  }

  const handleExportCSV = () => {
    if (!statement) return
    try {
      const teamSlug = currentSelectedTeam ? currentSelectedTeam.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'consolidado_geral'
      exportStatementToCSV(statement, `extrato_robotica_${teamSlug}.csv`)
      showToast('Extrato exportado em CSV/Excel com sucesso!', 'success')
    } catch {
      showToast('Erro ao exportar arquivo CSV.', 'error')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FileSpreadsheet size={28} color="var(--accent-cyan)" />
            Prestação de Contas & Extrato Financeiro
          </h1>
          <p>
            Extrato unificado e cronológico de movimentações financeiras, consulta de comprovantes e emissão de relatórios oficiais.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleExportCSV} disabled={!statement || statement.items.length === 0}>
            <Download size={16} /> Exportar Planilha (CSV)
          </button>
          <button className="btn btn-primary" onClick={handleExportPDF} disabled={!statement || statement.items.length === 0}>
            <FileDown size={16} /> Exportar Relatório em PDF
          </button>
        </div>
      </div>

      {/* Seletor Visual de Extrato por Equipe (Responsável Técnica) */}
      {isTechnicalLead && (
        <div className="team-filter-bar">
          <div className="team-filter-title">
            <Users size={16} />
            <span>Visualizar Extrato de:</span>
          </div>
          <div className="team-pills-list">
            <button
              type="button"
              className={`team-pill ${teamFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTeamFilter('all')}
            >
              <Building size={14} />
              <span>Todas as Equipes (Consolidado)</span>
            </button>
            {teams.map(t => (
              <button
                type="button"
                key={t.id}
                className={`team-pill ${teamFilter === t.id ? 'active' : ''}`}
                onClick={() => setTeamFilter(t.id)}
              >
                <span className="team-pill-code">#{t.code}</span>
                <span>{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Banner Informativo da Equipe Selecionada */}
      {currentSelectedTeam && (
        <div className="card team-selected-banner">
          <div className="team-banner-content">
            <div className="team-banner-info">
              <div className="team-banner-header">
                <span className="badge badge-compra_em_andamento">{currentSelectedTeam.category}</span>
                <span className="team-code-pill">#{currentSelectedTeam.code}</span>
              </div>
              <h2 className="team-banner-title">{currentSelectedTeam.name}</h2>
              <div className="team-banner-meta">
                {currentSelectedTeam.institution && (
                  <span><Building size={14} color="var(--primary)" /> {currentSelectedTeam.institution}</span>
                )}
                {currentSelectedTeam.leaderName && (
                  <span><ShieldCheck size={14} color="var(--accent-emerald)" /> Responsável: <strong>{currentSelectedTeam.leaderName}</strong></span>
                )}
                {currentSelectedTeam.bankAccount && (
                  <span className="mono"><CreditCard size={14} color="var(--accent-amber)" /> Conta: {currentSelectedTeam.bankAccount}</span>
                )}
              </div>
            </div>
            {isTechnicalLead && (
              <div className="team-banner-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setTeamFilter('all')}
                  title="Voltar para o extrato consolidado de todas as equipes"
                >
                  <RotateCcw size={14} /> Ver Consolidado Geral
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards for Extrato */}
      {statement && (
        <div className="grid-metrics" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <div className="stat-card cyan">
            <div className="stat-header">
              <span className="stat-label">Saldo Final no Período</span>
              <div className="stat-icon-wrapper cyan">
                <Wallet size={20} />
              </div>
            </div>
            <div className="stat-value" style={{ color: statement.currentBalance >= 0 ? 'var(--accent-cyan)' : 'var(--accent-rose)' }}>
              {formatCurrency(statement.currentBalance)}
            </div>
            <span className="stat-subtext">Patrocínios recebidos menos pagamentos</span>
          </div>

          <div className="stat-card emerald">
            <div className="stat-header">
              <span className="stat-label">Total Entradas (Patrocínios)</span>
              <div className="stat-icon-wrapper emerald">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
              {formatCurrency(statement.totalEntries)}
            </div>
            <span className="stat-subtext">Recursos comprovados</span>
          </div>

          <div className="stat-card rose">
            <div className="stat-header">
              <span className="stat-label">Total Saídas (Despesas)</span>
              <div className="stat-icon-wrapper rose">
                <TrendingDown size={20} />
              </div>
            </div>
            <div className="stat-value" style={{ color: 'var(--accent-rose)' }}>
              {formatCurrency(statement.totalExits)}
            </div>
            <span className="stat-subtext">Pagamentos efetuados</span>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="filter-bar">
        {isTechnicalLead && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Equipe:</span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '8px 12px' }}
              value={teamFilter}
              onChange={e => setTeamFilter(e.target.value)}
            >
              <option value="all">Todas as Equipes (Consolidado)</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>De:</span>
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto', padding: '7px 10px', fontSize: '0.825rem' }}
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Até:</span>
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto', padding: '7px 10px', fontSize: '0.825rem' }}
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Categoria:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '8px 12px' }}
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="all">Todas as Categorias</option>
            <option value="Patrocínio">Apenas Patrocínios / Entradas</option>
            <option value="Peças e Componentes">Peças e Componentes</option>
            <option value="Eletrônica e Sensores">Eletrônica e Sensores</option>
            <option value="Ferramentas e Usinagem">Ferramentas e Usinagem</option>
            <option value="Inscrições e Torneios">Inscrições e Torneios</option>
            <option value="Transporte e Viagem">Transporte e Viagem</option>
            <option value="Alimentação">Alimentação</option>
            <option value="Marketing e Uniformes">Marketing e Uniformes</option>
          </select>
        </div>

        {(startDate || endDate || categoryFilter !== 'all' || (isTechnicalLead && teamFilter !== 'all')) && (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              setStartDate('')
              setEndDate('')
              setCategoryFilter('all')
              if (isTechnicalLead) setTeamFilter('all')
            }}
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Statement Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Equipe</th>
              <th>Categoria</th>
              <th>Descrição / Finalidade</th>
              <th>Patrocinador / Fornecedor</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
              <th style={{ textAlign: 'right' }}>Saldo Acumulado</th>
              <th style={{ textAlign: 'center' }}>Comprovante</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 36 }}>
                  Carregando extrato de movimentações...
                </td>
              </tr>
            ) : !statement || statement.items.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state">
                    <FileSpreadsheet size={44} className="empty-icon" />
                    <div className="empty-title">Nenhum lançamento no período selecionado</div>
                    <p>Ajuste os filtros de data ou categoria para visualizar os registros.</p>
                  </div>
                </td>
              </tr>
            ) : (
              statement.items.map(item => {
                const isEntry = item.type === 'sponsorship'
                return (
                  <tr key={`${item.type}-${item.id}`}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={13} color="var(--text-dim)" />
                        <span>{formatDate(item.date)}</span>
                      </div>
                    </td>
                    <td>
                      {isEntry ? (
                        <span className="badge badge-entrada">
                          + ENTRADA
                        </span>
                      ) : (
                        <span className="badge badge-saida">
                          - SAÍDA
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="badge"
                        style={{
                          background: '#f0f9ff',
                          color: 'var(--primary)',
                          border: '1px solid #bae6fd',
                          cursor: isTechnicalLead ? 'pointer' : 'default',
                          fontSize: '0.725rem'
                        }}
                        onClick={() => {
                          if (isTechnicalLead && item.teamId) {
                            setTeamFilter(item.teamId)
                          }
                        }}
                        title={isTechnicalLead ? 'Clique para filtrar o extrato apenas desta equipe' : undefined}
                      >
                        {item.teamName}
                      </button>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{item.category}</span>
                    </td>
                    <td style={{ maxWidth: 280 }}>
                      <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>{item.description}</div>

                      <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                        Lançado por: {item.registeredByName}
                      </div>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-muted)' }}>{item.counterpart}</span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="mono">
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          color: isEntry ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                        }}
                      >
                        {isEntry ? '+' : '-'} {formatCurrency(item.amount)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="mono">
                      <span style={{ fontWeight: 600, color: item.balanceAfter >= 0 ? 'var(--accent-cyan)' : 'var(--accent-rose)' }}>
                        {formatCurrency(item.balanceAfter)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {item.receiptUrl ? (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() =>
                            setSelectedReceipt({
                              isOpen: true,
                              title: `Comprovante: ${item.description}`,
                              receiptUrl: item.receiptUrl,
                              fileName: item.receiptFileName,
                              amount: item.amount,
                              date: formatDate(item.date),
                              counterpart: item.counterpart
                            })
                          }
                        >
                          <FileText size={14} /> Ver Anexo
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Sem anexo</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Receipt Viewer */}
      <ReceiptViewerModal
        isOpen={selectedReceipt.isOpen}
        onClose={() => setSelectedReceipt({ ...selectedReceipt, isOpen: false })}
        title={selectedReceipt.title}
        receiptUrl={selectedReceipt.receiptUrl}
        fileName={selectedReceipt.fileName}
        amount={selectedReceipt.amount}
        date={selectedReceipt.date}
        counterpart={selectedReceipt.counterpart}
      />
    </div>
  )
}
