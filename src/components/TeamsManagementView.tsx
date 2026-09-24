import React, { useState } from 'react'
import {
  Users,
  PlusCircle,
  Building,
  CreditCard,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react'
import type { Team } from '../types'
import { api } from '../services/api'

import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'

interface TeamsManagementViewProps {
  teams: Team[]
  onTeamCreated: () => void
  onNavigateTab?: (tab: string, filterParams?: any) => void
}

export const TeamsManagementView: React.FC<TeamsManagementViewProps> = ({
  teams,
  onTeamCreated,
  onNavigateTab
}) => {
  const { isTechnicalLead } = useAuth()
  const { showToast } = useToast()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'FRC - FIRST Robotics Competition',
    institution: '',
    description: '',
    bankAccount: '',
    leaderName: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.code.trim() || !formData.category) {
      showToast('Nome, código e modalidade da equipe são obrigatórios.', 'error')
      return
    }

    try {
      setSubmitting(true)
      await api.createTeam(formData)
      showToast(`Equipe "${formData.name}" cadastrada com sucesso!`, 'success')
      setIsModalOpen(false)
      setFormData({
        name: '',
        code: '',
        category: 'FRC - FIRST Robotics Competition',
        institution: '',
        description: '',
        bankAccount: '',
        leaderName: ''
      })
      onTeamCreated()
    } catch (err: any) {
      showToast(err.message || 'Erro ao cadastrar equipe.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Users size={28} color="var(--accent-cyan)" />
            Equipes de Robótica Cadastradas
          </h1>
          <p>
            Gestão de equipes participantes, categorias competitivas, responsáveis técnicos e contas bancárias oficiais.
          </p>
        </div>

        {isTechnicalLead && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <PlusCircle size={16} /> Cadastrar Nova Equipe
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {teams.map(team => (
          <div key={team.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
                  {team.code}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {team.category}
                </span>
              </div>

              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: 8 }}>
                {team.name}
              </h2>


              <p style={{ fontSize: '0.85rem', marginBottom: 16 }}>
                {team.description || 'Equipe participante do programa de robótica competitiva.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {team.institution && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Building size={15} color="var(--accent-cyan)" />
                    <span>{team.institution}</span>
                  </div>
                )}
                {team.leaderName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={15} color="var(--accent-emerald)" />
                    <span>Líder: <strong>{team.leaderName}</strong></span>
                  </div>
                )}
                {team.bankAccount && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CreditCard size={15} color="var(--accent-amber)" />
                    <span className="mono" style={{ fontSize: '0.775rem' }}>{team.bankAccount}</span>
                  </div>
                )}
              </div>

              {onNavigateTab && (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    onClick={() => onNavigateTab('accountability', { teamId: team.id })}
                  >
                    <FileSpreadsheet size={15} color="var(--primary)" />
                    <span>Ver Extrato Financeiro</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Team Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <div className="modal-title">
                  <Users size={20} color="var(--accent-cyan)" />
                  <span>Cadastrar Nova Equipe de Robótica</span>
                </div>
                <button type="button" className="btn btn-outline btn-icon" onClick={() => setIsModalOpen(false)} style={{ padding: 6 }}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">
                      Nome da Equipe <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Vortex Robotics 9050"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Código / ID Curto <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input mono"
                      placeholder="Ex: VORTEX-9050"
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Modalidade / Torneio <span className="required">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="FRC - FIRST Robotics Competition">FRC - FIRST Robotics Competition</option>
                    <option value="FTC - FIRST Tech Challenge">FTC - FIRST Tech Challenge</option>
                    <option value="FLL - FIRST Lego League">FLL - FIRST Lego League</option>
                    <option value="Combate e Autônomos (RoboCore)">Combate e Autônomos (RoboCore)</option>
                    <option value="Obr - Olimpíada Brasileira de Robótica">OBR - Olimpíada Brasileira de Robótica</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Instituição / Escola Parceira</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: SESI SENAI Escola de Tecnologia"
                      value={formData.institution}
                      onChange={e => setFormData({ ...formData, institution: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Líder / Capitão da Equipe</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Prof. Roberto Mendes"
                      value={formData.leaderName}
                      onChange={e => setFormData({ ...formData, leaderName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Dados Bancários / Chave PIX Oficial</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Banco do Brasil Ag: 1234 CC: 5678-9 (PIX: financeiro@vortex.org)"
                    value={formData.bankAccount}
                    onChange={e => setFormData({ ...formData, bankAccount: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição dos Projetos da Equipe</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Breve resumo da equipe e dos objetivos de temporada..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Cadastrando...' : 'Cadastrar Equipe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
