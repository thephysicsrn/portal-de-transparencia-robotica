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
import type { PurchaseRequest } from './types'
import { Info } from 'lucide-react'
import './App.css'


const AppMain: React.FC = () => {
  const { user, isLoading, teams, refreshTeams } = useAuth()

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
        {/* Demonstration banner with clear disclaimer */}
        <div className="demo-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Info size={18} color="var(--accent-cyan)" />
            <span>
              <strong>Ambiente de Demonstração Interativo:</strong> Os dados exibidos (patrocínios, notas fiscais, solicitações) são demonstrativos e podem ser modificados ou restaurados livremente a qualquer momento.
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            Atualização Reativa Sem Recarga
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
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppMain />
      </AuthProvider>
    </ToastProvider>
  )
}
