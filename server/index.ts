import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { db } from './db'
import { User, PurchaseStatus } from './types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const JWT_SECRET = process.env.JWT_SECRET || 'robotica-transparencia-secret-key-2026'
const PORT = process.env.PORT || 3001

const app = express()


// Middleware
app.use(cors())
app.use(express.json())

// Ensure uploads dir
const uploadsDir = path.resolve(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = path.extname(file.originalname)
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_')
    cb(null, `${base}-${uniqueSuffix}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
})

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir))

// Extended Request interface
export interface AuthRequest extends Request {
  user?: User
}

// Auth Middleware
function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null

  if (!token) {
    res.status(401).json({ error: 'Token de autenticação não fornecido.' })
    return
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string }
    const user = db.users.find(u => u.id === decoded.id)

    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado ou sessão expirada.' })
      return
    }

    req.user = user
    next()
  } catch (err) {
    res.status(403).json({ error: 'Token inválido ou expirado.' })
    return
  }
}

// Role Middleware
function requireRole(allowedRoles: Array<'technical_lead' | 'team_rep'>) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Acesso negado: permissão insuficiente para esta operação.' })
      return
    }
    next()
  }
}

// Enforce Team Scope Middleware (Prevents Team Reps from accessing or manipulating other teams' data)
function enforceTeamScope(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado.' })
    return
  }

  // Technical lead can access any team
  if (req.user.role === 'technical_lead') {
    next()
    return
  }

  // Team rep MUST be restricted to their team
  const targetTeamId = req.query.teamId as string || req.body.teamId as string
  if (targetTeamId && targetTeamId !== req.user.teamId) {
    res.status(403).json({ error: 'Acesso negado: você só tem permissão para visualizar e gerenciar sua própria equipe.' })
    return
  }

  // Force teamId for team rep on queries and bodies
  if (!targetTeamId && req.user.teamId) {
    if (req.method === 'GET') {
      req.query.teamId = req.user.teamId
    } else if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      req.body.teamId = req.user.teamId
    }
  }

  next()
}

// ----------------------------------------------------
// AUTH ROUTES
// ----------------------------------------------------

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' })
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim())
  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas. Verifique o e-mail e a senha.' })
  }

  const match = bcrypt.compareSync(password, user.passwordHash)
  if (!match) {
    return res.status(401).json({ error: 'Credenciais inválidas. Verifique o e-mail e a senha.' })
  }

  const token = jwt.sign({ id: user.id, role: user.role, teamId: user.teamId }, JWT_SECRET, { expiresIn: '7d' })

  const userTeam = user.teamId ? db.teams.find(t => t.id === user.teamId) : null

  db.logAudit({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    teamId: user.teamId,
    teamName: userTeam ? userTeam.name : null,
    action: 'LOGIN',
    entityType: 'auth',
    entityId: user.id,
    description: `Usuário realizou login com sucesso no sistema (${user.role === 'technical_lead' ? 'Responsável Técnica' : 'Representante'}).`
  })

  const { passwordHash: _, ...safeUser } = user

  return res.json({
    token,
    user: {
      ...safeUser,
      team: userTeam
    }
  })
})

app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' })
  const userTeam = req.user.teamId ? db.teams.find(t => t.id === req.user!.teamId) : null
  const { passwordHash: _, ...safeUser } = req.user
  return res.json({
    user: {
      ...safeUser,
      team: userTeam
    }
  })
})

// ----------------------------------------------------
// TEAMS ROUTES
// ----------------------------------------------------

app.get('/api/teams', authenticateToken, (req: AuthRequest, res: Response) => {
  if (req.user?.role === 'team_rep') {
    const team = db.teams.filter(t => t.id === req.user!.teamId)
    return res.json(team)
  }
  return res.json(db.teams)
})

app.get('/api/teams/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const { id } = req.params
  if (req.user?.role === 'team_rep' && req.user.teamId !== id) {
    return res.status(403).json({ error: 'Acesso negado aos dados de outra equipe.' })
  }

  const team = db.teams.find(t => t.id === id)
  if (!team) return res.status(404).json({ error: 'Equipe não encontrada.' })

  const summary = db.getTeamFinancialSummary(id)
  return res.json({ ...team, summary })
})

app.post('/api/teams', authenticateToken, requireRole(['technical_lead']), (req: AuthRequest, res: Response) => {
  const { name, code, category, institution, description, bankAccount, leaderName } = req.body

  if (!name || !code || !category) {
    return res.status(400).json({ error: 'Nome, código e categoria da equipe são obrigatórios.' })
  }

  const newTeam = {
    id: `team-${Date.now()}`,
    name,
    code: code.toUpperCase(),
    category,
    institution: institution || '',
    description: description || '',
    bankAccount: bankAccount || '',
    leaderName: leaderName || '',
    createdAt: new Date().toISOString()
  }

  db.teams.push(newTeam)
  db.save()

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    teamId: newTeam.id,
    teamName: newTeam.name,
    action: 'CRIOU_PATROCINIO', // or generic setup
    entityType: 'team',
    entityId: newTeam.id,
    description: `Cadastrou nova equipe: ${newTeam.name} (${newTeam.category}).`
  })

  return res.status(201).json(newTeam)
})

// ----------------------------------------------------
// FILE UPLOAD ROUTE
// ----------------------------------------------------

app.post('/api/upload', authenticateToken, upload.single('file'), (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' })
  }

  const fileUrl = `/uploads/${req.file.filename}`
  return res.json({
    fileUrl,
    fileName: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype
  })
})

// ----------------------------------------------------
// DASHBOARD & FINANCIAL SUMMARIES
// ----------------------------------------------------

app.get('/api/reports/dashboard', authenticateToken, (req: AuthRequest, res: Response) => {
  const isTechLead = req.user?.role === 'technical_lead'
  const filterTeamId = req.query.teamId as string

  let teamsSummaries = db.getAllTeamsFinancialSummary()

  if (!isTechLead) {
    teamsSummaries = teamsSummaries.filter(s => s.teamId === req.user!.teamId)
  } else if (filterTeamId && filterTeamId !== 'all') {
    teamsSummaries = teamsSummaries.filter(s => s.teamId === filterTeamId)
  }

  // Aggregate totals
  const totalReceived = teamsSummaries.reduce((a, c) => a + c.totalReceived, 0)
  const totalSpent = teamsSummaries.reduce((a, c) => a + c.totalSpent, 0)
  const currentBalance = totalReceived - totalSpent
  const inProgressPurchasesCount = teamsSummaries.reduce((a, c) => a + c.inProgressPurchasesCount, 0)
  const inProgressPurchasesApprovedTotal = teamsSummaries.reduce((a, c) => a + c.inProgressPurchasesApprovedTotal, 0)
  const pendingRequestsCount = teamsSummaries.reduce((a, c) => a + c.pendingRequestsCount, 0)

  // Pending purchase requests needing attention
  let pendingRequests = db.purchaseRequests.filter(p => 
    p.status === 'enviada' || p.status === 'em_analise' || p.status === 'ajuste_solicitado'
  )
  if (!isTechLead) {
    pendingRequests = pendingRequests.filter(p => p.teamId === req.user!.teamId)
  } else if (filterTeamId && filterTeamId !== 'all') {
    pendingRequests = pendingRequests.filter(p => p.teamId === filterTeamId)
  }

  // Recent activity logs
  let recentLogs = db.auditLogs
  if (!isTechLead) {
    recentLogs = recentLogs.filter(l => l.teamId === req.user!.teamId)
  } else if (filterTeamId && filterTeamId !== 'all') {
    recentLogs = recentLogs.filter(l => l.teamId === filterTeamId)
  }

  const enrichedPending = pendingRequests.slice(0, 10).map(p => {
    const team = db.teams.find(t => t.id === p.teamId)
    return { ...p, teamName: team ? team.name : 'Equipe' }
  })

  return res.json({
    metrics: {
      totalReceived,
      totalSpent,
      currentBalance,
      inProgressPurchasesCount,
      inProgressPurchasesApprovedTotal,
      pendingRequestsCount
    },
    teamsSummaries,
    pendingRequests: enrichedPending,
    recentLogs: recentLogs.slice(0, 10)
  })

})

// Financial Statement (Extrato unificado com saldo dinâmico)
app.get('/api/reports/statement', authenticateToken, enforceTeamScope, (req: AuthRequest, res: Response) => {
  const { teamId, startDate, endDate, category } = req.query as {
    teamId?: string
    startDate?: string
    endDate?: string
    category?: string
  }

  const targetTeamId = req.user?.role === 'team_rep' ? req.user.teamId! : (teamId || 'all')

  let sponsorships = db.sponsorships
  let expenses = db.expenses

  if (targetTeamId !== 'all') {
    sponsorships = sponsorships.filter(s => s.teamId === targetTeamId)
    expenses = expenses.filter(e => e.teamId === targetTeamId)
  }

  if (startDate) {
    sponsorships = sponsorships.filter(s => s.receiptDate >= startDate)
    expenses = expenses.filter(e => e.expenseDate >= startDate)
  }

  if (endDate) {
    sponsorships = sponsorships.filter(s => s.receiptDate <= endDate)
    expenses = expenses.filter(e => e.expenseDate <= endDate)
  }

  if (category && category !== 'all') {
    expenses = expenses.filter(e => e.category === category)
    // If filtering by expense category, do not include sponsorships unless "Receitas"
    if (category !== 'Patrocínio') {
      sponsorships = []
    }
  }

  // Combine into unified statement entries
  const entries: Array<{
    id: string
    type: 'sponsorship' | 'expense'
    teamId: string
    teamName: string
    date: string
    description: string
    category: string
    counterpart: string // Patrocinador ou Fornecedor
    amount: number
    receiptUrl?: string | null
    receiptFileName?: string | null
    registeredByName: string
  }> = []

  sponsorships.forEach(s => {
    const team = db.teams.find(t => t.id === s.teamId)
    entries.push({
      id: s.id,
      type: 'sponsorship',
      teamId: s.teamId,
      teamName: team ? team.name : 'Equipe',
      date: s.receiptDate,
      description: s.purpose,
      category: 'Patrocínio / Entrada',
      counterpart: s.sponsorName,
      amount: Number(s.amount),
      receiptUrl: s.receiptUrl,
      receiptFileName: s.receiptFileName,
      registeredByName: s.createdByName
    })
  })

  expenses.forEach(e => {
    const team = db.teams.find(t => t.id === e.teamId)
    entries.push({
      id: e.id,
      type: 'expense',
      teamId: e.teamId,
      teamName: team ? team.name : 'Equipe',
      date: e.expenseDate,
      description: e.description,
      category: e.category,
      counterpart: e.supplier,
      amount: Number(e.amount),
      receiptUrl: e.receiptUrl,
      receiptFileName: e.receiptFileName,
      registeredByName: e.createdByName
    })
  })

  // Sort chronological ascending to calculate running balance
  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  let runningBalance = 0
  const statementWithBalance = entries.map(entry => {
    if (entry.type === 'sponsorship') {
      runningBalance += entry.amount
    } else {
      runningBalance -= entry.amount
    }
    return {
      ...entry,
      balanceAfter: runningBalance
    }
  })

  // Summary figures
  const totalEntries = entries.filter(e => e.type === 'sponsorship').reduce((a, c) => a + c.amount, 0)
  const totalExits = entries.filter(e => e.type === 'expense').reduce((a, c) => a + c.amount, 0)

  return res.json({
    targetTeamId,
    totalEntries,
    totalExits,
    currentBalance: totalEntries - totalExits,
    items: statementWithBalance.reverse() // Return newest first for presentation
  })
})

// ----------------------------------------------------
// SPONSORSHIPS ROUTES
// ----------------------------------------------------

app.get('/api/sponsorships', authenticateToken, enforceTeamScope, (req: AuthRequest, res: Response) => {
  const teamId = req.query.teamId as string
  let items = db.sponsorships

  if (req.user?.role === 'team_rep') {
    items = items.filter(s => s.teamId === req.user!.teamId)
  } else if (teamId && teamId !== 'all') {
    items = items.filter(s => s.teamId === teamId)
  }

  // Sort by receiptDate descending
  items.sort((a, b) => new Date(b.receiptDate).getTime() - new Date(a.receiptDate).getTime())

  // Attach team info
  const enriched = items.map(s => {
    const team = db.teams.find(t => t.id === s.teamId)
    return { ...s, teamName: team ? team.name : 'Desconhecida' }
  })

  return res.json(enriched)
})

app.post('/api/sponsorships', authenticateToken, enforceTeamScope, (req: AuthRequest, res: Response) => {
  const { sponsorName, amount, receiptDate, purpose, notes, receiptUrl, receiptFileName, teamId } = req.body

  const assignedTeamId = req.user?.role === 'team_rep' ? req.user.teamId! : teamId

  if (!assignedTeamId) {
    return res.status(400).json({ error: 'A equipe beneficiada deve ser informada.' })
  }

  const team = db.teams.find(t => t.id === assignedTeamId)
  if (!team) {
    return res.status(400).json({ error: 'Equipe não encontrada.' })
  }

  const parsedAmount = parseFloat(amount)
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'O valor do patrocínio deve ser um número positivo.' })
  }

  if (!sponsorName || !receiptDate || !purpose) {
    return res.status(400).json({ error: 'Patrocinador, data de recebimento e finalidade são campos obrigatórios.' })
  }

  const now = new Date().toISOString()
  const newSponsorship = {
    id: `spon-${Date.now()}`,
    teamId: assignedTeamId,
    sponsorName: sponsorName.trim(),
    amount: parsedAmount,
    receiptDate,
    purpose: purpose.trim(),
    notes: notes ? notes.trim() : '',
    receiptUrl: receiptUrl || null,
    receiptFileName: receiptFileName || null,
    createdBy: req.user!.id,
    createdByName: req.user!.name,
    createdAt: now,
    updatedAt: now
  }

  db.sponsorships.push(newSponsorship)
  db.save()

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    teamId: assignedTeamId,
    teamName: team.name,
    action: 'CRIOU_PATROCINIO',
    entityType: 'sponsorship',
    entityId: newSponsorship.id,
    description: `Registrou patrocínio de R$ ${parsedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} do patrocinador "${sponsorName}".`,
    details: { newSponsorship }
  })

  return res.status(201).json(newSponsorship)
})

app.delete('/api/sponsorships/:id', authenticateToken, enforceTeamScope, (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const index = db.sponsorships.findIndex(s => s.id === id)

  if (index === -1) {
    return res.status(404).json({ error: 'Patrocínio não encontrado.' })
  }

  const sponsorship = db.sponsorships[index]

  if (req.user?.role === 'team_rep' && sponsorship.teamId !== req.user.teamId) {
    return res.status(403).json({ error: 'Acesso negado: você não pode excluir registros de outra equipe.' })
  }

  const team = db.teams.find(t => t.id === sponsorship.teamId)

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    teamId: sponsorship.teamId,
    teamName: team ? team.name : null,
    action: 'EXCLUIU_PATROCINIO',
    entityType: 'sponsorship',
    entityId: sponsorship.id,
    description: `Excluiu o registro de patrocínio "${sponsorship.sponsorName}" no valor de R$ ${sponsorship.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
    details: { deletedRecord: sponsorship }
  })

  db.sponsorships.splice(index, 1)
  db.save()

  return res.json({ message: 'Patrocínio removido com sucesso.' })
})

