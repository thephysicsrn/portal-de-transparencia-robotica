import React, { useState, useEffect } from 'react'
import {
  Receipt,
  PlusCircle,
  Search,
  FileText,
  Calendar,
  Trash2,
  UploadCloud,
  CheckCircle,
  Tag,
  Link as LinkIcon
} from 'lucide-react'
import type { Expense, Team } from '../types'
import { api } from '../services/api'

import { formatCurrency, formatDate, EXPENSE_CATEGORIES, getCategoryBadgeColor } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { ReceiptViewerModal } from './ReceiptViewerModal'

interface ExpensesViewProps {
  teams: Team[]
  isModalOpen: boolean
  onCloseModal: () => void
  onOpenModal: () => void
  refreshTrigger: number
  onDataChanged: () => void
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  teams,
  isModalOpen,
  onCloseModal,
  onOpenModal,
  refreshTrigger,
  onDataChanged
}) => {
  const { user, selectedTeamId, isTechnicalLead } = useAuth()
  const { showToast } = useToast()

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const [selectedReceipt, setSelectedReceipt] = useState<{
    isOpen: boolean
    title: string
    receiptUrl?: string | null
    fileName?: string | null
    amount?: number
    date?: string
    counterpart?: string
  }>({ isOpen: false, title: '' })

  // New Expense Form State
  const [formData, setFormData] = useState({
    category: 'Peças e Componentes' as any,
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().slice(0, 10),
    supplier: '',
    teamId: user?.teamId || (teams[0]?.id || ''),
    receiptUrl: '',
    receiptFileName: ''
  })
  const [uploadingFile, setUploadingFile] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const data = await api.getExpenses(selectedTeamId)
      setExpenses(data)
    } catch (err: any) {
      showToast(err.message || 'Erro ao carregar despesas.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [selectedTeamId, refreshTrigger])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingFile(true)
      const result = await api.uploadFile(file)
      setFormData(prev => ({
        ...prev,
        receiptUrl: result.fileUrl,
        receiptFileName: result.originalName
      }))
      showToast('Nota fiscal / comprovante anexado!', 'success')
    } catch (err: any) {
      showToast(err.message || 'Erro no envio do comprovante.', 'error')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = parseFloat(formData.amount.replace(',', '.'))
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Informe um valor de despesa positivo e válido.', 'error')
      return
    }

    if (!formData.description.trim() || !formData.supplier.trim() || !formData.expenseDate) {
      showToast('Preencha os campos obrigatórios (Descrição, Fornecedor e Data).', 'error')
      return
    }

    try {
      setSubmitting(true)
      await api.createExpense({
        ...formData,
        amount: parsedAmount
      })
      showToast('Despesa lançada com sucesso no extrato!', 'success')
      onCloseModal()
      setFormData({
        category: 'Peças e Componentes',
        description: '',
        amount: '',
        expenseDate: new Date().toISOString().slice(0, 10),
        supplier: '',
        teamId: user?.teamId || (teams[0]?.id || ''),
        receiptUrl: '',
        receiptFileName: ''
      })
      onDataChanged()
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar despesa.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, description: string) => {
    if (!confirm(`Tem certeza que deseja excluir o lançamento da despesa "${description}"? Esta ação será registrada no histórico de auditoria.`)) {
      return
    }

    try {
      await api.deleteExpense(id)
      showToast('Despesa excluída com sucesso.', 'success')
      onDataChanged()
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir despesa.', 'error')
    }
  }

  const filtered = expenses.filter(e => {
    const term = searchTerm.toLowerCase()
    const matchesSearch = (
      e.description.toLowerCase().includes(term) ||
      e.supplier.toLowerCase().includes(term) ||
      (e.teamName && e.teamName.toLowerCase().includes(term))
    )
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const totalFiltered = filtered.reduce((acc, curr) => acc + curr.amount, 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Receipt size={28} color="var(--accent-rose)" />
            Despesas & Saídas Realizadas
          </h1>
          <p>
            Lançamento e prestação de contas de pagamentos efetivamente efetuados, comprovados com notas fiscais e cupons.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenModal}>
          <PlusCircle size={16} /> Lançar Despesa
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por descrição, fornecedor ou equipe..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag size={16} color="var(--text-dim)" />
          <select
            className="form-select"
            style={{ width: 'auto', padding: '8px 12px' }}
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="all">Todas as Categorias</option>
            {EXPENSE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Exibindo <strong>{filtered.length}</strong> registro(s)
          </span>
          <span className="mono" style={{ fontWeight: 700, color: 'var(--accent-rose)', fontSize: '1.05rem' }}>
            Total: {formatCurrency(totalFiltered)}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição da Despesa</th>
              <th>Categoria</th>
              <th>Fornecedor</th>
              <th>Equipe</th>
              <th style={{ textAlign: 'right' }}>Valor Pago</th>
              <th style={{ textAlign: 'center' }}>Origem</th>
              <th style={{ textAlign: 'center' }}>Comprovante / NF</th>
              <th>Lançado Por</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: 36 }}>
                  Carregando despesas...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  <div className="empty-state">
                    <Receipt size={44} className="empty-icon" />
                    <div className="empty-title">Nenhuma despesa encontrada</div>
                    <p>Clique em "Lançar Despesa" para registrar uma nova saída.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(item => {
                const catColor = getCategoryBadgeColor(item.category)
                return (
                  <tr key={item.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={14} color="var(--text-dim)" />
                        <span>{formatDate(item.expenseDate)}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.description}</div>

                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: `${catColor}20`,
                          color: catColor,
                          border: `1px solid ${catColor}40`
                        }}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-muted)' }}>{item.supplier}</span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)' }}>
                        {item.teamName || 'Equipe'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="mono">
                      <span style={{ fontWeight: 700, color: 'var(--accent-rose)', fontSize: '0.95rem' }}>
                        {formatCurrency(item.amount)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {item.purchaseRequestId ? (
                        <span
                          className="badge"
                          style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontSize: '0.7rem' }}
                          title="Despesa originada de uma Solicitação de Compra aprovada e concluída"
                        >
                          <LinkIcon size={11} /> Compra Concluída
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Lançamento Direto</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {item.receiptUrl ? (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() =>
                            setSelectedReceipt({
                              isOpen: true,
                              title: `Nota Fiscal / Recibo: ${item.description}`,
                              receiptUrl: item.receiptUrl,
                              fileName: item.receiptFileName,
                              amount: item.amount,
                              date: formatDate(item.expenseDate),
                              counterpart: item.supplier
                            })
                          }
                        >
                          <FileText size={14} /> Ver NF/Recibo
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Sem anexo</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {item.createdByName}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-outline btn-icon btn-sm"
                        title="Excluir despesa"
                        onClick={() => handleDelete(item.id, item.description)}
                        style={{ color: 'var(--accent-rose)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* New Expense Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={onCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <div className="modal-title">
                  <Receipt size={20} color="var(--accent-rose)" />
                  <span>Lançar Nova Despesa Realizada</span>
                </div>
                <button type="button" className="btn btn-outline btn-icon" onClick={onCloseModal} style={{ padding: 6 }}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                {isTechnicalLead && (
                  <div className="form-group">
                    <label className="form-label">
                      Equipe Correspondente <span className="required">*</span>
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
                  <div className="form-group">
                    <label className="form-label">
                      Categoria da Despesa <span className="required">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                      required
                    >
                      {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Fornecedor / Estabelecimento <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: RoboCore, Loja das Fresas, Hotel Central"
                      value={formData.supplier}
                      onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Descrição Detalhada do Gasto <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Aquisição de 4x engrenagens cônicas 20 dentes e parafusos Allen M4"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
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
                      placeholder="0,00"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Data da Despesa / Pagamento <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.expenseDate}
                      onChange={e => setFormData({ ...formData, expenseDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Upload de Nota Fiscal */}
                <div className="form-group">
                  <label className="form-label">Nota Fiscal (NF-e/NFC-e) ou Comprovante</label>
                  <div style={{
                    border: '2px dashed var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                    textAlign: 'center',
                    background: 'var(--bg-secondary)'
                  }}>
                    <UploadCloud size={32} color="var(--accent-cyan)" style={{ marginBottom: 6 }} />
                    <div style={{ fontSize: '0.85rem', marginBottom: 8 }}>
                      {formData.receiptFileName ? (
                        <span style={{ color: 'var(--accent-emerald)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle size={16} /> {formData.receiptFileName}
                        </span>
                      ) : (
                        <span>Clique para selecionar a Nota Fiscal / Recibo (PDF, PNG ou JPG)</span>
                      )}
                    </div>
                    <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                      {uploadingFile ? 'Enviando...' : formData.receiptFileName ? 'Alterar Arquivo' : 'Escolher Arquivo'}
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp"
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onCloseModal} disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-danger" disabled={submitting || uploadingFile}>
                  {submitting ? 'Lançando...' : 'Lançar Despesa no Extrato'}
                </button>
              </div>
            </form>
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
        date={selectedReceipt.date}
        counterpart={selectedReceipt.counterpart}
      />
    </div>
  )
}
