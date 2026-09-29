import React, { useState, useEffect, useCallback } from 'react'
import {
  ShieldCheck,
  Users,
  UsersRound,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Eye,
  EyeOff,
  LogOut,
  GraduationCap,
  UserCheck,
  Crown,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Link2,
  Building2,
  Search,
  CheckCircle,
  XCircle,
  LayoutDashboard
} from 'lucide-react'
import { adminApi } from '../services/adminApi'

// ── Types ──────────────────────────────────────────────────────────────────────

type AdminRole = 'system_admin' | 'technical_lead' | 'team_coach' | 'team_rep' | 'student'

interface AdminTeam {
  id: string
  name: string
  code: string
  category: string
  institution: string
  description: string
  bankAccount: string
  leaderName: string
  createdAt: string
  financialData?: {
    sponsorshipsCount: number
    expensesCount: number
    purchaseRequestsCount: number
    hasFinancialData: boolean
  }
}

interface AdminUser {
  id: string
  name: string
  email: string
  role: AdminRole
  teamId: string | null
  title?: string
  createdAt: string
  team?: AdminTeam | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function roleLabel(role: AdminRole) {
  if (role === 'system_admin') return 'Administrador de TI'
  if (role === 'technical_lead') return 'Responsável Técnica'
  if (role === 'team_coach' || role === 'team_rep') return 'Técnico da Equipe'
  return 'Aluno'
}

function roleColor(role: AdminRole) {
  if (role === 'system_admin') return '#a78bfa'
  if (role === 'technical_lead') return '#06b6d4'
  if (role === 'team_coach' || role === 'team_rep') return '#10b981'
  return '#6366f1'
}

function financialDataSummary(fd: AdminTeam['financialData']): string {
  if (!fd || !fd.hasFinancialData) return ''
  const parts: string[] = []
  if (fd.sponsorshipsCount > 0) parts.push(`${fd.sponsorshipsCount} patrocínio${fd.sponsorshipsCount !== 1 ? 's' : ''}`)
  if (fd.expensesCount > 0) parts.push(`${fd.expensesCount} despesa${fd.expensesCount !== 1 ? 's' : ''}`)
  if (fd.purchaseRequestsCount > 0) parts.push(`${fd.purchaseRequestsCount} solicitação${fd.purchaseRequestsCount !== 1 ? 'ões' : ''}`)
  return parts.join(', ')
}

function RoleBadge({ role }: { role: AdminRole }) {
  const colors: Record<AdminRole, { bg: string; text: string; icon: React.ReactNode }> = {
    system_admin: { bg: 'rgba(167,139,250,0.12)', text: '#a78bfa', icon: <ShieldCheck size={12} /> },
    technical_lead: { bg: 'rgba(6,182,212,0.12)', text: '#06b6d4', icon: <Crown size={12} /> },
    team_coach: { bg: 'rgba(16,185,129,0.12)', text: '#10b981', icon: <UserCheck size={12} /> },
    team_rep: { bg: 'rgba(16,185,129,0.12)', text: '#10b981', icon: <UserCheck size={12} /> },
    student: { bg: 'rgba(99,102,241,0.12)', text: '#818cf8', icon: <GraduationCap size={12} /> },
  }
  const c = colors[role] || colors.student
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      background: c.bg, color: c.text,
      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.03em'
    }}>
      {c.icon} {roleLabel(role)}
    </span>
  )
}

// ── Toast ──────────────────────────────────────────────────────────────────────

interface ToastMsg { id: number; msg: string; type: 'success' | 'error' | 'info' }

function useAdminToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const show = useCallback((msg: string, type: ToastMsg['type'] = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])
  return { toasts, show }
}

