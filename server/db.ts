import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import { DatabaseSchema, User, Team, Sponsorship, Expense, PurchaseRequest, AuditLog } from './types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.resolve(__dirname, 'data')
const DB_FILE = path.join(DATA_DIR, 'db.json')


if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const UPLOADS_DIR = path.resolve(__dirname, '..', 'uploads')
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

function getDefaultDatabase(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10)
  const adminPassword = bcrypt.hashSync('admin123', salt)
  const coachPassword = bcrypt.hashSync('tecnico123', salt)
  const studentPassword = bcrypt.hashSync('aluno123', salt)

  const teams: Team[] = [
    {
      id: 'team-1',
      name: 'Titanium 4022',
      code: 'TITAN-4022',
      category: 'FRC - FIRST Robotics Competition',
      institution: 'Centro de Tecnologia e Inovação SESI/SENAI',
      description: 'Equipe de robótica competitiva categoria avançada FRC de 50kg.',
      bankAccount: 'Banco do Brasil - Ag: 1234-5 | CC: 98765-4 (PIX: financeiro@titanium4022.org)',
      leaderName: 'Prof. Lucas Rocha',
      createdAt: '2026-01-10T10:00:00.000Z'
    },
    {
      id: 'team-2',
      name: 'CyberGears 810',
      code: 'CYBER-810',
      category: 'FTC - FIRST Tech Challenge',
      institution: 'Instituto Federal de Educação Tecnológica',
      description: 'Desenvolvimento de robôs móveis autônomos e teleoperados com visão computacional.',
      bankAccount: 'Caixa Econômica - Ag: 4321 | CC: 56789-0 (PIX: rep@cybergears.edu.br)',
      leaderName: 'Marina Duarte',
      createdAt: '2026-01-15T14:30:00.000Z'
    },
    {
      id: 'team-3',
      name: 'SparkBots 105',
      code: 'SPARK-105',
      category: 'FLL - FIRST Lego League',
      institution: 'Escola SESI de Educação Básica',
      description: 'Iniciação científica e robótica educacional para jovens talentos.',
      bankAccount: 'Bradesco - Ag: 0987 | CC: 12345-6 (PIX: sparkbots@fiern.org.br)',
      leaderName: 'Renato Sales',
      createdAt: '2026-02-01T09:00:00.000Z'
    }
  ]

  const users: User[] = [
    {
      id: 'user-tech-lead',
      name: 'Profª Dra. Marina Guimarães',
      email: 'responsavel@robotica.org',
      passwordHash: adminPassword,
      role: 'technical_lead',
      teamId: null,
      title: 'Responsável Técnica & Supervisora Geral',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-01T08:00:00.000Z'
    },
    {
      id: 'user-coach-titanium',
      name: 'Prof. Lucas Rocha',
      email: 'tecnico@robotica.org',
      passwordHash: coachPassword,
      role: 'team_coach',
      teamId: 'team-1',
      title: 'Técnico / Mentor Titanium 4022',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-10T09:00:00.000Z'
    },
    {
      id: 'user-student-titanium',
      name: 'Gabriel Menezes',
      email: 'aluno@robotica.org',
      passwordHash: studentPassword,
      role: 'student',
      teamId: 'team-1',
      title: 'Aluno & Solicitante Titanium 4022',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-11T11:00:00.000Z'
    },
    {
      id: 'user-coach-cybergears',
      name: 'Marina Duarte',
      email: 'tecnico.cybergears@robotica.org',
      passwordHash: coachPassword,
      role: 'team_coach',
      teamId: 'team-2',
      title: 'Técnica CyberGears 810',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-15T09:00:00.000Z'
    },
    {
      id: 'user-student-cybergears',
      name: 'Beatriz Vasconcelos',
      email: 'aluno.cybergears@robotica.org',
      passwordHash: studentPassword,
      role: 'student',
      teamId: 'team-2',
      title: 'Aluna CyberGears 810',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-16T15:00:00.000Z'
    },
    {
      id: 'user-coach-sparkbots',
      name: 'Renato Sales',
      email: 'tecnico.sparkbots@robotica.org',
      passwordHash: coachPassword,
      role: 'team_coach',
      teamId: 'team-3',
      title: 'Técnico SparkBots 105',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-02-01T09:00:00.000Z'
    },
    {
      id: 'user-student-sparkbots',
      name: 'Felipe Alencar',
      email: 'aluno.sparkbots@robotica.org',
      passwordHash: studentPassword,
      role: 'student',
      teamId: 'team-3',
      title: 'Aluno SparkBots 105',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-02-02T10:00:00.000Z'
    }
  ]

  const sponsorships: Sponsorship[] = []


  const expenses: Expense[] = []


  const purchaseRequests: PurchaseRequest[] = []

  const auditLogs: AuditLog[] = [
    {
      id: 'log-init',
      timestamp: new Date().toISOString(),
      userId: 'system',
      userName: 'Sistema de Transparência',
      userRole: 'technical_lead',
      teamId: null,
      teamName: null,
      action: 'SISTEMA_INICIALIZADO',
      entityType: 'team',
      entityId: 'root',
      description: 'Base de dados limpa com sucesso. Pronto para inserção dos dados originais.'
    }
  ]

  return {
    users,
    teams,
    sponsorships,
    expenses,
    purchaseRequests,
    auditLogs
  }
}