// ----------------------------------------------------
// EXPENSES ROUTES
// ----------------------------------------------------

app.get('/api/expenses', authenticateToken, enforceTeamScope, (req: AuthRequest, res: Response) => {
  const teamId = req.query.teamId as string
  let items = db.expenses

  if (req.user?.role === 'team_rep') {
    items = items.filter(e => e.teamId === req.user!.teamId)
  } else if (teamId && teamId !== 'all') {
    items = items.filter(e => e.teamId === teamId)
  }

  items.sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())

  const enriched = items.map(e => {
    const team = db.teams.find(t => t.id === e.teamId)
    return { ...e, teamName: team ? team.name : 'Desconhecida' }
  })

  return res.json(enriched)
})

app.post('/api/expenses', authenticateToken, enforceTeamScope, (req: AuthRequest, res: Response) => {
  const { category, description, amount, expenseDate, supplier, receiptUrl, receiptFileName, purchaseRequestId, teamId } = req.body

  const assignedTeamId = req.user?.role === 'team_rep' ? req.user.teamId! : teamId

  if (!assignedTeamId) {
    return res.status(400).json({ error: 'A equipe deve ser informada.' })
  }

  const team = db.teams.find(t => t.id === assignedTeamId)
  if (!team) {
    return res.status(400).json({ error: 'Equipe não encontrada.' })
  }

  const parsedAmount = parseFloat(amount)
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'O valor da despesa deve ser um número positivo.' })
  }

  if (!category || !description || !expenseDate || !supplier) {
    return res.status(400).json({ error: 'Categoria, descrição, fornecedor e data da despesa são obrigatórios.' })
  }

  const now = new Date().toISOString()
  const newExpense = {
    id: `exp-${Date.now()}`,
    teamId: assignedTeamId,
    category,
    description: description.trim(),
    amount: parsedAmount,
    expenseDate,
    supplier: supplier.trim(),
    receiptUrl: receiptUrl || null,
    receiptFileName: receiptFileName || null,
    purchaseRequestId: purchaseRequestId || null,
    createdBy: req.user!.id,
    createdByName: req.user!.name,
    createdAt: now,
    updatedAt: now
  }

  db.expenses.push(newExpense)
  db.save()

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    teamId: assignedTeamId,
    teamName: team.name,
    action: 'CRIOU_DESPESA',
    entityType: 'expense',
    entityId: newExpense.id,
    description: `Lançou despesa de R$ ${parsedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} [${category}] para "${supplier}".`,
    details: { newExpense }
  })

  return res.status(201).json(newExpense)
})

