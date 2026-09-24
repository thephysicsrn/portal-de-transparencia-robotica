import React, { useState, useEffect } from 'react'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Clock,
  ArrowRight,
  PlusCircle,
  AlertTriangle,
  CheckCircle,
  Cpu,
  Layers,
  FileCheck
} from 'lucide-react'
import type { DashboardData, PurchaseRequest } from '../types'
import { api } from '../services/api'
import { formatCurrency, getPurchaseStatusConfig, formatDateTime } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'

interface DashboardViewProps {
  onNavigateTab: (tab: string, filterParams?: any) => void
  onOpenNewSponsorship: () => void
  onOpenNewExpense: () => void
  onOpenNewPurchase: () => void
  onSelectPurchaseRequest: (request: PurchaseRequest) => void
  refreshTrigger: number
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenNewSponsorship,
  onOpenNewExpense,
  onOpenNewPurchase,
  onSelectPurchaseRequest,
  refreshTrigger
}) => {
  const { user, selectedTeamId, isTechnicalLead } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const res = await api.getDashboard(selectedTeamId)
      setData(res)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar métricas do painel.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [selectedTeamId, refreshTrigger])

  if (loading && !data) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <div className="stat-icon-wrapper cyan" style={{ margin: '0 auto 16px', width: 48, height: 48 }}>
          <Cpu className="animate-spin" size={24} />
        </div>
        <p>Carregando painel financeiro em tempo real...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card" style={{ borderColor: 'var(--accent-rose)', margin: '20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--accent-rose)' }}>
          <AlertTriangle size={24} />
          <div>
            <h4 style={{ color: 'var(--accent-rose)' }}>Erro ao carregar dados</h4>
            <p style={{ color: 'var(--text-muted)' }}>{error}</p>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} onClick={fetchDashboard}>
          Tentar Novamente
        </button>
      </div>
    )
  }

  const { metrics, teamsSummaries, pendingRequests, recentLogs } = data || {
    metrics: {
      totalReceived: 0,
      totalSpent: 0,
      currentBalance: 0,
      inProgressPurchasesCount: 0,
      inProgressPurchasesApprovedTotal: 0,
      pendingRequestsCount: 0
    },
    teamsSummaries: [],
    pendingRequests: [],
    recentLogs: []
  }

  return (
    <div>
      {/* Top Banner / Welcome */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Layers size={28} color="var(--accent-cyan)" />
            Painel Financeiro & Transparência
          </h1>
          <p style={{ marginTop: 4 }}>
            {isTechnicalLead
              ? 'Supervisão técnica centralizada de patrocínios, despesas e solicitações de compra de todas as equipes.'
              : `Acompanhamento em tempo real da saúde financeira e solicitações da equipe ${user?.team?.name || ''}.`}
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="page-actions">
          <button className="btn btn-outline" onClick={onOpenNewSponsorship}>
            <PlusCircle size={16} /> Novo Patrocínio
          </button>
          <button className="btn btn-outline" onClick={onOpenNewExpense}>
            <PlusCircle size={16} /> Lançar Despesa
          </button>
          <button className="btn btn-primary" onClick={onOpenNewPurchase}>
            <ShoppingCart size={16} /> Nova Solicitação
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid-metrics">
        {/* Current Balance */}
        <div className="stat-card cyan">
          <div className="stat-header">
            <span className="stat-label">Saldo Disponível em Caixa</span>
            <div className="stat-icon-wrapper cyan">
              <Wallet size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: metrics.currentBalance >= 0 ? 'var(--accent-cyan)' : 'var(--accent-rose)' }}>
            {formatCurrency(metrics.currentBalance)}
          </div>
          <span className="stat-subtext">Patrocínios recebidos menos despesas realizadas</span>
        </div>

        {/* Total Received */}
        <div className="stat-card emerald">
          <div className="stat-header">
            <span className="stat-label">Total Patrocínios (Entradas)</span>
            <div className="stat-icon-wrapper emerald">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
            {formatCurrency(metrics.totalReceived)}
          </div>
          <span className="stat-subtext">Recursos captados e auditados</span>
        </div>

        {/* Total Spent */}
        <div className="stat-card rose">
          <div className="stat-header">
            <span className="stat-label">Total Despesas (Saídas)</span>
            <div className="stat-icon-wrapper rose">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-rose)' }}>
            {formatCurrency(metrics.totalSpent)}
          </div>
          <span className="stat-subtext">Pagamentos efetivamente realizados</span>
        </div>

        {/* Purchases in progress */}
        <div className="stat-card indigo">
          <div className="stat-header">
            <span className="stat-label">Compras em Andamento</span>
            <div className="stat-icon-wrapper indigo">
              <ShoppingCart size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-indigo)' }}>
            {metrics.inProgressPurchasesCount}
          </div>
          <span className="stat-subtext">
            Comprometido est.: {formatCurrency(metrics.inProgressPurchasesApprovedTotal)}
          </span>
        </div>

        {/* Pending Requests */}
        <div className="stat-card amber">
          <div className="stat-header">
            <span className="stat-label">Aguardando Decisão</span>
            <div className="stat-icon-wrapper amber">
              <Clock size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-amber)' }}>
            {metrics.pendingRequestsCount}
          </div>
          <span className="stat-subtext">Solicitações com parecer pendente</span>
        </div>
      </div>

      {/* Teams Breakdown (Crucial requirement: Apresentar por equipe) */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Cpu size={20} color="var(--accent-cyan)" />
            Balanço Financeiro por Equipe de Robótica
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Atualizado automaticamente após cada lançamento
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Equipe</th>
                <th>Modalidade</th>
                <th style={{ textAlign: 'right' }}>Total Recebido</th>
                <th style={{ textAlign: 'right' }}>Total Gasto</th>
                <th style={{ textAlign: 'right' }}>Saldo Atual</th>
                <th style={{ textAlign: 'center' }}>Compras em Andamento</th>
                <th style={{ textAlign: 'center' }}>Pendentes</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {teamsSummaries.map(t => {
                return (
                  <tr key={t.teamId}>

                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{t.teamName}</div>

                    </td>
                    <td>
                      <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                        {t.category}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="mono">
                      <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                        {formatCurrency(t.totalReceived)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="mono">
                      <span style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>
                        {formatCurrency(t.totalSpent)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="mono">
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          color: t.currentBalance >= 0 ? 'var(--accent-cyan)' : 'var(--accent-rose)'
                        }}
                      >
                        {formatCurrency(t.currentBalance)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {t.inProgressPurchasesCount > 0 ? (
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <span className="badge badge-compra_em_andamento">
                            {t.inProgressPurchasesCount} em andamento
                          </span>
                          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                            {formatCurrency(t.inProgressPurchasesApprovedTotal)}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {t.pendingRequestsCount > 0 ? (
                        <span className="badge badge-enviada">
                          <span className="badge-dot"></span>
                          {t.pendingRequestsCount} pendente{t.pendingRequestsCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--accent-emerald)', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={14} /> Em dia
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => onNavigateTab('accountability', { teamId: t.teamId })}
                      >
                        Ver Extrato
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two columns: Pending Purchase Requests & Audit Timeline */}
      <div className="grid-dashboard-splits">
        {/* Left Column: Purchase Requests Needing Attention */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={20} color="var(--accent-amber)" />
              Solicitações que Exigem Atenção
            </h2>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onNavigateTab('purchases')}
            >
              Ver Todas <ArrowRight size={14} />
            </button>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="empty-state">
              <FileCheck size={40} className="empty-icon" style={{ color: 'var(--accent-emerald)' }} />
              <div className="empty-title">Nenhuma solicitação pendente!</div>
              <p>Todas as solicitações de compra foram analisadas e decididas.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingRequests.map(req => {
                const statusCfg = getPurchaseStatusConfig(req.status)
                return (
                  <div
                    key={req.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--border-strong)'
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)'
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                    }}
                    onClick={() => onSelectPurchaseRequest(req)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.925rem', lineHeight: 1.35, flex: 1 }}>
                        {req.title}
                      </span>
                      <span className={`badge ${statusCfg.className}`} style={{ flexShrink: 0 }}>
                        <span className="badge-dot"></span>
                        {statusCfg.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Equipe: <strong style={{ color: 'var(--text-main)' }}>{req.teamName || 'Equipe'}</strong> • Solicitado por: {req.createdByName}
                      </span>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-sm)'
                      }}>
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontWeight: 600 }}>Estimado:</span>
                        <span className="mono" style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.85rem' }}>
                          {formatCurrency(req.estimatedTotal)}
                        </span>
                      </div>
                    </div>

                    {req.reviewNotes && req.status === 'ajuste_solicitado' && (
                      <div style={{
                        marginTop: 4,
                        background: '#faf5ff',
                        borderLeft: '3px solid #a855f7',
                        padding: '8px 12px',
                        fontSize: '0.775rem',
                        color: '#6b21a8',
                        borderRadius: 4
                      }}>
                        <strong>Ajuste pedido:</strong> {req.reviewNotes}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

        </div>

        {/* Right Column: Recent Activity Logs */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Layers size={20} color="var(--primary)" />
              Atividades Recentes
            </h2>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onNavigateTab('audit')}
            >
              Auditoria <ArrowRight size={14} />
            </button>
          </div>

          {recentLogs.length === 0 ? (
            <div className="empty-state">
              <p>Nenhuma atividade registrada recentemente.</p>
            </div>
          ) : (
            <div className="timeline">
              {recentLogs.slice(0, 6).map(log => (
                <div key={log.id} className="timeline-item">
                  <div className="timeline-dot" />
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-main)', fontWeight: 600 }}>
                    {log.description}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>
                    Por <strong>{log.userName}</strong> • {formatDateTime(log.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
