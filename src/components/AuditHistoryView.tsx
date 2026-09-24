import React, { useState, useEffect } from 'react'
import {
  History,
  Search,
  ShieldCheck,
  UserCheck,
  Clock,
  FileText
} from 'lucide-react'
import type { AuditLog } from '../types'
import { api } from '../services/api'
import { formatDateTime } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'

interface AuditHistoryViewProps {
  refreshTrigger: number
}

export const AuditHistoryView: React.FC<AuditHistoryViewProps> = ({ refreshTrigger }) => {
  const { selectedTeamId } = useAuth()
  const { showToast } = useToast()


  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const data = await api.getAuditLogs(selectedTeamId)
      setLogs(data)
    } catch (err: any) {
      showToast(err.message || 'Erro ao carregar histórico de auditoria.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [selectedTeamId, refreshTrigger])

  const filtered = logs.filter(log => {
    const term = searchTerm.toLowerCase()
    return (
      log.description.toLowerCase().includes(term) ||
      log.userName.toLowerCase().includes(term) ||
      (log.teamName && log.teamName.toLowerCase().includes(term)) ||
      log.action.toLowerCase().includes(term)
    )
  })

  const getActionBadgeColor = (action: string) => {
    if (action.includes('APROVOU') || action.includes('CONCLUIU')) return '#10b981'
    if (action.includes('REJEITOU') || action.includes('EXCLUIU')) return '#f43f5e'
    if (action.includes('AJUSTE')) return '#c084fc'
    if (action.includes('ANALISE')) return '#38bdf8'
    if (action.includes('CRIOU')) return '#06b6d4'
    return '#64748b'
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <History size={28} color="var(--primary-light)" />
            Histórico & Trilha de Auditoria Imutável
          </h1>
          <p>
            Rastreamento completo e permanente de todas as operações realizadas: autor, perfil, data/hora e detalhamento de alterações.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por descrição, usuário, equipe ou tipo de ação..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Total de <strong>{filtered.length}</strong> registro(s) auditados
        </span>
      </div>

      {/* Table / Timeline */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Data e Hora</th>
              <th>Ação Auditada</th>
              <th>Descrição do Evento</th>
              <th>Equipe</th>
              <th>Usuário Responsável</th>
              <th>Perfil</th>
              <th style={{ textAlign: 'center' }}>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 36 }}>
                  Carregando trilha de auditoria...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <History size={44} className="empty-icon" />
                    <div className="empty-title">Nenhum evento registrado</div>
                    <p>As ações dos usuários aparecerão aqui automaticamente.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(log => {
                const color = getActionBadgeColor(log.action)
                return (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={13} color="var(--text-dim)" />
                        <span>{formatDateTime(log.timestamp)}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: `${color}15`,
                          color: color,
                          border: `1px solid ${color}40`,
                          fontSize: '0.7rem'
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td style={{ maxWidth: 360 }}>
                      <div style={{ color: 'var(--text-main)', fontSize: '0.875rem' }}>{log.description}</div>
                    </td>

                    <td>
                      {log.teamName ? (
                        <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)' }}>
                          {log.teamName}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Global</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                        {log.userName}
                      </span>
                    </td>
                    <td>
                      {log.userRole === 'technical_lead' ? (
                        <span style={{ color: 'var(--accent-cyan)', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <ShieldCheck size={12} /> Técnica
                        </span>
                      ) : (
                        <span style={{ color: 'var(--accent-emerald)', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <UserCheck size={12} /> Representante
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {log.details ? (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <FileText size={13} /> Dados
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>-</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <FileText size={20} color="var(--accent-cyan)" />
                <span>Detalhes Técnicos da Auditoria</span>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-icon"
                onClick={() => setSelectedLog(null)}
                style={{ padding: 6 }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{selectedLog.description}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 4 }}>
                  Registrado em {formatDateTime(selectedLog.timestamp)} por {selectedLog.userName}
                </div>
              </div>

              <pre style={{
                background: 'var(--bg-tertiary)',
                padding: 16,
                borderRadius: 'var(--radius-md)',
                color: 'var(--primary)',
                fontSize: '0.775rem',
                overflowX: 'auto',
                border: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-code)'
              }}>
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedLog(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
