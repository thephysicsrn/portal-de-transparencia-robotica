import React, { useState, useEffect } from 'react'
import {
  HandCoins,
  PlusCircle,
  Search,
  FileText,
  Calendar,
  CheckCircle,
  Trash2,
  UploadCloud
} from 'lucide-react'
import type { Sponsorship, Team } from '../types'
import { api } from '../services/api'

import { formatCurrency, formatDate } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { ReceiptViewerModal } from './ReceiptViewerModal'

interface SponsorshipsViewProps {
  teams: Team[]
  isModalOpen: boolean
  onCloseModal: () => void
  onOpenModal: () => void
  refreshTrigger: number
  onDataChanged: () => void
}

export const SponsorshipsView: React.FC<SponsorshipsViewProps> = ({
  teams,
  isModalOpen,
  onCloseModal,
  onOpenModal,
  refreshTrigger,
  onDataChanged
}) => {
  const { user, selectedTeamId, isTechnicalLead } = useAuth()
  const { showToast } = useToast()

  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReceipt, setSelectedReceipt] = useState<{
    isOpen: boolean
    title: string
    receiptUrl?: string | null
    fileName?: string | null
    amount?: number
    date?: string
    counterpart?: string
  }>({ isOpen: false, title: '' })

  // New Sponsorship Form State
  const [formData, setFormData] = useState({
    sponsorName: '',
    teamId: user?.teamId || (teams[0]?.id || ''),
    amount: '',
    receiptDate: new Date().toISOString().slice(0, 10),
    purpose: '',
    notes: '',
    receiptUrl: '',
    receiptFileName: ''
  })
  const [uploadingFile, setUploadingFile] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchSponsorships = async () => {
    try {
      setLoading(true)
      const data = await api.getSponsorships(selectedTeamId)
      setSponsorships(data)
    } catch (err: any) {
      showToast(err.message || 'Erro ao carregar patrocínios.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSponsorships()
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
      showToast('Comprovante anexado com sucesso!', 'success')
    } catch (err: any) {
      showToast(err.message || 'Erro ao fazer upload do comprovante.', 'error')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = parseFloat(formData.amount.replace(',', '.'))
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Informe um valor de patrocínio positivo e válido.', 'error')
      return
    }

    if (!formData.sponsorName.trim() || !formData.purpose.trim() || !formData.receiptDate) {
      showToast('Preencha os campos obrigatórios (Patrocinador, Data e Finalidade).', 'error')
      return
    }

    try {
      setSubmitting(true)
      await api.createSponsorship({
        ...formData,
        amount: parsedAmount
      })
      showToast('Patrocínio registrado com sucesso!', 'success')
      onCloseModal()
      setFormData({
        sponsorName: '',
        teamId: user?.teamId || (teams[0]?.id || ''),
        amount: '',
        receiptDate: new Date().toISOString().slice(0, 10),
        purpose: '',
        notes: '',
        receiptUrl: '',
        receiptFileName: ''
      })
      onDataChanged()
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar patrocínio.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o registro do patrocínio "${name}"? Esta ação será registrada no histórico de auditoria.`)) {
      return
    }

    try {
      await api.deleteSponsorship(id)
      showToast('Patrocínio excluído com sucesso.', 'success')
      onDataChanged()
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir patrocínio.', 'error')
    }
  }

  const filtered = sponsorships.filter(s => {
    const term = searchTerm.toLowerCase()
    return (
      s.sponsorName.toLowerCase().includes(term) ||
      s.purpose.toLowerCase().includes(term) ||
      (s.teamName && s.teamName.toLowerCase().includes(term))
    )
  })

  const totalFiltered = filtered.reduce((acc, curr) => acc + curr.amount, 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <HandCoins size={28} color="var(--accent-emerald)" />
            Patrocínios & Entradas de Recursos
          </h1>
          <p>
            Registro formal e prestação de contas de investimentos, doações e termos de patrocínio recebidos pelas equipes.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenModal}>
          <PlusCircle size={16} /> Novo Patrocínio
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por patrocinador, finalidade ou equipe..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Exibindo <strong>{filtered.length}</strong> registro(s)
          </span>
          <span className="mono" style={{ fontWeight: 700, color: 'var(--accent-emerald)', fontSize: '1.05rem' }}>
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
              <th>Patrocinador</th>
              <th>Equipe Beneficiada</th>
              <th>Finalidade / Aplicação</th>
              <th style={{ textAlign: 'right' }}>Valor Recebido</th>
              <th style={{ textAlign: 'center' }}>Comprovante</th>
              <th>Registrado Por</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 36 }}>
                  Carregando patrocínios...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <HandCoins size={44} className="empty-icon" />
                    <div className="empty-title">Nenhum patrocínio encontrado</div>
                    <p>Clique no botão "Novo Patrocínio" para cadastrar um recebimento.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(item => (
                <tr key={item.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={14} color="var(--text-dim)" />
                      <span>{formatDate(item.receiptDate)}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.sponsorName}</div>

                    {item.notes && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Obs: {item.notes}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)' }}>
                      {item.teamName || 'Equipe'}
                    </span>
                  </td>
                  <td style={{ maxWidth: 300 }}>
                    <div style={{ color: 'var(--text-muted)' }}>{item.purpose}</div>
                  </td>
                  <td style={{ textAlign: 'right' }} className="mono">
                    <span style={{ fontWeight: 700, color: 'var(--accent-emerald)', fontSize: '0.95rem' }}>
                      {formatCurrency(item.amount)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {item.receiptUrl ? (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() =>
                          setSelectedReceipt({
                            isOpen: true,
                            title: `Comprovante: ${item.sponsorName}`,
                            receiptUrl: item.receiptUrl,
                            fileName: item.receiptFileName,
                            amount: item.amount,
                            date: formatDate(item.receiptDate),
                            counterpart: item.sponsorName
                          })
                        }
                      >
                        <FileText size={14} /> Ver Comprovante
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
                      title="Excluir patrocínio"
                      onClick={() => handleDelete(item.id, item.sponsorName)}
                      style={{ color: 'var(--accent-rose)' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Sponsorship Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={onCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <div className="modal-title">
                  <HandCoins size={20} color="var(--accent-emerald)" />
                  <span>Registrar Novo Patrocínio</span>
                </div>
                <button type="button" className="btn btn-outline btn-icon" onClick={onCloseModal} style={{ padding: 6 }}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                {isTechnicalLead && (
                  <div className="form-group">
                    <label className="form-label">
                      Equipe Beneficiada <span className="required">*</span>
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

                <div className="form-group">
                  <label className="form-label">
                    Nome do Patrocinador / Doador <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Petrobras, InovaTech Soluções, Associação de Pais"
                    value={formData.sponsorName}
                    onChange={e => setFormData({ ...formData, sponsorName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Valor Recebido (R$) <span className="required">*</span>
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
                      Data do Recebimento <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.receiptDate}
                      onChange={e => setFormData({ ...formData, receiptDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Finalidade / Destinação dos Recursos <span className="required">*</span>
                  </label>
                  <textarea
                    className="form-textarea"
                    placeholder="Ex: Compra de matéria-prima para usinagem, kits de eletrônica, custeio de viagem para etapa regional..."
                    value={formData.purpose}
                    onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Observações Adicionais (Opcional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Contrato de patrocínio nº 2026/04 com vigência de 1 ano"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                {/* Upload de comprovante */}
                <div className="form-group">
                  <label className="form-label">Comprovante de Entrada / TED / PIX</label>
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
                        <span>Clique para selecionar o comprovante (PDF, PNG ou JPG)</span>
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
                <button type="submit" className="btn btn-success" disabled={submitting || uploadingFile}>
                  {submitting ? 'Salvando...' : 'Salvar Patrocínio'}
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
