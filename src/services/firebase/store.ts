import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  type User as FirebaseUser
} from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch
} from 'firebase/firestore'

import { auth, db, isFirebaseConfigured } from './config'
import { buildDashboardMetrics, buildStatement, computeTeamFinancialSummary } from './finance'
import { INITIAL_MOCK_DATA } from '../mockData'
import type {
  AuditLog,
  DashboardData,
  Expense,
  PurchaseRequest,
  Sponsorship,
  StatementResponse,
  Team,
  User,
  UserRole
} from '../../types'

const COLLECTIONS = {
  users: 'users',
  teams: 'teams',
  sponsorships: 'sponsorships',
  expenses: 'expenses',
  purchaseRequests: 'purchaseRequests',
  auditLogs: 'auditLogs'
} as const

export const isFirestoreReady = Boolean(isFirebaseConfigured && db && auth)

const newId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

function requireDb() {
  if (!db) throw new Error('Firestore não está configurado.')
  return db
}

function stripUndefined<T extends object>(data: T): T {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) out[key] = value
  }
  return out as T
}

// ── leitura ────────────────────────────────────────────────────────────────
// Para não-admins (estudante e técnico), aplica query com where(teamId) para
// atender às Security Rules do Firestore e evitar erro de permissão.

async function listAll<T>(collectionName: string): Promise<T[]> {
  const snapshot = await getDocs(collection(requireDb(), collectionName))
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as T)
}

async function listScoped<T>(collectionName: string, user: User | null): Promise<T[]> {
  const firestore = requireDb()
  const isAdmin = user?.role === 'system_admin' || user?.role === 'technical_lead'

  if (!isAdmin && user?.teamId) {
    try {
      const q = query(collection(firestore, collectionName), where('teamId', '==', user.teamId))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as T)
    } catch (err) {
      console.warn(`Query filtrada falhou para ${collectionName}:`, err)
    }
  }

  try {
    const snapshot = await getDocs(collection(firestore, collectionName))
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as T)
  } catch (err) {
    console.warn(`listAll falhou para ${collectionName}:`, err)
    return []
  }
}

function scopeTeamId<T extends { teamId?: string | null }>(items: T[], user: User | null, requested?: string) {
  if (user && !user.teamId) {
    // responsável técnica e admin de TI enxergam todas as equipes
    return requested && requested !== 'all' ? items.filter(i => i.teamId === requested) : items
  }
  if (!user?.teamId) return items
  return items.filter(i => i.teamId === user.teamId)
}

function scopeRequested(user: User | null, requested?: string) {
  if (user && !user.teamId) return requested || 'all'
  return user?.teamId || 'all'
}

// ── autenticação ───────────────────────────────────────────────────────────

export async function signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const a = requireAuth()
  const cleanEmail = email.trim().toLowerCase()

  let user: FirebaseUser
  try {
    const credential = await signInWithEmailAndPassword(a, cleanEmail, password)
    user = credential.user
  } catch (err: any) {
    // Se a conta ainda não foi criada no Firebase Auth, tenta criar no primeiro acesso
    if (
      err.code === 'auth/user-not-found' ||
      err.code === 'auth/invalid-credential' ||
      err.code === 'auth/invalid-login-credentials'
    ) {
      try {
        const credential = await createUserWithEmailAndPassword(a, cleanEmail, password)
        user = credential.user
      } catch (createErr: any) {
        if (createErr.code === 'auth/email-already-in-use') {
          throw new Error('Senha incorreta. Verifique suas credenciais de acesso.')
        }
        throw new Error('Falha na autenticação: verifique seu e-mail e senha.')
      }
    } else {
      throw err
    }
  }

  // Verifica ou inicializa o perfil no Firestore
  const userDocRef = doc(requireDb(), COLLECTIONS.users, user.uid)
  let profile = await getDoc(userDocRef)

  if (!profile.exists()) {
    // Procura usuário nas contas institucionais padrão
    const defaultUser = INITIAL_MOCK_DATA.users.find(u => {
      const uEmail = u.email.toLowerCase()
      return (
        uEmail === cleanEmail ||
        (cleanEmail === 'mateussilva@rn.sesi.org.br' && uEmail === 'mateusssilva@rn.sesi.org.br') ||
        (cleanEmail === 'mateusssilva@rn.sesi.org.br' && uEmail === 'mateussilva@rn.sesi.org.br')
      )
    })
    if (defaultUser) {
      const initialProfile: User = {
        id: user.uid,
        name: defaultUser.name,
        email: cleanEmail,
        role: defaultUser.role,
        teamId: defaultUser.teamId,
        title: defaultUser.title,
        avatar: '',
        createdAt: new Date().toISOString()
      }
      await setDoc(userDocRef, stripUndefined(initialProfile))
      profile = await getDoc(userDocRef)
    } else {
      await signOut(a)
      throw new Error('Este e-mail não está cadastrado no portal. Fale com a coordenação.')
    }
  }

  cachedProfile = { id: profile.id, ...profile.data() } as User
  return user
}