app.delete('/api/expenses/:id', authenticateToken, enforceTeamScope, (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const index = db.expenses.findIndex(e => e.id === id)

  if (index === -1) {
    return res.status(404).json({ error: 'Despesa não encontrada.' })
  }

  const expense = db.expenses[index]

  if (req.user?.role === 'team_rep' && expense.teamId !== req.user.teamId) {
    return res.status(403).json({ error: 'Acesso negado: você não pode excluir despesas de outra equipe.' })
  }

  const team = db.teams.find(t => t.id === expense.teamId)

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    teamId: expense.teamId,
    teamName: team ? team.name : null,
    action: 'EXCLUIU_DESPESA',
    entityType: 'expense',
    entityId: expense.id,
    description: `Excluiu despesa "${expense.description}" no valor de R$ ${expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
    details: { deletedRecord: expense }
  })

  db.expenses.splice(index, 1)
  db.save()

  return res.json({ message: 'Despesa removida com sucesso.' })
})

// ----------------------------------------------------
// PURCHASE REQUESTS (SOLICITAÇÕES DE COMPRA)
// ----------------------------------------------------

app.get('/api/purchase-requests', authenticateToken, enforceTeamScope, (req: AuthRequest, res: Response) => {
  const { teamId, status } = req.query as { teamId?: string; status?: string }
  let items = db.purchaseRequests

  if (req.user?.role === 'team_rep') {
    items = items.filter(p => p.teamId === req.user!.teamId)
  } else if (teamId && teamId !== 'all') {
    items = items.filter(p => p.teamId === teamId)
  }

  if (status && status !== 'all') {
    items = items.filter(p => p.status === status)
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const enriched = items.map(p => {
    const team = db.teams.find(t => t.id === p.teamId)
    return { ...p, teamName: team ? team.name : 'Desconhecida' }
  })

  return res.json(enriched)
})

app.get('/api/purchase-requests/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const request = db.purchaseRequests.find(p => p.id === id)

  if (!request) {
    return res.status(404).json({ error: 'Solicitação de compra não encontrada.' })
  }

  if (req.user?.role === 'team_rep' && request.teamId !== req.user.teamId) {
    return res.status(403).json({ error: 'Acesso negado: solicitação de outra equipe.' })
  }

  const team = db.teams.find(t => t.id === request.teamId)
  return res.json({ ...request, teamName: team ? team.name : 'Desconhecida' })
})

// Team creates purchase request
app.post('/api/purchase-requests', authenticateToken, enforceTeamScope, (req: AuthRequest, res: Response) => {
  const { title, items, purpose, justification, urgency, teamId } = req.body

  const assignedTeamId = req.user?.role === 'team_rep' ? req.user.teamId! : teamId

  if (!assignedTeamId) {
    return res.status(400).json({ error: 'A equipe solicitante deve ser informada.' })
  }

  const team = db.teams.find(t => t.id === assignedTeamId)
  if (!team) {
    return res.status(400).json({ error: 'Equipe não encontrada.' })
  }

  if (!title || !purpose || !justification) {
    return res.status(400).json({ error: 'Título, finalidade e justificativa da solicitação são obrigatórios.' })
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Informe ao menos um item a ser adquirido na solicitação.' })
  }

  const validatedItems = items.map((item: any, idx: number) => {
    const qty = parseInt(item.quantity) || 1
    const unitPrice = parseFloat(item.unitPriceEstimated) || 0
    return {
      id: item.id || `item-${Date.now()}-${idx}`,
      name: item.name || `Item ${idx + 1}`,
      quantity: qty,
      unitPriceEstimated: unitPrice,
      totalEstimated: qty * unitPrice,
      referenceLink: item.referenceLink || ''
    }
  })

  const estimatedTotal = validatedItems.reduce((acc: number, curr: any) => acc + curr.totalEstimated, 0)

  const now = new Date().toISOString()
  const newRequest = {
    id: `pr-${Date.now()}`,
    teamId: assignedTeamId,
    title: title.trim(),
    items: validatedItems,
    estimatedTotal,
    purpose: purpose.trim(),
    justification: justification.trim(),
    urgency: urgency || 'media',
    status: 'enviada' as PurchaseStatus,
    reviewNotes: null,
    approvedAmount: null,
    reviewedBy: null,
    reviewedByName: null,
    reviewedAt: null,
    finalActualAmount: null,
    finalReceiptUrl: null,
    finalReceiptFileName: null,
    expenseId: null,
    createdBy: req.user!.id,
    createdByName: req.user!.name,
    createdAt: now,
    updatedAt: now
  }

  db.purchaseRequests.push(newRequest)
  db.save()

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    teamId: assignedTeamId,
    teamName: team.name,
    action: 'CRIOU_SOLICITACAO_COMPRA',
    entityType: 'purchase_request',
    entityId: newRequest.id,
    description: `Criou solicitação de compra "${newRequest.title}" com valor estimado de R$ ${estimatedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
    details: { newRequest }
  })

  return res.status(201).json(newRequest)
})

