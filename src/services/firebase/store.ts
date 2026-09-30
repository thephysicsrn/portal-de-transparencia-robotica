import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
  setDoc,
  writeBatch
} from 'firebase/firestore'

import { auth, db } from './config'
import { buildDashboardMetrics, buildStatement, computeTeamFinancialSummary } from './finance'
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

export const isFirestoreReady = Boolean(db && auth)

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
// As Security Rules ja filtram o que o usuário pode ler. A filtragem por
// equipe aqui é uma segunda barreira, para que a interface nunca exponha
// registro de outra equipe mesmo se as regras forem afrouxadas por engano.

async function listAll<T>(collectionName: string): Promise<T[]> {
  const snapshot = await getDocs(collection(requireDb(), collectionName))
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as T)
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
  const credential = await signInWithEmailAndPassword(a, email.trim().toLowerCase(), password)

  // O cadastro da conta no Firebase Authentication é criado no primeiro login,
  // usando a senha que o administrador definiu no painel. O perfil e as
  // permissões vivem no documento do Firestore.
  const profile = await getDoc(doc(requireDb(), COLLECTIONS.users, credential.user.uid))
  if (!profile.exists()) {
    await signOut(a)
    throw new Error('Este e-mail não está cadastrado no portal. Fale com o administrador.')
  }
  return credential.user
}

export async function signInOrProvision(email: string, password: string): Promise<FirebaseUser> {
  const a = requireAuth()
  const normalized = email.trim().toLowerCase()
  try {
    return await signInWithEmail(normalized, password)
  } catch (err: any) {
    const code = err?.code
    if (code !== 'auth/invalid-credential' && code !== 'auth/user-not-found' && code !== 'auth/wrong-password') {
      throw err
    }
  }

  // Primeira entrada: cria a conta no Auth. O documento de perfil precisa
  // existir, senão as regras negam qualquer leitura.
  const pendingEmail = email.trim().toLowerCase()
  const probe = await getDocs(collection(requireDb(), COLLECTIONS.users))
  const match = probe.docs.find(d => (d.data().email || '').toLowerCase() === pendingEmail)
  if (!match) {
    throw new Error('Este e-mail não está cadastrado no portal. Fale com o administrador.')
  }

  const created = await createUserWithEmailAndPassword(a, pendingEmail, password)
  return created.user
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
  const teams = await listAll<Team>(COLLECTIONS.teams)

  // chave PIX fica em teams/{id}/private, legível só pela equipe e pelo admin
  return Promise.all(
    teams.map(async t => {
      if (!t.bankAccount) return t
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
  const all = await listAll<Sponsorship>(COLLECTIONS.sponsorships)
  return scopeTeamId(all, user, teamId)
}

export async function fetchExpenses(teamId: string | undefined, user: User | null) {
  const all = await listAll<Expense>(COLLECTIONS.expenses)
  return scopeTeamId(all, user, teamId)
}

export async function fetchPurchaseRequests(teamId: string | undefined, status: string | undefined, user: User | null) {
  const all = await listAll<PurchaseRequest>(COLLECTIONS.purchaseRequests)
  const scoped = scopeTeamId(all, user, teamId)
  if (status && status !== 'all') return scoped.filter(p => p.status === status)
  return scoped
}

export async function fetchAuditLogs(params: { teamId?: string; entityType?: string; limit?: number }, user: User | null) {
  const all = await listAll<AuditLog>(COLLECTIONS.auditLogs)
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

export async function createSponsorship(data: any) {
  const id = newId('spon')
  await setDoc(doc(requireDb(), COLLECTIONS.sponsorships, id), stripUndefined({ ...data, id }))
  return { ...data, id }
}

export async function createExpense(data: any) {
  const id = newId('exp')
  await setDoc(doc(requireDb(), COLLECTIONS.expenses, id), stripUndefined({ ...data, id }))
  return { ...data, id }
}

export async function createPurchaseRequest(data: any) {
  const id = newId('req')
  await setDoc(doc(requireDb(), COLLECTIONS.purchaseRequests, id), stripUndefined({ ...data, id }))
  return { ...data, id }
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
  teamName: string
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
    teamName: entry.teamName,
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