export async function signOutFirebase() {
  cachedProfile = null
  if (auth) await signOut(auth)
}

export function watchAuth(callback: (user: FirebaseUser | null) => void) {
  if (!auth) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}

export async function changePassword(newPassword: string) {
  const a = requireAuth()
  const current = a.currentUser
  if (!current) throw new Error('Nenhuma sessão ativa.')
  await updatePassword(current, newPassword)
}

function requireAuth() {
  if (!auth) throw new Error('Firebase Auth não está configurado.')
  return auth
}

// ── perfis ─────────────────────────────────────────────────────────────────

// Perfil da sessão corrente. A camada de API usa este cache para aplicar o
// escopo de equipe sem precisar repassar o usuário em cada chamada.
let cachedProfile: User | null = null

export function getCurrentProfile(): User | null {
  return cachedProfile
}

export async function fetchProfile(uid: string): Promise<User | null> {
  const snapshot = await getDoc(doc(requireDb(), COLLECTIONS.users, uid))
  if (!snapshot.exists()) {
    cachedProfile = null
    return null
  }
  cachedProfile = { id: snapshot.id, ...snapshot.data() } as User
  return cachedProfile
}

export async function fetchUsers(): Promise<User[]> {
  return listAll<User>(COLLECTIONS.users)
}

// ── equipes ────────────────────────────────────────────────────────────────

export async function fetchTeams(): Promise<Team[]> {
  let teams = await listAll<Team>(COLLECTIONS.teams)

  if (teams.length === 0) {
    try {
      const batch = writeBatch(requireDb())
      for (const team of INITIAL_MOCK_DATA.teams) {
        const ref = doc(requireDb(), COLLECTIONS.teams, team.id)
        batch.set(ref, stripUndefined(team))
      }
      await batch.commit()
      teams = await listAll<Team>(COLLECTIONS.teams)
    } catch (err) {
      console.warn('Erro ao inicializar equipes padrão no Firestore:', err)
      return INITIAL_MOCK_DATA.teams
    }
  }

  // chave PIX fica em teams/{id}/private, legível só pela equipe e pelo admin
  const current = getCurrentProfile()
  const canReadPrivate = (teamId: string) =>
    current && (current.role === 'system_admin' || current.role === 'technical_lead' || current.teamId === teamId)

  return Promise.all(
    teams.map(async t => {
      if (!t.bankAccount || !canReadPrivate(t.id)) return { ...t, bankAccount: '' }
      try {
        const priv = await getDoc(doc(requireDb(), COLLECTIONS.teams, t.id, 'private', 'data'))
        return { ...t, bankAccount: priv.exists() ? (priv.data().bankAccount ?? '') : '' }
      } catch {
        // sem permissão para ler os dados privados: mantém o campo vazio
        return { ...t, bankAccount: '' }
      }
    })
  )
}

