import React from 'react'
import {
  Cpu,
  LayoutDashboard,
  HandCoins,
  Receipt,
  ShoppingCart,
  FileSpreadsheet,
  History,
  Users,
  LogOut,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  Building
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { api } from '../services/api'

interface NavbarProps {
  currentTab: string
  setCurrentTab: (tab: string) => void
  onDataRefreshNeeded: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onDataRefreshNeeded }) => {
  const { user, logout, selectedTeamId, setSelectedTeamId, teams, isTechnicalLead } = useAuth()
  const { showToast } = useToast()

  const handleResetDemo = async () => {
    if (!confirm('Deseja restaurar os dados de demonstração iniciais do sistema?')) return
    try {
      await api.resetDemoData()
      showToast('Dados de demonstração restaurados com sucesso!', 'success')
      onDataRefreshNeeded()
    } catch (err: any) {
      showToast(err.message || 'Erro ao restaurar dados.', 'error')
    }
  }

  const navItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'sponsorships', label: 'Patrocínios', icon: HandCoins },
    { id: 'expenses', label: 'Despesas', icon: Receipt },
    { id: 'purchases', label: 'Solicitações de Compra', icon: ShoppingCart },
    { id: 'accountability', label: 'Prestação de Contas', icon: FileSpreadsheet },
    { id: 'audit', label: 'Histórico & Auditoria', icon: History },
    ...(isTechnicalLead ? [{ id: 'teams', label: 'Equipes', icon: Users }] : [])
  ]

  return (
    <header className="navbar">
      {/* Tier 1: Main Header (Brand + Team Selector + User Profile) */}
      <div className="navbar-top">
        <div className="navbar-top-container">
          {/* Brand */}
          <div className="brand-wrapper" onClick={() => setCurrentTab('dashboard')}>
            <img
              src="/logo-sesi.png"
              alt="SESI - Serviço Social da Indústria"
              className="brand-logo-img"
            />
            <div className="brand-divider" />
            <div>
              <div className="brand-title">Portal de Transparência</div>
              <div className="brand-subtitle">Robótica Competitiva</div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="navbar-controls">
            {/* Team Scope Selector for Technical Lead */}
            {isTechnicalLead ? (
              <div className="team-filter-pill">
                <Building size={15} color="var(--primary)" />
                <span className="team-filter-label">Equipe:</span>
                <select
                  className="team-filter-select"
                  value={selectedTeamId}
                  onChange={e => {
                    setSelectedTeamId(e.target.value)
                    onDataRefreshNeeded()
                  }}
                >
                  <option value="all">Todas as Equipes (Visão Consolidada)</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              user?.team && (
                <div className="team-badge-pill">
                  <Cpu size={14} />
                  <span>{user.team.name}</span>
                </div>
              )
            )}

            {/* User Profile Info */}
            <div className="user-profile-card">
              <div className="user-avatar-circle">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className="user-role-tag">
                  {isTechnicalLead ? (
                    <span style={{ color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <ShieldCheck size={12} /> Responsável Técnica
                    </span>
                  ) : (
                    <span style={{ color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <UserCheck size={12} /> Representante de Equipe
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Quick Demo Reset for Admin */}
            {isTechnicalLead && (
              <button
                className="btn btn-secondary btn-icon btn-sm"
                title="Restaurar dados de teste demonstrativos"
                onClick={handleResetDemo}
                aria-label="Restaurar dados de teste"
              >
                <RotateCcw size={15} />
              </button>
            )}

            {/* Logout */}
            <button
              className="btn btn-secondary btn-icon btn-sm"
              onClick={logout}
              title="Sair do sistema"
              aria-label="Sair"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Tier 2: Dedicated Navigation Tabs Bar */}
      <div className="navbar-bottom">
        <div className="navbar-bottom-container">
          <nav className="nav-links">
            {navItems.map(item => {
              const Icon = item.icon
              const isActive = currentTab === item.id
              return (
                <button
                  key={item.id}
                  className={`nav-link-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setCurrentTab(item.id)}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