// Team updates/resubmits purchase request (when in 'enviada' or 'ajuste_solicitado')
app.put('/api/purchase-requests/:id', authenticateToken, enforceTeamScope, (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { title, items, purpose, justification, urgency } = req.body

  const request = db.purchaseRequests.find(p => p.id === id)
  if (!request) {
    return res.status(404).json({ error: 'Solicitação de compra não encontrada.' })
  }

  if (req.user?.role === 'team_rep' && request.teamId !== req.user.teamId) {
    return res.status(403).json({ error: 'Acesso negado: solicitação de outra equipe.' })
  }

  if (!['enviada', 'ajuste_solicitado'].includes(request.status)) {
    return res.status(400).json({
      error: `Não é possível editar uma solicitação no status "${request.status}". Apenas solicitações "enviada" ou com "ajuste_solicitado" podem ser alteradas.`
    })
  }

  const validatedItems = items.map((item: any, idx: number) => {
    const qty = parseInt(item.quantity) || 1
    const unitPrice = parseFloat(item.unitPriceEstimated) || 0
    return {
      id: item.id || `item-${Date.now()}-${idx}`,
      name: item.name || `Item ${idx + 1}`,
      quantity: qty,
      unitPriceEstimated: unitPrice,
      totalEstimated: qty * unitPrice,
      referenceLink: item.referenceLink || ''
    }
  })

  const previousState = { ...request }

  request.title = title || request.title
  request.items = validatedItems
  request.estimatedTotal = validatedItems.reduce((acc: number, curr: any) => acc + curr.totalEstimated, 0)
  request.purpose = purpose || request.purpose
  request.justification = justification || request.justification
  request.urgency = urgency || request.urgency
  request.updatedAt = new Date().toISOString()

  // If adjustments were requested, resubmitting moves it back to 'enviada'
  const isResubmission = request.status === 'ajuste_solicitado'
  if (isResubmission) {
    request.status = 'enviada'
  }

  db.save()

  const team = db.teams.find(t => t.id === request.teamId)
  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    teamId: request.teamId,
    teamName: team ? team.name : null,
    action: isResubmission ? 'REENVIOU_SOLICITACAO' : 'EDITOU_SOLICITACAO_COMPRA',
    entityType: 'purchase_request',
    entityId: request.id,
    description: isResubmission
      ? `Reenviou solicitação "${request.title}" após aplicar os ajustes solicitados.`
      : `Editou a solicitação de compra "${request.title}".`,
    details: { previous: previousState, current: request }
  })

  return res.json(request)
})