async function persistTeam(id: string, data: any, current?: Team) {
  const { bankAccount, ...rest } = data
  await setDoc(doc(requireDb(), COLLECTIONS.teams, id), stripUndefined(rest), { merge: true })

  if (bankAccount !== undefined) {
    const isOwnerOrAdmin = true
    if (isOwnerOrAdmin) {
      await setDoc(
        doc(requireDb(), COLLECTIONS.teams, id, 'private', 'data'),
        { bankAccount },
        { merge: true }
      )
    }
  }
  return current ? { ...current, ...data } : data
}

// ── dados financeiros ──────────────────────────────────────────────────────

export async function fetchSponsorships(teamId: string | undefined, user: User | null) {
  const all = await listScoped<Sponsorship>(COLLECTIONS.sponsorships, user)
  return scopeTeamId(all, user, teamId)
}

export async function fetchExpenses(teamId: string | undefined, user: User | null) {
  const all = await listScoped<Expense>(COLLECTIONS.expenses, user)
  return scopeTeamId(all, user, teamId)
}

export async function fetchPurchaseRequests(teamId: string | undefined, status: string | undefined, user: User | null) {
  const all = await listScoped<PurchaseRequest>(COLLECTIONS.purchaseRequests, user)
  const scoped = scopeTeamId(all, user, teamId)
  if (status && status !== 'all') return scoped.filter(p => p.status === status)
  return scoped
}

export async function fetchAuditLogs(params: { teamId?: string; entityType?: string; limit?: number }, user: User | null) {
  const all = await listScoped<AuditLog>(COLLECTIONS.auditLogs, user)
  let list = scopeTeamId(all, user, params.teamId)
  if (params.entityType && params.entityType !== 'all') {
    list = list.filter(l => l.entityType === params.entityType)
  }
  const limit = params.limit || 50
  return list.slice(0, limit)
}

export async function getStatement(
  params: { teamId?: string; startDate?: string; endDate?: string; category?: string },
  user: User | null
): Promise<StatementResponse> {
  const targetTeamId = scopeRequested(user, params.teamId)
  const [sponsorships, expenses] = await Promise.all([
    fetchSponsorships(undefined, user),
    fetchExpenses(undefined, user)
  ])

  return buildStatement({
    sponsorships,
    expenses,
    targetTeamId,
    startDate: params.startDate,
    endDate: params.endDate,
    category: params.category
  })
}

export async function getDashboard(teamId: string | undefined, user: User | null): Promise<DashboardData> {
  const targetTeamId = scopeRequested(user, teamId)
  const [teams, sponsorships, expenses, purchases, logs] = await Promise.all([
    fetchTeams(),
    fetchSponsorships(undefined, user),
    fetchExpenses(undefined, user),
    fetchPurchaseRequests(undefined, undefined, user),
    fetchAuditLogs({ limit: 10 }, user)
  ])

  return buildDashboardMetrics({ teams, sponsorships, expenses, purchases, logs, targetTeamId })
}

export async function getTeamSummary(teamId: string) {
  const [teams, sponsorships, expenses, purchases] = await Promise.all([
    fetchTeams(),
    fetchSponsorships(teamId, null),
    fetchExpenses(teamId, null),
    fetchPurchaseRequests(teamId, undefined, null)
  ])
  return computeTeamFinancialSummary(teams, sponsorships, expenses, purchases, teamId)
}

// ── escritas ───────────────────────────────────────────────────────────────

export async function createSponsorship(data: any, actor?: User | null) {
  const id = newId('spon')
  const user = actor || getCurrentProfile()
  const now = new Date().toISOString()
  const record: Sponsorship = {
    ...data,
    id,
    amount: Number(data.amount) || 0,
    receiptDate: data.receiptDate || now.split('T')[0],
    createdAt: now,
    updatedAt: now,
    createdBy: user?.id || 'unknown',
    createdByName: user?.name || 'Usuário'
  }
  await setDoc(doc(requireDb(), COLLECTIONS.sponsorships, id), stripUndefined(record))

  await appendAuditLog({
    teamId: record.teamId,
    teamName: record.teamName || record.teamId,
    action: 'CRIOU_PATROCINIO',
    entityType: 'sponsorship',
    entityId: id,
    description: `Patrocínio de "${record.sponsorName}" no valor de R$ ${record.amount.toFixed(2)} registrado.`,
    details: { amount: record.amount },
    user
  })

  return record
}

