import React, { useState, useEffect } from 'react'
import {
  ShoppingCart,
  PlusCircle,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlayCircle,
  FileCheck2,
  Trash2,
  Plus,
  ShieldCheck,
  UploadCloud,
  FileText
} from 'lucide-react'
import type { PurchaseRequest, Team } from '../types'
import { api } from '../services/api'

import {
  formatCurrency,
  formatDate,
  getPurchaseStatusConfig
} from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { ReceiptViewerModal } from './ReceiptViewerModal'

interface PurchaseRequestsViewProps {
  teams: Team[]
  isModalOpen: boolean
  onCloseModal: () => void
  onOpenModal: () => void
  selectedRequestFromDash?: PurchaseRequest | null
  refreshTrigger: number
  onDataChanged: () => void
}

export const PurchaseRequestsView: React.FC<PurchaseRequestsViewProps> = ({
  teams,
  isModalOpen,
  onCloseModal,
  onOpenModal,
  selectedRequestFromDash,
  refreshTrigger,
  onDataChanged
}) => {
  const { user, selectedTeamId, isTechnicalLead } = useAuth()
  const { showToast } = useToast()

  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals
  const [reviewingRequest, setReviewingRequest] = useState<PurchaseRequest | null>(null)
  const [completingRequest, setCompletingRequest] = useState<PurchaseRequest | null>(null)
  const [selectedReceipt, setSelectedReceipt] = useState<{
    isOpen: boolean
    title: string
    receiptUrl?: string | null
    fileName?: string | null
    amount?: number
  }>({ isOpen: false, title: '' })


  // New Request Form State
  const [formData, setFormData] = useState({
    title: '',
    teamId: user?.teamId || (teams[0]?.id || ''),
    purpose: '',
    justification: '',
    urgency: 'media' as 'baixa' | 'media' | 'alta' | 'critica',
    items: [
      { id: '1', name: '', quantity: 1, unitPriceEstimated: 0, totalEstimated: 0, referenceLink: '' }
    ]
  })
  const [submitting, setSubmitting] = useState(false)

  // Decision Modal State
  const [decisionAction, setDecisionAction] = useState<'aprovada' | 'rejeitada' | 'ajuste_solicitado' | 'em_analise'>('aprovada')
  const [decisionNotes, setDecisionNotes] = useState('')
  const [approvedAmount, setApprovedAmount] = useState('')
  const [deciding, setDeciding] = useState(false)

  // Complete Purchase Modal State
  const [completeForm, setCompleteForm] = useState({
    finalActualAmount: '',
    supplier: '',
    notes: '',
    finalReceiptUrl: '',
    finalReceiptFileName: ''
  })
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [completing, setCompleting] = useState(false)

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const data = await api.getPurchaseRequests(selectedTeamId, statusFilter)
      setRequests(data)
    } catch (err: any) {
      showToast(err.message || 'Erro ao carregar solicitações.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Open Decision Modal
  const openDecisionModal = (req: PurchaseRequest) => {
    setReviewingRequest(req)
    setDecisionAction('aprovada')
    setApprovedAmount(String(req.estimatedTotal))
    setDecisionNotes('')
  }

  // Open Complete Modal
  const openCompleteModal = (req: PurchaseRequest) => {
    setCompletingRequest(req)
    setCompleteForm({
      finalActualAmount: String(req.approvedAmount || req.estimatedTotal),
      supplier: '',
      notes: '',
      finalReceiptUrl: '',
      finalReceiptFileName: ''
    })
  }

  useEffect(() => {
    fetchRequests()
  }, [selectedTeamId, statusFilter, refreshTrigger])

  useEffect(() => {
    if (selectedRequestFromDash) {
      if (isTechnicalLead && ['enviada', 'em_analise', 'ajuste_solicitado'].includes(selectedRequestFromDash.status)) {
        openDecisionModal(selectedRequestFromDash)
      } else if (['compra_em_andamento', 'aprovada'].includes(selectedRequestFromDash.status)) {
        openCompleteModal(selectedRequestFromDash)
      }
    }
  }, [selectedRequestFromDash, isTechnicalLead])


  // Items manipulation
  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { id: String(Date.now()), name: '', quantity: 1, unitPriceEstimated: 0, totalEstimated: 0, referenceLink: '' }
      ]
    }))
  }

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) {
      showToast('A solicitação precisa ter ao menos 1 item.', 'error')
      return
    }
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const updated = [...prev.items]
      const item = { ...updated[index], [field]: value }
      if (field === 'quantity' || field === 'unitPriceEstimated') {
        const qty = parseInt(String(item.quantity)) || 0
        const unit = parseFloat(String(item.unitPriceEstimated)) || 0
        item.totalEstimated = qty * unit
      }
      updated[index] = item
      return { ...prev, items: updated }
    })
  }

  const totalEstimated = formData.items.reduce((acc, curr) => acc + curr.totalEstimated, 0)

  // Submit New Request
  const handleSubmitNewRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.purpose.trim() || !formData.justification.trim()) {
      showToast('Preencha os campos obrigatórios (Título, Finalidade e Justificativa).', 'error')
      return
    }

    const hasInvalidItem = formData.items.some(
      it => !it.name.trim() || it.quantity <= 0 || it.unitPriceEstimated <= 0
    )
    if (hasInvalidItem) {
      showToast('Preencha corretamente o nome, quantidade e valor unitário estimado de cada item.', 'error')
      return
    }

    try {
      setSubmitting(true)
      await api.createPurchaseRequest({
        ...formData,
        estimatedTotal: totalEstimated
      })
      showToast('Solicitação de compra enviada com sucesso! Aguardando análise da Responsável Técnica.', 'success')
      onCloseModal()
      setFormData({
        title: '',
        teamId: user?.teamId || (teams[0]?.id || ''),
        purpose: '',
        justification: '',
        urgency: 'media',
        items: [{ id: '1', name: '', quantity: 1, unitPriceEstimated: 0, totalEstimated: 0, referenceLink: '' }]
      })
      onDataChanged()
    } catch (err: any) {
      showToast(err.message || 'Erro ao enviar solicitação.', 'error')
    } finally {
      setSubmitting(false)
    }
  }



  // Submit Decision (Technical Lead Only)
  const handleSubmitDecision = async () => {
    if (!reviewingRequest) return

    if ((decisionAction === 'rejeitada' || decisionAction === 'ajuste_solicitado') && !decisionNotes.trim()) {
      showToast('Para rejeitar ou solicitar ajuste, a justificativa técnica é obrigatória.', 'error')
      return
    }

    const parsedApproved = decisionAction === 'aprovada' ? parseFloat(approvedAmount) : undefined
    if (decisionAction === 'aprovada' && (isNaN(parsedApproved!) || parsedApproved! <= 0)) {
      showToast('Informe um valor aprovado válido e positivo.', 'error')
      return
    }

    try {
      setDeciding(true)
      await api.updatePurchaseRequestStatus(reviewingRequest.id, {
        status: decisionAction,
        reviewNotes: decisionNotes,
        approvedAmount: parsedApproved
      })
      showToast(
        decisionAction === 'aprovada'
          ? 'Solicitação aprovada e transicionada para Compra em Andamento!'
          : decisionAction === 'rejeitada'
          ? 'Solicitação rejeitada com parecer técnico registrado.'
          : decisionAction === 'ajuste_solicitado'
          ? 'Ajustes solicitados à equipe!'
          : 'Status atualizado para Em Análise.',
        'success'
      )
      setReviewingRequest(null)
      onDataChanged()
    } catch (err: any) {
      showToast(err.message || 'Erro ao processar decisão.', 'error')
    } finally {
      setDeciding(false)
    }
  }



  // Handle Complete File Upload
  const handleCompleteFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingReceipt(true)
      const res = await api.uploadFile(file)
      setCompleteForm(prev => ({
        ...prev,
        finalReceiptUrl: res.fileUrl,
        finalReceiptFileName: res.originalName
      }))
      showToast('Nota Fiscal / Comprovante da compra anexado com sucesso!', 'success')
    } catch (err: any) {
      showToast(err.message || 'Erro ao enviar comprovante.', 'error')
    } finally {
      setUploadingReceipt(false)
    }
  }

  // Submit Complete Purchase
  const handleSubmitComplete = async () => {
    if (!completingRequest) return

    const parsedFinal = parseFloat(completeForm.finalActualAmount.replace(',', '.'))
    if (isNaN(parsedFinal) || parsedFinal <= 0) {
      showToast('Informe o valor efetivamente pago na compra.', 'error')
      return
    }

    try {
      setCompleting(true)
      await api.completePurchaseRequest(completingRequest.id, {
        finalActualAmount: parsedFinal,
        supplier: completeForm.supplier || 'Fornecedor da Compra',
        notes: completeForm.notes,
        finalReceiptUrl: completeForm.finalReceiptUrl,
        finalReceiptFileName: completeForm.finalReceiptFileName
      })
      showToast('Compra concluída com sucesso! Despesa registrada e saldo atualizado no extrato.', 'success')
      setCompletingRequest(null)
      onDataChanged()
    } catch (err: any) {
      showToast(err.message || 'Erro ao concluir compra.', 'error')
    } finally {
      setCompleting(false)
    }
  }

  // Filter list
  const filtered = requests.filter(r => {
    const term = searchTerm.toLowerCase()
    return (
      r.title.toLowerCase().includes(term) ||
      r.purpose.toLowerCase().includes(term) ||
      (r.teamName && r.teamName.toLowerCase().includes(term))
    )
  })

  const statusTabs = [
    { id: 'all', label: 'Todas as Solicitações' },
    { id: 'enviada', label: 'Aguardando Decisão' },
    { id: 'em_analise', label: 'Em Análise' },
    { id: 'ajuste_solicitado', label: 'Ajustes Pedidos' },
    { id: 'compra_em_andamento', label: 'Compras em Andamento' },
    { id: 'concluida', label: 'Concluídas' },
    { id: 'rejeitada', label: 'Rejeitadas' }
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ShoppingCart size={28} color="var(--accent-cyan)" />
            Solicitações & Gestão de Compras
          </h1>
          <p>
            Fluxo de requisição, análise técnica, aprovação de orçamento e comprovação de aquisições com controle de saldo real.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenModal}>
          <PlusCircle size={16} /> Nova Solicitação
        </button>
      </div>

      {/* Filter Tabs by Status */}
      <div className="tabs-nav">
        {statusTabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${statusFilter === tab.id ? 'active' : ''}`}
            onClick={() => setStatusFilter(tab.id)}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search and Summary */}
      <div className="filter-bar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por título, item, finalidade ou equipe..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Exibindo <strong>{filtered.length}</strong> solicitação(ões)
        </span>
      </div>

      {/* Table / List */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Título da Solicitação</th>
              <th>Equipe</th>
              <th>Itens & Quantidades</th>
              <th style={{ textAlign: 'right' }}>Valor Estimado</th>
              <th style={{ textAlign: 'right' }}>Valor Aprovado</th>
              <th style={{ textAlign: 'right' }}>Valor Efetivo</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 36 }}>
                  Carregando solicitações de compra...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state">
                    <ShoppingCart size={44} className="empty-icon" />
                    <div className="empty-title">Nenhuma solicitação encontrada</div>
                    <p>Nenhuma solicitação atende aos filtros atuais.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(req => {
                const statusCfg = getPurchaseStatusConfig(req.status)
                const canReview = isTechnicalLead && ['enviada', 'em_analise', 'ajuste_solicitado'].includes(req.status)
                const canComplete = ['compra_em_andamento', 'aprovada'].includes(req.status)

                return (
                  <tr key={req.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                      {formatDate(req.createdAt)}
                    </td>
                    <td style={{ maxWidth: 280 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.925rem' }}>
                        {req.title}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-dim)', marginTop: 2 }}>
                        {req.purpose}
                      </div>
                      {req.reviewNotes && (
                        <div style={{
                          marginTop: 6,
                          fontSize: '0.75rem',
                          background: 'var(--bg-tertiary)',
                          padding: '4px 8px',
                          borderRadius: 4,
                          borderLeft: `3px solid ${statusCfg.color}`
                        }}>
                          <strong>Parecer:</strong> {req.reviewNotes}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)' }}>
                        {req.teamName || 'Equipe'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>
                        {req.items.map(it => (
                          <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{it.quantity}x</span>
                            <span>{it.name}</span>

                            {it.referenceLink && (
                              <a
                                href={it.referenceLink}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: 'var(--accent-cyan)' }}
                                title="Ver link de referência"
                              >
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }} className="mono">
                      <span style={{ color: 'var(--text-muted)' }}>
                        {formatCurrency(req.estimatedTotal)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="mono">
                      <span style={{ color: req.approvedAmount ? 'var(--accent-cyan)' : 'var(--text-dim)', fontWeight: 600 }}>
                        {req.approvedAmount ? formatCurrency(req.approvedAmount) : '-'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="mono">
                      <span style={{ color: req.finalActualAmount ? 'var(--accent-rose)' : 'var(--text-dim)', fontWeight: 700 }}>
                        {req.finalActualAmount ? formatCurrency(req.finalActualAmount) : '-'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${statusCfg.className}`}>
                        <span className="badge-dot"></span>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        {/* Technical Lead Decision Button */}
                        {canReview && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => openDecisionModal(req)}
                            title="Avaliar solicitação (Aprovar, Rejeitar ou Pedir Ajuste)"
                          >
                            <ShieldCheck size={14} /> Avaliar
                          </button>
                        )}

                        {/* Complete Purchase Button */}
                        {canComplete && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => openCompleteModal(req)}
                            title="Concluir Compra e anexar NF/recibo"
                          >
                            <FileCheck2 size={14} /> Concluir Compra
                          </button>
                        )}

                        {/* View NF if completed */}
                        {req.finalReceiptUrl && (
                          <button
                            className="btn btn-outline btn-icon btn-sm"
                            title="Visualizar NF de Conclusão"
                            onClick={() =>
                              setSelectedReceipt({
                                isOpen: true,
                                title: `Nota Fiscal de Compra: ${req.title}`,
                                receiptUrl: req.finalReceiptUrl,
                                fileName: req.finalReceiptFileName,
                                amount: req.finalActualAmount || undefined
                              })
                            }
                          >
                            <FileText size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* New Purchase Request Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={onCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 750 }}>
            <form onSubmit={handleSubmitNewRequest}>
              <div className="modal-header">
                <div className="modal-title">
                  <ShoppingCart size={20} color="var(--accent-cyan)" />
                  <span>Nova Solicitação de Compra</span>
                </div>
                <button type="button" className="btn btn-outline btn-icon" onClick={onCloseModal} style={{ padding: 6 }}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                {isTechnicalLead && (
                  <div className="form-group">
                    <label className="form-label">
                      Equipe Solicitante <span className="required">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={formData.teamId}
                      onChange={e => setFormData({ ...formData, teamId: e.target.value })}
                      required
                    >
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.category})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">
                      Título da Solicitação <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Motores Brushless NEO 550 e Redutores Planetários"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Urgência</label>
                    <select
                      className="form-select"
                      value={formData.urgency}
                      onChange={e => setFormData({ ...formData, urgency: e.target.value as any })}
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                      <option value="critica">Crítica (Torneio)</option>
                    </select>
                  </div>
                </div>

                {/* Items List */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>
                      Itens a Adquirir <span className="required">*</span>
                    </label>
                    <button type="button" className="btn btn-outline btn-sm" onClick={handleAddItem}>
                      <Plus size={14} /> Adicionar Outro Item
                    </button>
                  </div>

                  {formData.items.map((item, idx) => (
                    <div
                      key={item.id}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: 12,
                        marginBottom: 10
                      }}
                    >
                      <div className="form-row" style={{ marginBottom: 8 }}>
                        <div style={{ flex: 3 }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder={`Item #${idx + 1}: Descrição / Modelo`}
                            value={item.name}
                            onChange={e => handleItemChange(idx, 'name', e.target.value)}
                            required
                          />
                        </div>
                        <div style={{ width: 85 }}>
                          <input
                            type="number"
                            min="1"
                            className="form-input mono"
                            placeholder="Qtd"
                            value={item.quantity}
                            onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                            required
                          />
                        </div>
                        <div style={{ width: 130 }}>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            className="form-input mono"
                            placeholder="Unit. Est. (R$)"
                            value={item.unitPriceEstimated || ''}
                            onChange={e => handleItemChange(idx, 'unitPriceEstimated', e.target.value)}
                            required
                          />
                        </div>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-outline btn-icon"
                            style={{ color: 'var(--accent-rose)', alignSelf: 'center' }}
                            onClick={() => handleRemoveItem(idx)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div>
                        <input
                          type="url"
                          className="form-input"
                          placeholder="Link de referência / fornecedor (URL opcional)"
                          value={item.referenceLink}
                          onChange={e => handleItemChange(idx, 'referenceLink', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 12px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Valor Total Estimado:</span>
                    <span className="mono" style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>
                      {formatCurrency(totalEstimated)}
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Finalidade da Aquisição <span className="required">*</span>
                  </label>
                  <textarea
                    className="form-textarea"
                    placeholder="Para qual subsistema, mecanismo ou atividade esse material será empregado?"
                    value={formData.purpose}
                    onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Justificativa da Necessidade <span className="required">*</span>
                  </label>
                  <textarea
                    className="form-textarea"
                    placeholder="Por que a equipe não pode reaproveitar materiais existentes? Qual o ganho técnico ou requisito do regulamento?"
                    value={formData.justification}
                    onChange={e => setFormData({ ...formData, justification: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onCloseModal} disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Enviando...' : 'Enviar Solicitação para Análise'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decision Modal (Technical Lead) */}
      {reviewingRequest && (
        <div className="modal-overlay" onClick={() => setReviewingRequest(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <ShieldCheck size={20} color="var(--accent-cyan)" />
                <span>Parecer Técnico & Decisão de Compra</span>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-icon"
                onClick={() => setReviewingRequest(null)}
                style={{ padding: 6 }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div style={{
                background: 'var(--bg-tertiary)',
                padding: 14,
                borderRadius: 'var(--radius-md)',
                marginBottom: 18
              }}>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>{reviewingRequest.title}</div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Equipe: <strong>{reviewingRequest.teamName}</strong> • Solicitado por: {reviewingRequest.createdByName}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Finalidade: {reviewingRequest.purpose}
                </div>
                <div style={{ marginTop: 8, fontSize: '0.85rem' }}>
                  Estimado pela equipe: <strong className="mono" style={{ color: 'var(--accent-cyan)' }}>{formatCurrency(reviewingRequest.estimatedTotal)}</strong>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Decisão da Responsável Técnica</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  <button
                    type="button"
                    className={`btn ${decisionAction === 'aprovada' ? 'btn-success' : 'btn-outline'}`}
                    onClick={() => setDecisionAction('aprovada')}
                  >
                    <CheckCircle2 size={16} /> Aprovar Compra
                  </button>
                  <button
                    type="button"
                    className={`btn ${decisionAction === 'ajuste_solicitado' ? 'btn-warning' : 'btn-outline'}`}
                    onClick={() => setDecisionAction('ajuste_solicitado')}
                  >
                    <AlertCircle size={16} /> Solicitar Ajustes
                  </button>
                  <button
                    type="button"
                    className={`btn ${decisionAction === 'em_analise' ? 'btn-secondary' : 'btn-outline'}`}
                    onClick={() => setDecisionAction('em_analise')}
                  >
                    <PlayCircle size={16} /> Em Análise Detalhada
                  </button>
                  <button
                    type="button"
                    className={`btn ${decisionAction === 'rejeitada' ? 'btn-danger' : 'btn-outline'}`}
                    onClick={() => setDecisionAction('rejeitada')}
                  >
                    <XCircle size={16} /> Rejeitar Compra
                  </button>
                </div>
              </div>

              {decisionAction === 'aprovada' && (
                <div className="form-group">
                  <label className="form-label">
                    Valor Aprovado para Aquisição (R$) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input mono"
                    value={approvedAmount}
                    onChange={e => setApprovedAmount(e.target.value)}
                    required
                  />
                  <div className="form-hint">
                    Atenção: A aprovação autoriza o orçamento e passa a solicitação para "Compra em Andamento". O saldo da equipe <strong>NÃO</strong> é deduzido agora — o débito só ocorre na Conclusão da Compra com NF.
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  Parecer Técnico / Justificativa {['rejeitada', 'ajuste_solicitado'].includes(decisionAction) && <span className="required">*</span>}
                </label>
                <textarea
                  className="form-textarea"
                  placeholder={
                    decisionAction === 'aprovada'
                      ? 'Descreva orientações para a cotação, distribuidores autorizados ou prazos...'
                      : decisionAction === 'ajuste_solicitado'
                      ? 'Indique quais correções a equipe precisa fazer antes de reavaliar (ex: orçamentos comparativos, rever quantidades)...'
                      : decisionAction === 'rejeitada'
                      ? 'Justifique de forma clara o indeferimento técnico desta aquisição...'
                      : 'Observações de análise...'
                  }
                  value={decisionNotes}
                  onChange={e => setDecisionNotes(e.target.value)}
                  required={['rejeitada', 'ajuste_solicitado'].includes(decisionAction)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setReviewingRequest(null)} disabled={deciding}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSubmitDecision} disabled={deciding}>
                {deciding ? 'Gravando...' : 'Confirmar Decisão Técnica'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Purchase Modal */}
      {completingRequest && (
        <div className="modal-overlay" onClick={() => setCompletingRequest(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <FileCheck2 size={20} color="var(--accent-emerald)" />
                <span>Concluir Compra & Lançar Despesa</span>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-icon"
                onClick={() => setCompletingRequest(null)}
                style={{ padding: 6 }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div style={{
                background: 'var(--bg-tertiary)',
                padding: 14,
                borderRadius: 'var(--radius-md)',
                marginBottom: 18
              }}>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>{completingRequest.title}</div>

                <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.85rem' }}>
                  <span>Estimado: <strong className="mono">{formatCurrency(completingRequest.estimatedTotal)}</strong></span>
                  <span>Aprovado: <strong className="mono" style={{ color: 'var(--accent-cyan)' }}>{formatCurrency(completingRequest.approvedAmount || completingRequest.estimatedTotal)}</strong></span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Valor Efetivamente Pago (R$) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input mono"
                    value={completeForm.finalActualAmount}
                    onChange={e => setCompleteForm({ ...completeForm, finalActualAmount: e.target.value })}
                    required
                  />
                  <div className="form-hint">
                    Este valor real será debitado do saldo da equipe a partir deste momento.
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Fornecedor / Loja <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: RoboCore, AndyMark, REV Robotics"
                    value={completeForm.supplier}
                    onChange={e => setCompleteForm({ ...completeForm, supplier: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Upload de Nota Fiscal */}
              <div className="form-group">
                <label className="form-label">Nota Fiscal (NF-e) / Comprovante de Pagamento</label>
                <div style={{
                  border: '2px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                  textAlign: 'center',
                  background: 'var(--bg-secondary)'
                }}>
                  <UploadCloud size={32} color="var(--accent-emerald)" style={{ marginBottom: 6 }} />
                  <div style={{ fontSize: '0.85rem', marginBottom: 8 }}>
                    {completeForm.finalReceiptFileName ? (
                      <span style={{ color: 'var(--accent-emerald)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle2 size={16} /> {completeForm.finalReceiptFileName}
                      </span>
                    ) : (
                      <span>Clique para anexar a NF ou recibo de pagamento (PDF, PNG ou JPG)</span>
                    )}
                  </div>
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                    {uploadingReceipt ? 'Enviando...' : completeForm.finalReceiptFileName ? 'Alterar Arquivo' : 'Escolher Arquivo'}
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      style={{ display: 'none' }}
                      onChange={handleCompleteFileUpload}
                      disabled={uploadingReceipt}
                    />
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Observações da Compra (Opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: NF nº 5491 - Entrega prevista em 3 dias úteis"
                  value={completeForm.notes}
                  onChange={e => setCompleteForm({ ...completeForm, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setCompletingRequest(null)} disabled={completing}>
                Cancelar
              </button>
              <button type="button" className="btn btn-success" onClick={handleSubmitComplete} disabled={completing || uploadingReceipt}>
                {completing ? 'Concluindo...' : 'Concluir Compra & Debitar Saldo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Viewer */}
      <ReceiptViewerModal
        isOpen={selectedReceipt.isOpen}
        onClose={() => setSelectedReceipt({ ...selectedReceipt, isOpen: false })}
        title={selectedReceipt.title}
        receiptUrl={selectedReceipt.receiptUrl}
        fileName={selectedReceipt.fileName}
        amount={selectedReceipt.amount}
      />
    </div>
  )
}