class Database {
  private data: DatabaseSchema

  constructor() {
    this.data = this.load()
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8')
        return JSON.parse(raw)
      }
    } catch (e) {
      console.error('Erro ao ler banco de dados. Recriando padrão.', e)
    }

    const defaultDb = getDefaultDatabase()
    this.saveData(defaultDb)
    return defaultDb
  }

  private saveData(data: DatabaseSchema) {
    const tempFile = `${DB_FILE}.tmp`
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8')
    fs.renameSync(tempFile, DB_FILE)
  }

  public save() {
    this.saveData(this.data)
  }

  public resetDemoData() {
    this.data = getDefaultDatabase()
    this.save()
    return this.data
  }

  public get users() { return this.data.users }
  public get teams() { return this.data.teams }
  public get sponsorships() { return this.data.sponsorships }
  public get expenses() { return this.data.expenses }
  public get purchaseRequests() { return this.data.purchaseRequests }
  public get auditLogs() { return this.data.auditLogs }

  public logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry
    }
    this.data.auditLogs.unshift(newLog)
    this.save()
    return newLog
  }

  public getTeamFinancialSummary(teamId: string): TeamFinancialSummary | null {
    const team = this.teams.find(t => t.id === teamId)
    if (!team) return null

    const teamSponsorships = this.sponsorships.filter(s => s.teamId === teamId)
    const teamExpenses = this.expenses.filter(e => e.teamId === teamId)
    const teamPurchases = this.purchaseRequests.filter(p => p.teamId === teamId)

    const totalReceived = teamSponsorships.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
    const totalSpent = teamExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
    const currentBalance = totalReceived - totalSpent

    const inProgressPurchases = teamPurchases.filter(p => p.status === 'compra_em_andamento')
    const inProgressPurchasesCount = inProgressPurchases.length
    const inProgressPurchasesApprovedTotal = inProgressPurchases.reduce(
      (acc, curr) => acc + (Number(curr.approvedAmount || curr.estimatedTotal) || 0),
      0
    )

    const pendingRequests = teamPurchases.filter(p => 
      p.status === 'enviada' || p.status === 'em_analise' || p.status === 'ajuste_solicitado'
    )
    const pendingRequestsCount = pendingRequests.length

    return {
      teamId: team.id,
      teamName: team.name,
      category: team.category,
      totalReceived,
      totalSpent,
      currentBalance,
      inProgressPurchasesCount,
      inProgressPurchasesApprovedTotal,
      pendingRequestsCount
    }
  }

  public getAllTeamsFinancialSummary(): TeamFinancialSummary[] {
    return this.teams.map(team => this.getTeamFinancialSummary(team.id)!)
  }
}

export const db = new Database()
