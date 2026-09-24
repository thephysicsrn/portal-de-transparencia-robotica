import React from 'react'
import { FileText, Download, ExternalLink, X, ShieldCheck } from 'lucide-react'

interface ReceiptViewerModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  receiptUrl?: string | null
  fileName?: string | null
  amount?: number
  date?: string
  counterpart?: string
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  receiptUrl,
  fileName,
  amount,
  date,
  counterpart
}) => {
  if (!isOpen) return null

  const isImage = receiptUrl && /\.(jpg|jpeg|png|webp|gif)$/i.test(receiptUrl)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <div className="modal-title">
            <FileText size={20} color="var(--accent-cyan)" />
            <span>Comprovante Financeiro</span>
          </div>
          <button
            className="btn btn-outline btn-icon"
            onClick={onClose}
            aria-label="Fechar"
            style={{ padding: 6 }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <ShieldCheck size={28} color="var(--primary)" />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.925rem' }}>{title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {counterpart && <span>Contraparte: {counterpart} • </span>}
                {date && <span>Data: {date}</span>}
              </div>
            </div>
          </div>

          {receiptUrl ? (
            <div>
              {isImage ? (
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <img
                    src={receiptUrl}
                    alt="Comprovante"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '360px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  />
                </div>
              ) : (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 24,
                  textAlign: 'center',
                  marginBottom: 16
                }}>
                  <FileText size={48} color="var(--primary)" style={{ marginBottom: 12 }} />
                  <h4 style={{ color: 'var(--text-main)', marginBottom: 4 }}>{fileName || 'Documento Comprobatório Oficial'}</h4>
                  <p style={{ fontSize: '0.8125rem', marginBottom: 16 }}>
                    Formato PDF / Documento Digital Certificado
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                    <a
                      href={receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                    >
                      <ExternalLink size={15} /> Abrir em Nova Aba
                    </a>
                    <a
                      href={receiptUrl}
                      download={fileName || 'comprovante.pdf'}
                      className="btn btn-secondary btn-sm"
                    >
                      <Download size={15} /> Baixar Arquivo
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <FileText size={40} className="empty-icon" />
              <p>Nenhum comprovante anexado a este registro.</p>
            </div>
          )}

          {amount !== undefined && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Valor Registrado:</span>
              <span className="mono" style={{ fontWeight: 700, color: 'var(--accent-emerald)', fontSize: '1.05rem' }}>
                {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