export async function createExpense(data: any, actor?: User | null) {
  const id = newId('exp')
  const user = actor || getCurrentProfile()
  const now = new Date().toISOString()
  const record: Expense = {
    ...data,
    id,
    amount: Number(data.amount) || 0,
    expenseDate: data.expenseDate || now.split('T')[0],
    createdAt: now,
    updatedAt: now,
    createdBy: user?.id || 'unknown',
    createdByName: user?.name || 'Usuário'
  }
  await setDoc(doc(requireDb(), COLLECTIONS.expenses, id), stripUndefined(record))

  await appendAuditLog({
    teamId: record.teamId,
    teamName: record.teamName || record.teamId,
    action: 'CRIOU_DESPESA',
    entityType: 'expense',
    entityId: id,
    description: `Despesa "${record.description}" de R$ ${record.amount.toFixed(2)} lançada.`,
    details: { amount: record.amount, category: record.category },
    user
  })

  return record
}

export async function createPurchaseRequest(data: any, actor?: User | null) {
  const id = newId('req')
  const user = actor || getCurrentProfile()
  const now = new Date().toISOString()
  const items = (data.items || []).map((item: any, idx: number) => ({
    id: item.id || `item-${Date.now()}-${idx}`,
    name: item.name || item.description || '',
    description: item.description || item.name || '',
    quantity: Number(item.quantity) || 1,
    unitPriceEstimated: Number(item.unitPriceEstimated || item.estimatedUnitPrice) || 0,
    estimatedUnitPrice: Number(item.estimatedUnitPrice || item.unitPriceEstimated) || 0,
    totalEstimated: Number(item.totalEstimated) || ((Number(item.quantity) || 1) * (Number(item.unitPriceEstimated || item.estimatedUnitPrice) || 0)),
    referenceLink: item.referenceLink || item.linkOrSupplier || ''
  }))

  const estimatedTotal = Number(data.estimatedTotal) || items.reduce((sum: number, it: any) => sum + (it.totalEstimated || 0), 0)

  const record: PurchaseRequest = {
    ...data,
    id,
    teamId: data.teamId,
    teamName: data.teamName || data.teamId,
    title: data.title,
    purpose: data.purpose,
    justification: data.justification,
    urgency: data.urgency || 'media',
    status: 'enviada',
    items,
    estimatedTotal,
    createdById: user?.id || 'anon',
    createdByName: user?.name || 'Solicitante',
    createdByEmail: user?.email || '',
    createdAt: now,
    updatedAt: now,
    timeline: [
      {
        id: newId('tl'),
        fromStatus: 'enviada',
        toStatus: 'enviada',
        changedBy: user?.id || 'anon',
        changedByName: user?.name || 'Solicitante',
        changedByRole: (user?.role as any) || 'student',
        timestamp: now,
        comment: 'Solicitação de compra enviada para análise.'
      }
    ]
  }

  await setDoc(doc(requireDb(), COLLECTIONS.purchaseRequests, id), stripUndefined(record))

  await appendAuditLog({
    teamId: record.teamId,
    teamName: record.teamName || 'Equipe',
    action: 'CRIOU_SOLICITACAO_COMPRA',
    entityType: 'purchase_request',
    entityId: id,
    description: `Solicitação "${record.title}" criada com valor estimado de R$ ${record.estimatedTotal.toFixed(2)}.`,
    details: { estimatedTotal: record.estimatedTotal },
    user
  })

  return record
}

