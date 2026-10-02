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
  const tiPassword = bcrypt.hashSync('ti123', salt)
  const coachPassword = bcrypt.hashSync('tecnico@2026', salt)
  const studentPassword = bcrypt.hashSync('aluno@2026', salt)

  const teams: Team[] = [
    {
      id: 'team-batlego',
      name: 'BATLEGO',
      code: 'BAT-FLL',
      category: 'FLL - FIRST Lego League',
      institution: 'SESI RN',
      description: 'Equipe de robótica da categoria FLL (FIRST Lego League) do SESI RN.',
      bankAccount: 'SESI RN / BATLEGO',
      leaderName: 'Mateus Zeca Bezerra da Silva',
      createdAt: '2026-02-01T10:00:00.000Z'
    },
    {
      id: 'team-guarani',
      name: 'GUARANI',
      code: 'GUA-FLL',
      category: 'FLL - FIRST Lego League',
      institution: 'SESI RN',
      description: 'Equipe de robótica da categoria FLL (FIRST Lego League) do SESI RN.',
      bankAccount: 'SESI RN / GUARANI',
      leaderName: 'Sheyla de Paula Cardoso',
      createdAt: '2026-02-01T10:00:00.000Z'
    },
    {
      id: 'team-carcara-lux',
      name: 'CARCARÁ LUX',
      code: 'CAR-SR',
      category: 'STEAM RACING',
      institution: 'SESI RN',
      description: 'Equipe de robótica e automobilismo educacional categoria STEAM RACING.',
      bankAccount: 'SESI RN / CARCARÁ LUX',
      leaderName: 'Zania Christina Feitosa Lobo Gomes',
      createdAt: '2026-02-01T10:00:00.000Z'
    },
    {
      id: 'team-p0t1bat',
      name: 'P0T1BAT',
      code: 'POT-FRC',
      category: 'FRC - FIRST Robotics Competition',
      institution: 'SESI RN',
      description: 'Equipe avançada de robótica industrial competitiva FRC de 50kg.',
      bankAccount: 'SESI RN / P0T1BAT',
      leaderName: 'Terciano Fonseca de Souza',
      createdAt: '2026-02-01T10:00:00.000Z'
    },
    {
      id: 'team-jovens-punares',
      name: 'JOVENS PUNARÉS',
      code: 'PUN-FLL',
      category: 'FLL - FIRST Lego League',
      institution: 'SESI RN',
      description: 'Equipe de robótica da categoria FLL (FIRST Lego League) do SESI RN.',
      bankAccount: 'SESI RN / JOVENS PUNARÉS',
      leaderName: 'Paulo Cesar Palhares de Lima',
      createdAt: '2026-02-01T10:00:00.000Z'
    },
    {
      id: 'team-techno-sertao',
      name: 'TECHNO SERTÃO',
      code: 'TEC-FLL',
      category: 'FLL - FIRST Lego League',
      institution: 'SESI RN',
      description: 'Equipe de robótica da categoria FLL (FIRST Lego League) do SESI RN.',
      bankAccount: 'SESI RN / TECHNO SERTÃO',
      leaderName: 'Micael Silva dos Santos',
      createdAt: '2026-02-01T10:00:00.000Z'
    }
  ]

  const users: User[] = [
    {
      id: 'user-tech-lead',
      name: 'Laysa Guimarães',
      email: 'gilmaraguimaraes@rn.sesi.org.br',
      passwordHash: adminPassword,
      role: 'technical_lead',
      teamId: null,
      title: 'Responsável Técnica & Supervisora Geral',
      avatar: '',
      createdAt: '2026-01-01T08:00:00.000Z'
    },
    {
      id: 'user-system-admin',
      name: 'Administrador de TI',
      email: 'ti@robotica.org',
      passwordHash: tiPassword,
      role: 'system_admin',
      teamId: null,
      title: 'Administrador do Sistema & TI',
      avatar: '',
      createdAt: '2026-01-01T07:00:00.000Z'
    },
    // BATLEGO
    {
      id: 'user-coach-batlego',
      name: 'Mateus Zeca Bezerra da Silva',
      email: 'mateusssilva@rn.sesi.org.br',
      passwordHash: coachPassword,
      role: 'team_coach',
      teamId: 'team-batlego',
      title: 'Técnico - BATLEGO',
      avatar: '',
      createdAt: '2026-02-01T10:00:00.000Z'
    },
    {
      id: 'user-student-batlego',
      name: 'Enio Josias de Melo',
      email: 'enio.melo@rn.aluno.sesi.org.br',
      passwordHash: studentPassword,
      role: 'student',
      teamId: 'team-batlego',
      title: 'Representante Estudantil - BATLEGO',
      avatar: '',
      createdAt: '2026-02-01T10:00:00.000Z'
    },
    // GUARANI
    {
      id: 'user-coach-guarani',
      name: 'Sheyla de Paula Cardoso',
      email: 'sheylaferreira@rn.sesi.org.br',
      passwordHash: coachPassword,
      role: 'team_coach',
      teamId: 'team-guarani',
      title: 'Técnica - GUARANI',
      avatar: '',
      createdAt: '2026-02-01T10:00:00.000Z'
    },
    {
      id: 'user-student-guarani',
      name: 'Angélica Pinheiro',
      email: 'angelica.pinheiro@rn.aluno.sesi.org.br',
      passwordHash: studentPassword,
      role: 'student',
      teamId: 'team-guarani',
      title: 'Representante Estudantil - GUARANI',
      avatar: '',
      createdAt: '2026-02-01T10:00:00.000Z'
    },
    // CARCARÁ LUX
    {
      id: 'user-coach-carcara-lux',
      name: 'Zania Christina Feitosa Lobo Gomes',
      email: 'zaniagomes@rn.sesi.org.br',
      passwordHash: coachPassword,
      role: 'team_coach',
      teamId: 'team-carcara-lux',
      title: 'Técnica - CARCARÁ LUX',
      avatar: '',
      createdAt: '2026-02-01T10:00:00.000Z'
    },
    {
      id: 'user-student-carcara-lux',
      name: 'Maria Vitória Mariano Jales',
      email: 'maria.mariano@rn.aluno.sesi.org.br',
      passwordHash: studentPassword,
      role: 'student',
      teamId: 'team-carcara-lux',
      title: 'Representante Estudantil - CARCARÁ LUX',
      avatar: '',
      createdAt: '2026-02-01T10:00:00.000Z'
    },
    // P0T1BAT
    {
      id: 'user-coach-p0t1bat',
      name: 'Terciano Fonseca de Souza',
      email: 'tercianosouza@rn.sesi.org.br',
      passwordHash: coachPassword,
      role: 'team_coach',
      teamId: 'team-p0t1bat',
      title: 'Técnico - P0T1BAT',
      avatar: '',
      createdAt: '2026-02-01T10:00:00.000Z'
    },
    {
      id: 'user-student-p0t1bat',
      name: 'Julia Letícia Da Silva Aguiar',
      email: 'julia.aguiar@rn.aluno.sesi.org.br',
      passwordHash: studentPassword,
      role: 'student',
      teamId: 'team-p0t1bat',
      title: 'Representante Estudantil - P0T1BAT',
      avatar: '',
      createdAt: '2026-02-01T10:00:00.000Z'
    },
    // JOVENS PUNARÉS
    {
      id: 'user-coach-jovens-punares',
      name: 'Paulo Cesar Palhares de Lima',
      email: 'paulolima@rn.sesi.org.br',
      passwordHash: coachPassword,
      role: 'team_coach',
      teamId: 'team-jovens-punares',
      title: 'Técnico - JOVENS PUNARÉS',
      avatar: '',
      createdAt: '2026-02-01T10:00:00.000Z'
    },
    {
      id: 'user-student-jovens-punares',
      name: 'Heitor Guedes Santos da Silva',
      email: 'heitorguedessantosdasilva@gmail.com',
      passwordHash: studentPassword,
      role: 'student',
      teamId: 'team-jovens-punares',
      title: 'Representante Estudantil - JOVENS PUNARÉS',
      avatar: '',
      createdAt: '2026-02-01T10:00:00.000Z'
    },
    // TECHNO SERTÃO
    {
      id: 'user-coach-techno-sertao',
      name: 'Micael Silva dos Santos',
      email: 'micaelsantos@rn.sesi.org.br',
      passwordHash: coachPassword,
      role: 'team_coach',
      teamId: 'team-techno-sertao',
      title: 'Técnico - TECHNO SERTÃO',
      avatar: '',
      createdAt: '2026-02-01T10:00:00.000Z'
    },
    {
      id: 'user-student-techno-sertao',
      name: 'Lara Silva',
      email: 'lara.silva@rn.aluno.sesi.org.br',
      passwordHash: studentPassword,
      role: 'student',
      teamId: 'team-techno-sertao',
      title: 'Representante Estudantil - TECHNO SERTÃO',
      avatar: '',
      createdAt: '2026-02-01T10:00:00.000Z'
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
        const parsed = JSON.parse(raw) as DatabaseSchema
        return this.applySeedMigrations(parsed)
      }
    } catch (e) {
      console.error('Erro ao ler banco de dados. Recriando padrão.', e)
    }

    const defaultDb = getDefaultDatabase()
    this.saveData(defaultDb)
    return defaultDb
  }

  // Inserts default accounts that are missing, so existing databases pick up newly added roles
  private applySeedMigrations(data: DatabaseSchema): DatabaseSchema {
    let changed = false

    // Runs only once: otherwise deleted accounts and profile changes would be reverted on each load
    if (!data.demoAccountsMerged) {
      // Only the administrative accounts are guaranteed to exist. Demo students and coaches are
      // free to be deleted and must never be recreated.
      const requiredSeeds = getDefaultDatabase().users.filter(
        u => u.role === 'system_admin' || u.role === 'technical_lead'
      )
      for (const seedUser of requiredSeeds) {
        const existing = data.users.find(u => u.id === seedUser.id || u.email.toLowerCase() === seedUser.email.toLowerCase())
        if (!existing) {
          data.users.push(seedUser)
          changed = true
        }
      }
      data.demoAccountsMerged = true
      changed = true
    }

    // Legacy databases still carry the retired "team_rep" role
    for (const user of data.users) {
      if (user.role === 'team_rep') {
        user.role = 'team_coach'
        changed = true
      }
    }

    for (const log of data.auditLogs) {
      if (log.userRole === 'team_rep') {
        log.userRole = 'team_coach'
        changed = true
      }
    }

    if (changed) this.saveData(data)
    return data
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
