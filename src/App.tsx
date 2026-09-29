import React, { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import { Navbar } from './components/Navbar'
import { LoginView } from './components/LoginView'
import { DashboardView } from './components/DashboardView'
import { SponsorshipsView } from './components/SponsorshipsView'
import { ExpensesView } from './components/ExpensesView'
import { PurchaseRequestsView } from './components/PurchaseRequestsView'
import { AccountabilityView } from './components/AccountabilityView'
import { AuditHistoryView } from './components/AuditHistoryView'
import { TeamsManagementView } from './components/TeamsManagementView'
import { AdminView, AdminPanel } from './components/AdminView'
import type { PurchaseRequest } from './types'
import { Info, AlertTriangle } from 'lucide-react'
import './App.css'

// Check if we are on the /admin route (tolerates trailing slashes and casing)
const normalizedPath = window.location.pathname.replace(/\/+$/, '').toLowerCase()
const isAdminRoute = normalizedPath === '/admin' || normalizedPath.startsWith('/admin/')


const AppMain: React.FC = () => {
  const { user, isLoading, teams, refreshTeams, hasGlobalAccess, logout } = useAuth()

  const [currentTab, setCurrentTab] = useState<string>('dashboard')
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
  const [statementTeamFilter, setStatementTeamFilter] = useState<string>('all')

  // Modals state
  const [isSponsorshipModalOpen, setIsSponsorshipModalOpen] = useState(false)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)
  const [selectedPurchaseRequest, setSelectedPurchaseRequest] = useState<PurchaseRequest | null>(null)

  const handleDataChanged = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleNavigateTab = (tab: string, filterParams?: any) => {
    if (tab === 'accountability' && filterParams?.teamId) {
      setStatementTeamFilter(filterParams.teamId)
    }
    setCurrentTab(tab)
  }

  const handleSelectPurchaseFromDashboard = (req: PurchaseRequest) => {
    setSelectedPurchaseRequest(req)
    setCurrentTab('purchases')
  }

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--accent-cyan)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>
            Portal de Transparência da Robótica
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Carregando ambiente seguro...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginView />
  }

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onDataRefreshNeeded={handleDataChanged}
      />

      {/* Main Viewport */}
      <main className="main-content">
        {/* Environment status banner */}
        <div className="demo-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Info size={18} color="var(--accent-cyan)" />
            <span>
              <strong>Base Pronta para Dados Originais:</strong> Dados fictícios removidos. Fluxo ativo com <em>Painel do Aluno</em> (solicitações), <em>Painel do Técnico</em> (aprovações de compras) e <em>Supervisão Geral</em> pela Responsável Técnica.
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', whiteSpace: 'nowrap', fontWeight: 600 }}>
            ● Sistema em Operação
          </span>
        </div>

        {/* Tab Views */}
        {currentTab === 'dashboard' && (
          <DashboardView
            onNavigateTab={handleNavigateTab}
            onOpenNewSponsorship={() => setIsSponsorshipModalOpen(true)}
            onOpenNewExpense={() => setIsExpenseModalOpen(true)}
            onOpenNewPurchase={() => setIsPurchaseModalOpen(true)}
            onSelectPurchaseRequest={handleSelectPurchaseFromDashboard}
            refreshTrigger={refreshTrigger}
          />
        )}

        {currentTab === 'sponsorships' && (
          <SponsorshipsView
            teams={teams}
            isModalOpen={isSponsorshipModalOpen}
            onCloseModal={() => setIsSponsorshipModalOpen(false)}
            onOpenModal={() => setIsSponsorshipModalOpen(true)}
            refreshTrigger={refreshTrigger}
            onDataChanged={handleDataChanged}
          />
        )}

        {currentTab === 'expenses' && (
          <ExpensesView
            teams={teams}
            isModalOpen={isExpenseModalOpen}
            onCloseModal={() => setIsExpenseModalOpen(false)}
            onOpenModal={() => setIsExpenseModalOpen(true)}
            refreshTrigger={refreshTrigger}
            onDataChanged={handleDataChanged}
          />
        )}

        {currentTab === 'purchases' && (
          <PurchaseRequestsView
            teams={teams}
            isModalOpen={isPurchaseModalOpen}
            onCloseModal={() => setIsPurchaseModalOpen(false)}
            onOpenModal={() => setIsPurchaseModalOpen(true)}
            selectedRequestFromDash={selectedPurchaseRequest}
            refreshTrigger={refreshTrigger}
            onDataChanged={handleDataChanged}
          />
        )}

        {currentTab === 'accountability' && (
          <AccountabilityView
            teams={teams}
            initialTeamFilter={statementTeamFilter}
            refreshTrigger={refreshTrigger}
          />
        )}

        {currentTab === 'audit' && (
          <AuditHistoryView refreshTrigger={refreshTrigger} />
        )}

        {currentTab === 'teams' && (
          <TeamsManagementView
            teams={teams}
            onTeamCreated={refreshTeams}
            onNavigateTab={handleNavigateTab}
          />
        )}

        {currentTab === 'adminUsers' && user && hasGlobalAccess && (
          <AdminPanel adminUser={user as any} onLogout={logout} initialTab="users" />
        )}
      </main>
    </div>
  )
}

class AdminErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 14,
          background: 'var(--bg-primary, #020617)', color: '#94a3b8',
          fontFamily: "'Inter', -apple-system, sans-serif", padding: 24, textAlign: 'center'
        }}>
          <AlertTriangle size={36} color="#f59e0b" />
          <h1 style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
            Não foi possível carregar o painel administrativo
          </h1>
          <p style={{ maxWidth: 460, fontSize: '0.85rem', margin: 0 }}>
            {this.state.error.message}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem'
              }}
            >
              Recarregar
            </button>
            <a
              href="/"
              style={{
                padding: '10px 20px', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem',
                textDecoration: 'none', display: 'flex', alignItems: 'center'
              }}
            >
              Voltar ao Portal
            </a>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default function App() {
  if (isAdminRoute) {
    return (
      <AdminErrorBoundary>
        <AdminView />
      </AdminErrorBoundary>
    )
  }

  return (
    <ToastProvider>
      <AuthProvider>
        <AppMain />
      </AuthProvider>
    </ToastProvider>
  )
}