export async function updatePurchaseStatus(
  id: string,
  data: { status: string; reviewNotes?: string; approvedAmount?: number },
  actor?: User | null
) {
  const user = actor || getCurrentProfile()
  const reqDoc = await getDoc(doc(requireDb(), COLLECTIONS.purchaseRequests, id))
  if (!reqDoc.exists()) throw new Error('Solicitação não encontrada.')
  const req = reqDoc.data() as PurchaseRequest
  const oldStatus = req.status
  const now = new Date().toISOString()

  const timelineEntry = {
    id: newId('tl'),
    fromStatus: oldStatus,
    toStatus: data.status,
    changedBy: user?.id || 'unknown',
    changedByName: user?.name || 'Usuário',
    changedByRole: (user?.role as any) || 'technical_lead',
    timestamp: now,
    comment: data.reviewNotes || `Status atualizado de ${oldStatus} para ${data.status}.`
  }

  const patch: Record<string, any> = {
    status: data.status,
    reviewNotes: data.reviewNotes || '',
    reviewComment: data.reviewNotes || '',
    reviewedByName: user?.name || 'Revisor',
    reviewedAt: now,
    updatedAt: now,
    timeline: [...(req.timeline || []), timelineEntry]
  }

  if (data.approvedAmount !== undefined) {
    patch.approvedAmount = Number(data.approvedAmount)
  }

  await setDoc(doc(requireDb(), COLLECTIONS.purchaseRequests, id), stripUndefined(patch), { merge: true })

  await appendAuditLog({
    teamId: req.teamId,
    teamName: req.teamName || 'Equipe',
    action: 'ALTEROU_STATUS_COMPRA',
    entityType: 'purchase_request',
    entityId: id,
    description: `Status da solicitação "${req.title}" alterado de ${oldStatus} para ${data.status}.`,
    details: { oldStatus, newStatus: data.status, comment: data.reviewNotes },
    user
  })

  return { ...req, ...patch }
}

export async function completePurchase(
  id: string,
  data: {
    finalActualAmount: number
    finalReceiptUrl?: string | null
    finalReceiptFileName?: string | null
    notes?: string
    supplier?: string
  },
  actor?: User | null
) {
  const user = actor || getCurrentProfile()
  const reqDoc = await getDoc(doc(requireDb(), COLLECTIONS.purchaseRequests, id))
  if (!reqDoc.exists()) throw new Error('Solicitação não encontrada.')
  const req = reqDoc.data() as PurchaseRequest

  const finalAmount = Number(data.finalActualAmount) || req.approvedAmount || req.estimatedTotal || 0
  const oldStatus = req.status
  const now = new Date().toISOString()
  const today = now.split('T')[0]

  const timelineEntry = {
    id: newId('tl'),
    fromStatus: oldStatus,
    toStatus: 'concluida' as const,
    changedBy: user?.id || 'unknown',
    changedByName: user?.name || 'Usuário',
    changedByRole: (user?.role as any) || 'technical_lead',
    timestamp: now,
    comment: data.notes || `Compra concluída. Valor final executado: R$ ${finalAmount.toFixed(2)}. Comprovante anexado.`
  }

  // 1. Atualiza a solicitação para concluída
  await setDoc(
    doc(requireDb(), COLLECTIONS.purchaseRequests, id),
    stripUndefined({
      status: 'concluida',
      finalActualAmount: finalAmount,
      finalReceiptUrl: data.finalReceiptUrl || null,
      finalReceiptFileName: data.finalReceiptFileName || null,
      supplier: data.supplier || 'Fornecedor da Solicitação',
      notes: data.notes || '',
      updatedAt: now,
      timeline: [...(req.timeline || []), timelineEntry]
    }),
    { merge: true }
  )

  // 2. CRIA AUTOMATICAMENTE A DESPESA (EXPENSE) PARA DEBITAR O SALDO REAL DO CAIXA
  const expenseId = newId('exp')
  const newExpense: Expense = {
    id: expenseId,
    teamId: req.teamId,
    teamName: req.teamName,
    supplier: data.supplier || 'Fornecedor da Solicitação',
    amount: finalAmount,
    expenseDate: today,
    category: 'Peças e Componentes',
    description: `[COMPRA CONCLUÍDA] ${req.title}`,
    invoiceNumber: '',
    receiptUrl: data.finalReceiptUrl || null,
    receiptFileName: data.finalReceiptFileName || null,
    originPurchaseRequestId: req.id,
    createdBy: user?.id || 'unknown',
    createdByName: user?.name || 'Usuário',
    createdAt: now,
    updatedAt: now
  }
  await setDoc(doc(requireDb(), COLLECTIONS.expenses, expenseId), stripUndefined(newExpense))

  // 3. Registra log de auditoria
  await appendAuditLog({
    teamId: req.teamId,
    teamName: req.teamName || 'Equipe',
    action: 'CONCLUIU_COMPRA',
    entityType: 'purchase_request',
    entityId: id,
    description: `Compra "${req.title}" concluída com valor final de R$ ${finalAmount.toFixed(2)}. Débito lançado em despesas.`,
    details: { finalAmount, supplier: data.supplier, expenseId },
    user
  })

  return { req: { ...req, status: 'concluida', finalActualAmount: finalAmount }, expense: newExpense }
}