function ToastContainer({ toasts }: { toasts: ToastMsg[] }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '12px 18px',
          borderRadius: 10,
          background: t.type === 'success' ? 'rgba(16,185,129,0.95)' : t.type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(30,41,59,0.97)',
          color: '#fff',
          fontSize: '0.875rem',
          fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          animation: 'fadeIn 0.2s ease',
          maxWidth: 360,
          backdropFilter: 'blur(12px)'
        }}>
          {t.type === 'success' ? <CheckCircle size={16} /> : t.type === 'error' ? <XCircle size={16} /> : null}
          {t.msg}
        </div>
      ))}
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(2,6,23,0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-secondary, #0f172a)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        width: '100%',
        maxWidth: 560,
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
        animation: 'slideUp 0.2s ease'
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <h3 style={{ color: 'var(--text-main, #f1f5f9)', fontWeight: 700, fontSize: '1.05rem' }}>{title}</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted, #94a3b8)', padding: 4, borderRadius: 6,
            display: 'flex', alignItems: 'center'
          }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Confirm Dialog ─────────────────────────────────────────────────────────────

function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal title="Confirmar Ação" onClose={onCancel}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }}><AlertTriangle size={22} /></div>
          <p style={{ color: 'var(--text-main, #f1f5f9)', lineHeight: 1.6, margin: 0 }}>{message}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '9px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', fontWeight: 600
          }}>Cancelar</button>
          <button onClick={onConfirm} style={{
            padding: '9px 20px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', cursor: 'pointer', fontWeight: 700
          }}>Confirmar</button>
        </div>
      </div>
    </Modal>
  )
}

// ── Form Field ─────────────────────────────────────────────────────────────────

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--text-main, #f1f5f9)',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s'
}

// ── Main Admin Panel ───────────────────────────────────────────────────────────

interface AdminPanelProps {
  adminUser: AdminUser
  onLogout: () => void
}

