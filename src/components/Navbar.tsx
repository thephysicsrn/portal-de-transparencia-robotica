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
  GraduationCap,
  Building,
  UserCog
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
  const { user, logout, selectedTeamId, setSelectedTeamId, teams, hasGlobalAccess, isCoach, isStudent } = useAuth()
  const { showToast } = useToast()

  const handleResetDemo = async () => {
    if (!confirm('Deseja reinicializar a base de dados mantendo o estado limpo?')) return
    try {
      await api.resetDemoData()
      showToast('Base de dados limpa com sucesso!', 'success')
      onDataRefreshNeeded()
    } catch (err: any) {
      showToast(err.message || 'Erro ao reinicializar dados.', 'error')
    }
  }

  const navItems = [
    {
      id: 'dashboard',
      label: isStudent ? 'Painel do Aluno' : isCoach ? 'Painel do Técnico' : 'Painel de Supervisão',
      icon: LayoutDashboard
    },
    {
      id: 'purchases',
      label: isStudent ? 'Solicitar Compras' : isCoach ? 'Aprovação de Compras' : 'Acompanhamento de Compras',
      icon: ShoppingCart
    },
    { id: 'accountability', label: 'Prestação de Contas', icon: FileSpreadsheet },
    { id: 'sponsorships', label: isStudent ? 'Patrocínios (Transparência)' : 'Patrocínios', icon: HandCoins },
    ...(isStudent ? [] : [{ id: 'expenses', label: 'Despesas', icon: Receipt }]),
    ...(isStudent ? [] : [{ id: 'audit', label: 'Histórico & Auditoria', icon: History }]),
    ...(hasGlobalAccess ? [
      { id: 'teams', label: 'Equipes', icon: Users },
      { id: 'adminUsers', label: 'Usuários', icon: UserCog }
    ] : [])
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
            {hasGlobalAccess ? (
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
                  {hasGlobalAccess ? (
                    <span style={{ color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <ShieldCheck size={12} /> Responsável Técnica (Supervisão Geral)
                    </span>
                  ) : isCoach ? (
                    <span style={{ color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <UserCheck size={12} /> Técnico da Equipe
                    </span>
                  ) : (
                    <span style={{ color: 'var(--accent-indigo)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <GraduationCap size={12} /> Aluno da Equipe
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Quick Demo Reset for Admin */}
            {hasGlobalAccess && (
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