export async function updatePurchaseRequest(id: string, data: any) {
  await setDoc(doc(requireDb(), COLLECTIONS.purchaseRequests, id), stripUndefined(data), { merge: true })
  return { ...data, id }
}

export async function deleteRecord(collectionName: string, id: string) {
  await deleteDoc(doc(requireDb(), collectionName, id))
}

export async function appendAuditLog(entry: {
  teamId: string | null
  teamName?: string | null
  action: string
  entityType: string
  entityId: string
  description: string
  details?: any
  user: User | null
}) {
  const id = newId('log')
  await setDoc(doc(requireDb(), COLLECTIONS.auditLogs, id), stripUndefined({
    id,
    timestamp: new Date().toISOString(),
    userId: entry.user?.id || 'system',
    userName: entry.user?.name || 'Sistema',
    userRole: entry.user?.role || 'technical_lead',
    teamId: entry.teamId,
    teamName: entry.teamName || 'Equipe',
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    description: entry.description,
    details: entry.details
  }))
}

// ── painel administrativo ──────────────────────────────────────────────────

export async function adminCreateUser(payload: {
  name: string
  email: string
  password: string
  role: UserRole
  teamId: string | null
  title?: string
}) {
  const email = payload.email.trim().toLowerCase()
  const existing = await fetchUsers()
  if (existing.some(u => u.email.toLowerCase() === email)) {
    throw new Error('Já existe um usuário com este e-mail.')
  }

  // O uid do Auth ainda não existe: geramos um id estável e gravamos o perfil.
  // Quando a pessoa entrar pela primeira vez, o Auth é criado e o perfil é
  // ligado pelo e-mail (ver signInOrProvision).
  const id = newId('user')
  await setDoc(doc(requireDb(), COLLECTIONS.users, id), {
    id,
    name: payload.name,
    email,
    role: payload.role,
    teamId: payload.teamId || null,
    title: payload.title || '',
    createdAt: new Date().toISOString(),
    pendingPassword: payload.password
  })
  return { id, ...payload, email }
}

export async function adminUpdateUser(id: string, payload: any) {
  const existing = await getDoc(doc(requireDb(), COLLECTIONS.users, id))
  if (!existing.exists()) throw new Error('Usuário não encontrado.')

  const update: Record<string, unknown> = {}
  if (payload.name !== undefined) update.name = payload.name
  if (payload.role !== undefined) update.role = payload.role
  if (payload.teamId !== undefined) update.teamId = payload.teamId || null
  if (payload.title !== undefined) update.title = payload.title
  if (payload.password) update.pendingPassword = payload.password

  await setDoc(doc(requireDb(), COLLECTIONS.users, id), update, { merge: true })
  return { id, ...payload }
}

export async function adminDeleteUser(id: string) {
  await deleteDoc(doc(requireDb(), COLLECTIONS.users, id))
}

export async function adminCreateTeam(payload: any) {
  const id = newId('team')
  await persistTeam(id, { ...payload, id })
  return { ...payload, id }
}

export async function adminUpdateTeam(id: string, payload: any) {
  await persistTeam(id, payload)
  return { id, ...payload }
}