// TECHNICAL LEAD DECISION: Review / Approve / Reject / Request Adjustments
app.patch('/api/purchase-requests/:id/status', authenticateToken, requireRole(['technical_lead']), (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { status, reviewNotes, approvedAmount } = req.body as {
    status: PurchaseStatus
    reviewNotes?: string
    approvedAmount?: number
  }

  const request = db.purchaseRequests.find(p => p.id === id)
  if (!request) {
    return res.status(404).json({ error: 'Solicitação de compra não encontrada.' })
  }

  const validNextStatuses: PurchaseStatus[] = [
    'em_analise',
    'ajuste_solicitado',
    'aprovada',
    'rejeitada',
    'compra_em_andamento'
  ]

  if (!validNextStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status de avaliação inválido.' })
  }

  // Explicit justification rule
  if ((status === 'rejeitada' || status === 'ajuste_solicitado') && (!reviewNotes || !reviewNotes.trim())) {
    return res.status(400).json({
      error: `Para ${status === 'rejeitada' ? 'rejeitar' : 'solicitar ajustes em'} uma solicitação, é obrigatório registrar a justificativa técnica.`
    })
  }

  const previousStatus = request.status
  request.status = status
  request.reviewNotes = reviewNotes !== undefined ? reviewNotes.trim() : request.reviewNotes
  request.reviewedBy = req.user!.id
  request.reviewedByName = req.user!.name
  request.reviewedAt = new Date().toISOString()
  request.updatedAt = new Date().toISOString()

  if (status === 'aprovada') {
    request.approvedAmount = approvedAmount ? parseFloat(String(approvedAmount)) : request.estimatedTotal
    // Once approved, it can automatically transition to 'compra_em_andamento'
    request.status = 'compra_em_andamento'
  }

  db.save()

  const team = db.teams.find(t => t.id === request.teamId)

  let actionType: any = 'ANALISE_INICIADA'
  let actionDesc = `Alterou status para ${status}.`

  if (status === 'aprovada' || request.status === 'compra_em_andamento') {
    actionType = 'APROVOU_SOLICITACAO'
    actionDesc = `Aprovou a solicitação "${request.title}" no valor autorizado de R$ ${(request.approvedAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Transicionada para Compra em Andamento.`
  } else if (status === 'rejeitada') {
    actionType = 'REJEITOU_SOLICITACAO'
    actionDesc = `Rejeitou a solicitação "${request.title}". Motivo: "${reviewNotes}".`
  } else if (status === 'ajuste_solicitado') {
    actionType = 'SOLICITOU_AJUSTE'
    actionDesc = `Solicitou ajustes na solicitação "${request.title}". Observações: "${reviewNotes}".`
  } else if (status === 'em_analise') {
    actionType = 'ANALISE_INICIADA'
    actionDesc = `Iniciou a análise técnica da solicitação "${request.title}".`
  }

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    teamId: request.teamId,
    teamName: team ? team.name : null,
    action: actionType,
    entityType: 'purchase_request',
    entityId: request.id,
    description: actionDesc,
    details: { previousStatus, currentStatus: request.status, reviewNotes, approvedAmount: request.approvedAmount }
  })

  return res.json(request)
})