export function AdminPanel({ adminUser, onLogout, initialTab = 'overview' }: AdminPanelProps & { initialTab?: 'teams' | 'users' | 'overview' }) {
  const { toasts, show: toast } = useAdminToast()
  const [tab, setTab] = useState<'teams' | 'users' | 'overview'>(initialTab)

  const [teams, setTeams] = useState<AdminTeam[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchUser, setSearchUser] = useState('')
  const [searchTeam, setSearchTeam] = useState('')

  // Modals
  const [teamModal, setTeamModal] = useState<{ mode: 'create' | 'edit'; data?: AdminTeam } | null>(null)
  const [userModal, setUserModal] = useState<{ mode: 'create' | 'edit'; data?: AdminUser } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'user' | 'team'; id: string; name: string } | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [teamsData, usersData] = await Promise.all([
        adminApi.getTeams(),
        adminApi.getUsers()
      ])
      setTeams(teamsData)
      setUsers(usersData)
    } catch (err: any) {
      setLoadError(err.message || 'Erro ao carregar dados.')
      toast(err.message || 'Erro ao carregar dados.', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { loadData() }, [loadData])

  // ── Delete Handlers ──
  const handleDeleteUser = async (id: string) => {
    try {
      await adminApi.deleteUser(id)
      toast('Usuário excluído com sucesso.', 'success')
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (err: any) { toast(err.message, 'error') }
  }

  const handleDeleteTeam = async (id: string) => {
    try {
      await adminApi.deleteTeam(id)
      toast('Equipe excluída com sucesso.', 'success')
      setTeams(prev => prev.filter(t => t.id !== id))
      setUsers(prev => prev.map(u => u.teamId === id ? { ...u, teamId: null, team: null } : u))
    } catch (err: any) { toast(err.message, 'error') }
  }

  // ── Derived stats ──
  const totalUsers = users.length
  const totalTechnicians = users.filter(u => u.role === 'team_coach' || u.role === 'team_rep').length
  const totalStudents = users.filter(u => u.role === 'student').length
  const totalSystemAdmins = users.filter(u => u.role === 'system_admin').length
  const unlinkedUsers = users.filter(u => u.role !== 'system_admin' && u.role !== 'technical_lead' && !u.teamId).length

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
    roleLabel(u.role).toLowerCase().includes(searchUser.toLowerCase())
  )

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(searchTeam.toLowerCase()) ||
    t.code.toLowerCase().includes(searchTeam.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTeam.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #020617)', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <ToastContainer toasts={toasts} />

      {/* Confirm Dialog */}
      {confirmDelete && (
        <ConfirmDialog
          message={confirmDelete.type === 'user'
            ? `Tem certeza que deseja excluir o usuário "${confirmDelete.name}"? Esta ação é irreversível.`
            : `Tem certeza que deseja excluir a equipe "${confirmDelete.name}"? Esta ação é irreversível.${users.some(u => u.teamId === confirmDelete.id) ? ' Os usuários vinculados ficarão sem equipe associada.' : ''}`}
          onConfirm={() => {
            if (confirmDelete.type === 'user') handleDeleteUser(confirmDelete.id)
            else handleDeleteTeam(confirmDelete.id)
            setConfirmDelete(null)
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Team Modal */}
      {teamModal && (
        <TeamFormModal
          mode={teamModal.mode}
          data={teamModal.data}
          onClose={() => setTeamModal(null)}
          onSuccess={(team) => {
            if (teamModal.mode === 'create') {
              setTeams(prev => [...prev, {
                ...team,
                financialData: { sponsorshipsCount: 0, expensesCount: 0, purchaseRequestsCount: 0, hasFinancialData: false }
              }])
              toast(`Equipe "${team.name}" criada com sucesso!`, 'success')
            } else {
              setTeams(prev => prev.map(t => t.id === team.id ? { ...t, ...team } : t))
              toast(`Equipe "${team.name}" atualizada!`, 'success')
            }
            setTeamModal(null)
          }}
          toast={toast}
        />
      )}

      {/* User Modal */}
      {userModal && (
        <UserFormModal
          mode={userModal.mode}
          data={userModal.data}
          teams={teams}
          onClose={() => setUserModal(null)}
          onSuccess={(user) => {
            if (userModal.mode === 'create') {
              setUsers(prev => [...prev, user])
              toast(`Usuário "${user.name}" criado com sucesso!`, 'success')
            } else {
              setUsers(prev => prev.map(u => u.id === user.id ? user : u))
              toast(`Usuário "${user.name}" atualizado!`, 'success')
            }
            setUserModal(null)
          }}
          toast={toast}
        />
      )}

      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(15,23,42,0.95)',
        backdropFilter: 'blur(12px)',
        padding: '0 24px',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ShieldCheck size={20} color="#fff" />
            </div>
            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1rem', lineHeight: 1 }}>Painel Administrativo</div>
              <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: 2 }}>Portal de Transparência da Robótica</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#f1f5f9', fontSize: '0.875rem', fontWeight: 600 }}>{adminUser.name}</div>
              <div style={{ color: roleColor(adminUser.role), fontSize: '0.72rem', fontWeight: 600 }}>{roleLabel(adminUser.role)}</div>
            </div>
            <button
              onClick={onLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 14px', borderRadius: 8,
                border: '1px solid rgba(239,68,68,0.2)',
                background: 'rgba(239,68,68,0.06)',
                color: '#f87171', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600
              }}
            >
              <LogOut size={15} />Sair
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0 }}>
          {([
            { key: 'overview', label: 'Visão Geral', icon: <LayoutDashboard size={16} /> },
            { key: 'teams', label: 'Equipes', icon: <UsersRound size={16} /> },
            { key: 'users', label: 'Usuários', icon: <Users size={16} /> },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px',
                border: 'none', borderRadius: '8px 8px 0 0',
                background: tab === t.key ? 'rgba(6,182,212,0.1)' : 'transparent',
                color: tab === t.key ? '#06b6d4' : '#64748b',
                fontWeight: tab === t.key ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                borderBottom: tab === t.key ? '2px solid #06b6d4' : '2px solid transparent',
                transition: 'all 0.15s'
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
          <button
            onClick={loadData}
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)',
              background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: '0.8125rem',
              marginBottom: 2
            }}
          >
            <RefreshCw size={14} /> Atualizar
          </button>
        </div>

        {loadError && (
          <div style={{
            marginBottom: 20, padding: '14px 18px', borderRadius: 10,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#fca5a5', fontSize: '0.85rem', fontWeight: 600
          }}>
            Falha ao carregar os dados do painel: {loadError}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Carregando dados...</div>
        ) : (
          <>
            {/* ── OVERVIEW TAB ── */}
            {tab === 'overview' && (
              <div>
                <h2 style={{ color: '#f1f5f9', fontWeight: 700, marginBottom: 20, fontSize: '1.15rem' }}>Visão Geral do Sistema</h2>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
                  {[
                    { label: 'Equipes', value: teams.length, color: '#06b6d4', icon: <UsersRound size={22} /> },
                    { label: 'Total de Usuários', value: totalUsers, color: '#3b82f6', icon: <Users size={22} /> },
                    { label: 'Técnicos', value: totalTechnicians, color: '#10b981', icon: <UserCheck size={22} /> },
                    { label: 'Alunos', value: totalStudents, color: '#818cf8', icon: <GraduationCap size={22} /> },
                    { label: 'Sem Equipe', value: unlinkedUsers, color: '#f59e0b', icon: <Link2 size={22} /> },
                    { label: 'Admins de TI', value: totalSystemAdmins, color: '#a78bfa', icon: <ShieldCheck size={22} /> },
                  ].map(s => (
                    <div key={s.label} style={{
                      background: 'rgba(15,23,42,0.8)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 12, padding: '20px',
                      display: 'flex', alignItems: 'center', gap: 14
                    }}>
                      <div style={{ color: s.color }}>{s.icon}</div>
                      <div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                        <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 4 }}>{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Teams overview cards */}
                <h3 style={{ color: '#94a3b8', fontWeight: 700, marginBottom: 14, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Equipes e Membros
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {teams.map(team => {
                    const teamUsers = users.filter(u => u.teamId === team.id)
                    const coaches = teamUsers.filter(u => u.role === 'team_coach' || u.role === 'team_rep')
                    const students = teamUsers.filter(u => u.role === 'student')
                    return (
                      <div key={team.id} style={{
                        background: 'rgba(15,23,42,0.7)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 12, padding: '18px 20px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)'
                              }} />
                              <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.95rem' }}>{team.name}</span>
                              <span style={{
                                fontSize: '0.72rem', color: '#06b6d4',
                                background: 'rgba(6,182,212,0.1)', padding: '2px 8px', borderRadius: 20, fontWeight: 700
                              }}>{team.code}</span>
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4, marginLeft: 18 }}>{team.category}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>
                              <UserCheck size={14} />{coaches.length} Técnico{coaches.length !== 1 ? 's' : ''}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#818cf8', fontSize: '0.8rem', fontWeight: 600 }}>
                              <GraduationCap size={14} />{students.length} Aluno{students.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <button
                            onClick={() => setTab('teams')}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#06b6d4', display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: '0.8rem', fontWeight: 600, padding: '4px 8px'
                            }}
                          >
                            Gerenciar <ChevronRight size={14} />
                          </button>
                        </div>
                        {teamUsers.length > 0 && (
                          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {teamUsers.map(u => (
                              <div key={u.id} style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '4px 10px', borderRadius: 20,
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.06)'
                              }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: roleColor(u.role) }} />
                                <span style={{ color: '#cbd5e1', fontSize: '0.775rem', fontWeight: 600 }}>{u.name}</span>
                                <span style={{ color: '#475569', fontSize: '0.7rem' }}>· {roleLabel(u.role)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {teams.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>
                      Nenhuma equipe cadastrada. <button onClick={() => { setTab('teams'); setTeamModal({ mode: 'create' }) }} style={{ background: 'none', border: 'none', color: '#06b6d4', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}>Criar equipe</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TEAMS TAB ── */}
            {tab === 'teams' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.15rem' }}>Gestão de Equipes</h2>
                  <button
                    onClick={() => setTeamModal({ mode: 'create' })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 18px', borderRadius: 10,
                      background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                      border: 'none', color: '#fff', fontWeight: 700,
                      cursor: 'pointer', fontSize: '0.875rem',
                      boxShadow: '0 4px 14px rgba(6,182,212,0.3)'
                    }}
                  >
                    <Plus size={16} /> Nova Equipe
                  </button>
                </div>

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: 16 }}>
                  <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                  <input
                    type="text"
                    placeholder="Buscar equipes..."
                    value={searchTeam}
                    onChange={e => setSearchTeam(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 36 }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredTeams.map(team => {
                    const teamUsers = users.filter(u => u.teamId === team.id)
                    const coaches = teamUsers.filter(u => u.role === 'team_coach' || u.role === 'team_rep')
                    const students = teamUsers.filter(u => u.role === 'student')
                    const fd = team.financialData
                    const hasData = fd?.hasFinancialData ?? false
                    return (
                      <div key={team.id} style={{
                        background: 'rgba(15,23,42,0.8)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 12, padding: '20px',
                        transition: 'border-color 0.15s'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                              <Building2 size={18} color="#06b6d4" />
                              <span style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1rem' }}>{team.name}</span>
                              <span style={{ fontSize: '0.72rem', color: '#06b6d4', background: 'rgba(6,182,212,0.1)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                                {team.code}
                              </span>
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 8 }}>{team.category} · {team.institution || 'Instituição não informada'}</div>
                            {team.description && (
                              <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 10 }}>{team.description}</div>
                            )}
                            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                              <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <UserCheck size={13} /> {coaches.length} Técnico{coaches.length !== 1 ? 's' : ''}
                              </span>
                              <span style={{ color: '#818cf8', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <GraduationCap size={13} /> {students.length} Aluno{students.length !== 1 ? 's' : ''}
                              </span>
                              {team.leaderName && (
                                <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Crown size={12} color="#f59e0b" /> {team.leaderName}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            <button
                              onClick={() => setTeamModal({ mode: 'edit', data: team })}
                              style={{
                                padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                                background: 'rgba(255,255,255,0.04)', color: '#94a3b8', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', fontWeight: 600
                              }}
                            >
                              <Pencil size={14} /> Editar
                            </button>
                            <button
                              onClick={() => hasData
                                ? toast(`"${team.name}" não pode ser excluída: possui ${financialDataSummary(fd)} registrado(s). Exclua os dados financeiros antes.`, 'error')
                                : setConfirmDelete({ type: 'team', id: team.id, name: team.name })}
                              title={hasData ? `Bloqueado: ${financialDataSummary(fd)} registrado(s)` : 'Excluir equipe'}
                              style={{
                                padding: '7px 12px', borderRadius: 8,
                                border: hasData ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(239,68,68,0.15)',
                                background: hasData ? 'rgba(255,255,255,0.02)' : 'rgba(239,68,68,0.06)',
                                color: hasData ? '#475569' : '#f87171', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', fontWeight: 600
                              }}
                            >
                              <Trash2 size={14} /> Apagar
                            </button>
                          </div>
                        </div>

                        {hasData && (
                          <div style={{
                            marginTop: 12, padding: '10px 14px',
                            background: 'rgba(245,158,11,0.07)',
                            border: '1px solid rgba(245,158,11,0.2)',
                            borderRadius: 8,
                            display: 'flex', alignItems: 'center', gap: 8,
                            fontSize: '0.775rem', color: '#fbbf24'
                          }}>
                            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                            <span>
                              Exclusão bloqueada: há {financialDataSummary(fd)} registrado(s). Remova os dados financeiros para liberar a exclusão da equipe.
                            </span>
                          </div>
                        )}

                        {/* Members preview */}
                        {teamUsers.length > 0 && (
                          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ color: '#475569', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Membros</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {teamUsers.map(u => (
                                <div key={u.id} style={{
                                  display: 'flex', alignItems: 'center', gap: 6,
                                  padding: '4px 10px', borderRadius: 20,
                                  background: 'rgba(255,255,255,0.03)',
                                  border: `1px solid ${roleColor(u.role)}22`
                                }}>
                                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: roleColor(u.role) }} />
                                  <span style={{ color: '#cbd5e1', fontSize: '0.775rem', fontWeight: 600 }}>{u.name}</span>
                                  <span style={{ color: '#475569', fontSize: '0.7rem' }}>· {roleLabel(u.role)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {filteredTeams.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 50, color: '#475569', fontSize: '0.9rem' }}>
                      {searchTeam ? 'Nenhuma equipe encontrada.' : 'Nenhuma equipe cadastrada ainda.'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── USERS TAB ── */}
            {tab === 'users' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.15rem' }}>Gestão de Usuários</h2>
                  <button
                    onClick={() => setUserModal({ mode: 'create' })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 18px', borderRadius: 10,
                      background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                      border: 'none', color: '#fff', fontWeight: 700,
                      cursor: 'pointer', fontSize: '0.875rem',
                      boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
                    }}
                  >
                    <Plus size={16} /> Novo Usuário
                  </button>
                </div>

                {/* Role filter chips */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                    <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                    <input
                      type="text"
                      placeholder="Buscar usuários..."
                      value={searchUser}
                      onChange={e => setSearchUser(e.target.value)}
                      style={{ ...inputStyle, paddingLeft: 36 }}
                    />
                  </div>
                </div>

                {/* Users table */}
                <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                        {['Nome', 'E-mail', 'Papel', 'Equipe', 'Ações'].map(h => (
                          <th key={h} style={{
                            padding: '12px 16px', textAlign: 'left',
                            color: '#475569', fontSize: '0.75rem', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.05em'
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u, i) => (
                        <tr key={u.id} style={{
                          borderBottom: i < filteredUsers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          transition: 'background 0.1s'
                        }}>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</div>
                            {u.title && <div style={{ color: '#475569', fontSize: '0.72rem', marginTop: 2 }}>{u.title}</div>}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.825rem' }}>{u.email}</td>
                          <td style={{ padding: '14px 16px' }}><RoleBadge role={u.role} /></td>
                          <td style={{ padding: '14px 16px' }}>
                            {u.team ? (
                              <span style={{ color: '#06b6d4', fontSize: '0.8rem', fontWeight: 600 }}>{u.team.name}</span>
                            ) : (
                              <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>
                                {(u.role === 'technical_lead' || u.role === 'system_admin') ? '—' : 'Sem equipe'}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => setUserModal({ mode: 'edit', data: u })}
                                style={{
                                  padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)',
                                  background: 'rgba(255,255,255,0.04)', color: '#94a3b8', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.775rem', fontWeight: 600
                                }}
                              >
                                <Pencil size={12} /> Editar
                              </button>
                              {u.id !== adminUser.id && (
                                <button
                                  onClick={() => setConfirmDelete({ type: 'user', id: u.id, name: u.name })}
                                  style={{
                                    padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.15)',
                                    background: 'rgba(239,68,68,0.06)', color: '#f87171', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.775rem', fontWeight: 600
                                  }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>
                      {searchUser ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Team Form Modal ────────────────────────────────────────────────────────────

function TeamFormModal({ mode, data, onClose, onSuccess, toast }: {
  mode: 'create' | 'edit'
  data?: AdminTeam
  onClose: () => void
  onSuccess: (team: AdminTeam) => void
  toast: (msg: string, type?: 'success' | 'error' | 'info') => void
}) {
  const [form, setForm] = useState({
    name: data?.name || '',
    code: data?.code || '',
    category: data?.category || '',
    institution: data?.institution || '',
    description: data?.description || '',
    bankAccount: data?.bankAccount || '',
    leaderName: data?.leaderName || ''
  })
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.code || !form.category) {
      toast('Nome, código e categoria são obrigatórios.', 'error')
      return
    }
    setSaving(true)
    try {
      const saved = mode === 'create'
        ? await adminApi.createTeam(form)
        : await adminApi.updateTeam(data!.id, form)
      onSuccess(saved)
    } catch (err: any) { toast(err.message, 'error') } finally { setSaving(false) }
  }

  const categories = ['FRC - FIRST Robotics Competition', 'FTC - FIRST Tech Challenge', 'FLL - FIRST Lego League', 'Robótica de Combate', 'Robôs Autônomos', 'Outra Categoria']

  return (
    <Modal title={mode === 'create' ? 'Nova Equipe' : `Editar Equipe: ${data?.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Nome da Equipe" required>
              <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Titanium 4022" required />
            </Field>
          </div>
          <Field label="Código / Número" required>
            <input style={inputStyle} value={form.code} onChange={e => set('code', e.target.value)} placeholder="Ex: TITAN-4022" required />
          </Field>
          <Field label="Categoria" required>
            <select style={{ ...inputStyle }} value={form.category} onChange={e => set('category', e.target.value)} required>
              <option value="">Selecione...</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Instituição">
              <input style={inputStyle} value={form.institution} onChange={e => set('institution', e.target.value)} placeholder="Ex: Centro SESI/SENAI de Tecnologia" />
            </Field>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Descrição">
              <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Descreva brevemente a equipe..." />
            </Field>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Dados Bancários (PIX / Conta)">
              <input style={inputStyle} value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)} placeholder="Ex: Banco do Brasil - Ag: 1234 | CC: 9876 | PIX: pix@equipe.org" />
            </Field>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Nome do Técnico Responsável">
              <input style={inputStyle} value={form.leaderName} onChange={e => set('leaderName', e.target.value)} placeholder="Ex: Prof. João Silva" />
            </Field>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" onClick={onClose} style={{
            padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontWeight: 600
          }}>Cancelar</button>
          <button type="submit" disabled={saving} style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: '#fff',
            fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <Save size={15} />{saving ? 'Salvando...' : mode === 'create' ? 'Criar Equipe' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── User Form Modal ────────────────────────────────────────────────────────────

function UserFormModal({ mode, data, teams, onClose, onSuccess, toast }: {
  mode: 'create' | 'edit'
  data?: AdminUser
  teams: AdminTeam[]
  onClose: () => void
  onSuccess: (user: AdminUser) => void
  toast: (msg: string, type?: 'success' | 'error' | 'info') => void
}) {
  const [form, setForm] = useState({
    name: data?.name || '',
    email: data?.email || '',
    password: '',
    role: (data?.role || 'student') as AdminRole,
    teamId: data?.teamId || '',
    title: data?.title || ''
  })
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email) { toast('Nome e e-mail são obrigatórios.', 'error'); return }
    if (mode === 'create' && !form.password) { toast('Defina uma senha para o novo usuário.', 'error'); return }
    if ((form.role === 'team_coach' || form.role === 'student') && !form.teamId) {
      toast('Técnico e Aluno devem estar associados a uma equipe.', 'error'); return
    }

    setSaving(true)
    const body: any = { name: form.name, email: form.email, role: form.role, teamId: form.teamId || null, title: form.title }
    if (form.password) body.password = form.password

    try {
      const saved = mode === 'create'
        ? await adminApi.createUser(body)
        : await adminApi.updateUser(data!.id, body)
      onSuccess(saved)
    } catch (err: any) { toast(err.message, 'error') } finally { setSaving(false) }
  }

  const needsTeam = form.role === 'team_coach' || form.role === 'student'

  return (
    <Modal title={mode === 'create' ? 'Novo Usuário' : `Editar: ${data?.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Nome Completo" required>
          <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Gabriel Menezes" required />
        </Field>
        <Field label="E-mail Institucional" required>
          <input type="email" style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} placeholder="Ex: gabriel@robotica.org" required />
        </Field>
        <Field label={mode === 'create' ? 'Senha de Acesso' : 'Nova Senha (deixe em branco para manter)'}>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              style={{ ...inputStyle, paddingRight: 40 }}
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder={mode === 'create' ? 'Mínimo 6 caracteres' : '••••••••'}
              required={mode === 'create'}
            />
            <button type="button" onClick={() => setShowPass(p => !p)} style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex'
            }}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>
        <Field label="Papel / Função" required>
          <select style={{ ...inputStyle }} value={form.role} onChange={e => { set('role', e.target.value); if (e.target.value === 'system_admin' || e.target.value === 'technical_lead') set('teamId', '') }} required>
            <option value="system_admin">Administrador de TI (Acesso Total)</option>
            <option value="technical_lead">Responsável Técnica (Supervisão Geral)</option>
            <option value="team_coach">Técnico da Equipe (Aprovação de Compras)</option>
            <option value="student">Aluno (Solicitação de Compras)</option>
          </select>
        </Field>

        {needsTeam && (
          <Field label="Equipe" required>
            <select style={{ ...inputStyle }} value={form.teamId} onChange={e => set('teamId', e.target.value)} required>
              <option value="">Selecione uma equipe...</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
            </select>
          </Field>
        )}

        <Field label="Cargo / Título (opcional)">
          <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Capitão de Programação, Aluno 3º Ano" />
        </Field>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" onClick={onClose} style={{
            padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontWeight: 600
          }}>Cancelar</button>
          <button type="submit" disabled={saving} style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: '#fff',
            fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <Save size={15} />{saving ? 'Salvando...' : mode === 'create' ? 'Criar Usuário' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Admin Login Screen ─────────────────────────────────────────────────────────

function AdminLogin({ onSuccess }: { onSuccess: (token: string, user: AdminUser) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await adminApi.login(email, password)
      onSuccess(data.token, data.user)
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary, #020617)',
      padding: 24,
      fontFamily: "'Inter', -apple-system, sans-serif"
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 12px 32px rgba(6,182,212,0.35)'
          }}>
            <ShieldCheck size={30} color="#fff" />
          </div>
          <h1 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.5rem', marginBottom: 8 }}>
            Painel Administrativo
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Acesso restrito à Responsável Técnica e ao Administrador de TI
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(15,23,42,0.9)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: '32px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)'
        }}>
          <form onSubmit={handleLogin}>
            <Field label="E-mail institucional" required>
              <input
                type="email"
                style={inputStyle}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="responsavel@robotica.org"
                required
                autoFocus
              />
            </Field>

            <Field label="Senha de Acesso" required>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  style={{ ...inputStyle, paddingRight: 40 }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex'
                }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 8,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171', fontSize: '0.8125rem', marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <XCircle size={15} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px',
                borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                color: '#fff', fontWeight: 800,
                fontSize: '0.95rem', cursor: loading ? 'wait' : 'pointer',
                boxShadow: '0 6px 20px rgba(6,182,212,0.3)',
                transition: 'opacity 0.15s',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Autenticando...' : 'Acessar Painel Admin'}
            </button>
          </form>

          <div style={{
            marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)',
            textAlign: 'center', color: '#475569', fontSize: '0.775rem'
          }}>
            Este painel é exclusivo para gerenciamento de equipes e usuários do sistema.
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/" style={{ color: '#475569', fontSize: '0.8rem', textDecoration: 'none' }}>
            ← Voltar para o Portal
          </a>
          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              onClick={() => {
                if (!window.confirm('Isso apaga os dados salvos neste navegador (equipes, usuários e lançamentos) e recarrega a página. O servidor não é afetado. Continuar?')) return
                adminApi.clearLocalData()
                window.location.reload()
              }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                color: '#64748b', fontSize: '0.75rem', textDecoration: 'underline'
              }}
            >
              Painel não carrega? Limpar dados deste navegador
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Root AdminView Component ───────────────────────────────────────────────────

export function AdminView() {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('admin_token'))
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const u = sessionStorage.getItem('admin_user')
    return u ? JSON.parse(u) : null
  })

  const handleLoginSuccess = (t: string, u: AdminUser) => {
    sessionStorage.setItem('admin_token', t)
    sessionStorage.setItem('admin_user', JSON.stringify(u))
    setToken(t)
    setAdminUser(u)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token')
    sessionStorage.removeItem('admin_user')
    setToken(null)
    setAdminUser(null)
  }

  if (!token || !adminUser) {
    return <AdminLogin onSuccess={handleLoginSuccess} />
  }

  return <AdminPanel adminUser={adminUser} onLogout={handleLogout} />
}