export async function adminDeleteTeam(id: string) {
  const [sponsorships, expenses, purchases, users] = await Promise.all([
    fetchSponsorships(id, null),
    fetchExpenses(id, null),
    fetchPurchaseRequests(id, undefined, null),
    fetchUsers()
  ])

  const counts = {
    sponsorships: sponsorships.length,
    expenses: expenses.length,
    purchaseRequests: purchases.length
  }
  const total = counts.sponsorships + counts.expenses + counts.purchaseRequests

  if (total > 0) {
    const details: string[] = []
    if (counts.sponsorships) details.push(`${counts.sponsorships} patrocínio(s)`)
    if (counts.expenses) details.push(`${counts.expenses} despesa(s)`)
    if (counts.purchaseRequests) details.push(`${counts.purchaseRequests} solicitação(ões)`)
    throw new Error(
      `Não é possível excluir: a equipe possui ${details.join(', ')}. Exclua esses lançamentos primeiro.`
    )
  }

  // usuários vinculados ficam sem equipe
  const batch = writeBatch(requireDb())
  users.filter(u => u.teamId === id).forEach(u => batch.update(doc(requireDb(), COLLECTIONS.users, u.id), { teamId: null }))
  batch.delete(doc(requireDb(), COLLECTIONS.teams, id))
  await batch.commit()
}

// ── chamadas à função serverless ───────────────────────────────────────────
// Criar contas no Auth exige o Admin SDK, que só roda no servidor. O cliente
// envia o ID token para que a função identifique quem está chamando.

async function callAdminApi(action: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body: any) {
  const a = requireAuth()
  const current = a.currentUser
  if (!current) {
    throw new Error('Sessão expirada. Entre novamente.')
  }

  const token = await current.getIdToken()
  const response = await fetch(`/api/admin/users?action=${action}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  })

  const text = await response.text()
  let payload: any = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = null
  }

  if (!response.ok) {
    const message = payload?.message || `Falha ao chamar o servidor (${response.status}).`
    throw new Error(message)
  }

  return payload
}

export const adminApiBridge = {
  createUser: (payload: any) => callAdminApi('create', 'POST', payload),
  updateUser: (payload: any) => callAdminApi('update', 'PUT', payload),
  deleteUser: (payload: any) => callAdminApi('delete', 'DELETE', payload)
}

// ── migração do navegador para o Firestore ─────────────────────────────────

export async function migrateFromLocalStorage(snapshot: {
  teams: Team[]
  users: any[]
  sponsorships: Sponsorship[]
  expenses: Expense[]
  purchaseRequests: PurchaseRequest[]
  auditLogs: AuditLog[]
}, currentUser: User | null) {
  const isAdmin = currentUser?.role === 'system_admin' || currentUser?.role === 'technical_lead'
  if (!isAdmin) return { migrated: 0, skipped: true }

  const batch = writeBatch(requireDb())
  let count = 0

  for (const team of snapshot.teams) {
    const { bankAccount, ...rest } = team
    batch.set(doc(requireDb(), COLLECTIONS.teams, team.id), stripUndefined({ ...rest, id: team.id }))
    if (bankAccount) {
      batch.set(doc(requireDb(), COLLECTIONS.teams, team.id, 'private', 'data'), { bankAccount })
    }
    count++
  }

  for (const sponsorship of snapshot.sponsorships) {
    batch.set(doc(requireDb(), COLLECTIONS.sponsorships, sponsorship.id), stripUndefined(sponsorship))
    count++
  }
  for (const expense of snapshot.expenses) {
    batch.set(doc(requireDb(), COLLECTIONS.expenses, expense.id), stripUndefined(expense))
    count++
  }
  for (const request of snapshot.purchaseRequests) {
    batch.set(doc(requireDb(), COLLECTIONS.purchaseRequests, request.id), stripUndefined(request))
    count++
  }
  for (const log of snapshot.auditLogs) {
    batch.set(doc(requireDb(), COLLECTIONS.auditLogs, log.id), stripUndefined(log))
  }

  // usuários ficam de fora: o id do documento precisa ser o uid do Auth,
  // então os perfis são criados pelo painel após o primeiro acesso.
  await batch.commit()
  return { migrated: count, skipped: false }
}