// COMPLETE PURCHASE: Register actual amount spent, attach invoice/receipt, create linked expense
app.post('/api/purchase-requests/:id/complete', authenticateToken, enforceTeamScope, (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { finalActualAmount, finalReceiptUrl, finalReceiptFileName, notes, supplier } = req.body

  const request = db.purchaseRequests.find(p => p.id === id)
  if (!request) {
    return res.status(404).json({ error: 'Solicitação de compra não encontrada.' })
  }

  if (req.user?.role === 'team_rep' && request.teamId !== req.user.teamId) {
    return res.status(403).json({ error: 'Acesso negado: solicitação de outra equipe.' })
  }

  if (!['compra_em_andamento', 'aprovada'].includes(request.status)) {
    return res.status(400).json({
      error: 'Apenas solicitações com status "compra_em_andamento" ou "aprovada" podem ser concluídas.'
    })
  }

  const parsedFinalAmount = parseFloat(finalActualAmount)
  if (isNaN(parsedFinalAmount) || parsedFinalAmount <= 0) {
    return res.status(400).json({ error: 'Informe o valor efetivamente pago (positivo).' })
  }

  const now = new Date().toISOString()
  const team = db.teams.find(t => t.id === request.teamId)

  // 1. Create the linked Expense so balance is debited now (NOT on approval)
  const linkedExpense = {
    id: `exp-${Date.now()}`,
    teamId: request.teamId,
    category: 'Peças e Componentes' as const,
    description: `[Conclusão de Solicitação] ${request.title}${notes ? ` - ${notes}` : ''}`,
    amount: parsedFinalAmount,
    expenseDate: now.slice(0, 10),
    supplier: supplier || 'Fornecedor da Compra',
    receiptUrl: finalReceiptUrl || null,
    receiptFileName: finalReceiptFileName || null,
    purchaseRequestId: request.id,
    createdBy: req.user!.id,
    createdByName: req.user!.name,
    createdAt: now,
    updatedAt: now
  }

  db.expenses.push(linkedExpense)

  // 2. Mark Purchase Request as 'concluida'
  request.status = 'concluida'
  request.finalActualAmount = parsedFinalAmount
  request.finalReceiptUrl = finalReceiptUrl || null
  request.finalReceiptFileName = finalReceiptFileName || null
  request.expenseId = linkedExpense.id
  request.updatedAt = now

  db.save()

  // 3. Log Audit
  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    teamId: request.teamId,
    teamName: team ? team.name : null,
    action: 'CONCLUIU_COMPRA',
    entityType: 'purchase_request',
    entityId: request.id,
    description: `Concluiu a compra de "${request.title}": valor estimado R$ ${request.estimatedTotal.toFixed(2)}, valor aprovado R$ ${(request.approvedAmount || 0).toFixed(2)}, valor efetivo pago R$ ${parsedFinalAmount.toFixed(2)}. Despesa lançada automaticamente.`,
    details: {
      estimatedTotal: request.estimatedTotal,
      approvedAmount: request.approvedAmount,
      finalActualAmount: parsedFinalAmount,
      expenseId: linkedExpense.id
    }
  })

  return res.json({
    message: 'Compra concluída com sucesso e despesa registrada.',
    purchaseRequest: request,
    expense: linkedExpense
  })
})

// ----------------------------------------------------
// AUDIT LOGS (HISTÓRICO)
// ----------------------------------------------------

app.get('/api/audit-logs', authenticateToken, enforceTeamScope, (req: AuthRequest, res: Response) => {
  const teamId = req.query.teamId as string
  let logs = db.auditLogs

  if (req.user?.role === 'team_rep') {
    logs = logs.filter(l => l.teamId === req.user!.teamId)
  } else if (teamId && teamId !== 'all') {
    logs = logs.filter(l => l.teamId === teamId)
  }

  return res.json(logs)
})

// ----------------------------------------------------
// ADMIN UTILITIES (Reset demo data)
// ----------------------------------------------------

app.post('/api/admin/reset-demo', authenticateToken, requireRole(['technical_lead']), (req: AuthRequest, res: Response) => {
  db.resetDemoData()

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    teamId: null,
    teamName: null,
    action: 'LOGIN',
    entityType: 'auth',
    entityId: req.user!.id,
    description: 'Redefiniu os dados do sistema para a demonstração inicial.'
  })

  return res.json({ message: 'Dados de demonstração redefinidos com sucesso!' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend do Portal de Transparência da Robótica rodando em http://localhost:${PORT}`)
})
