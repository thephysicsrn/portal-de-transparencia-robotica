import { initializeApp, cert, getApps, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Função serverless para administração de contas.
//
// Criar usuários no Firebase Authentication exige o Admin SDK, que roda
// apenas no servidor. O documento de perfil em users/{uid} é criado junto, para
// que o id do documento e o uid do Auth sejam sempre o mesmo valor — é isso que
// as Security Rules usam para amarrar o perfil à sessão.

const ADMIN_ROLES = ['system_admin', 'technical_lead']
const VALID_ROLES = ['system_admin', 'technical_lead', 'team_coach', 'student']

function getAdminApp(): App {
  if (getApps().length) return getApps()[0]

  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (rawServiceAccount) {
    const parsed = JSON.parse(rawServiceAccount)
    return initializeApp({ credential: cert(parsed), projectId: parsed.project_id })
  }

  if (projectId && clientEmail && privateKey) {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId })
  }

  throw new Error(
    'Credenciais do Firebase ausentes. Configure FIREBASE_SERVICE_ACCOUNT ou FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY.'
  )
}

const db = () => getFirestore(getAdminApp())
const authAdmin = () => getAuth(getAdminApp())

async function requireAdmin(req: VercelRequest, res: VercelResponse) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''

  if (!token) {
    res.status(401).json({ message: 'Sessão ausente.' })
    return null
  }

  let uid: string
  try {
    const decoded = await authAdmin().verifyIdToken(token)
    uid = decoded.uid
  } catch {
    res.status(401).json({ message: 'Sessão inválida ou expirada. Entre novamente.' })
    return null
  }

  const profile = await db().doc(`users/${uid}`).get()
  if (!profile.exists) {
    res.status(403).json({ message: 'Perfil não encontrado no Firestore.' })
    return null
  }

  const role = profile.data()?.role
  if (!ADMIN_ROLES.includes(role)) {
    res.status(403).json({ message: 'Apenas a responsável técnica e o administrador de TI podemmanageir usuários.' })
    return null
  }

  return { uid, role }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET,POST,PUT,PATCH,DELETE')
    return res.status(204).end()
  }

  try {
    const admin = await requireAdmin(req, res)
    if (!admin) return

    const action = String(req.query.action || '')

    if (req.method === 'POST' && action === 'create') {
      const { name, email, password, role, teamId, title } = req.body || {}

      if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Nome, e-mail, senha e papel são obrigatórios.' })
      }
      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ message: 'Papel inválido.' })
      }
      if (String(password).length < 6) {
        return res.status(400).json({ message: 'A senha precisa ter ao menos 6 caracteres.' })
      }
      if ((role === 'team_coach' || role === 'student') && !teamId) {
        return res.status(400).json({ message: 'Técnicos e alunos precisam estar vinculados a uma equipe.' })
      }

      const normalized = String(email).trim().toLowerCase()

      // e-mail já existente no Auth ou no Firestore
      const existing = await db().collection('users').where('email', '==', normalized).limit(1).get()
      if (!existing.empty) {
        return res.status(409).json({ message: 'Já existe um usuário com este e-mail.' })
      }

      let userRecord
      try {
        userRecord = await authAdmin().createUser({
          email: normalized,
          password,
          displayName: name,
          emailVerified: false,
          disabled: false
        })
      } catch (err: any) {
        if (err?.code === 'auth/email-already-exists') {
          return res.status(409).json({ message: 'Já existe uma conta com este e-mail no Firebase Authentication.' })
        }
        throw err
      }

      // o id do documento é o uid do Auth: é o que as regras usam para amarrar
      // o perfil à sessão, então nunca podem divergir
      await db().doc(`users/${userRecord.uid}`).set({
        id: userRecord.uid,
        name,
        email: normalized,
        role,
        teamId: teamId || null,
        title: title || '',
        createdAt: new Date().toISOString()
      })

      return res.status(201).json({ id: userRecord.uid, name, email: normalized, role, teamId: teamId || null, title: title || '' })
    }

    if ((req.method === 'PUT' || req.method === 'PATCH') && action === 'update') {
      const { id, name, role, teamId, title, password } = req.body || {}
      if (!id) return res.status(400).json({ message: 'Id do usuário é obrigatório.' })
      if (role && !VALID_ROLES.includes(role)) {
        return res.status(400).json({ message: 'Papel inválido.' })
      }

      const ref = db().doc(`users/${id}`)
      const snapshot = await ref.get()
      if (!snapshot.exists) return res.status(404).json({ message: 'Usuário não encontrado.' })

      const update: Record<string, unknown> = {}
      if (name !== undefined) update.name = name
      if (role !== undefined) update.role = role
      if (teamId !== undefined) update.teamId = teamId || null
      if (title !== undefined) update.title = title

      if (Object.keys(update).length) {
        await ref.update(update)
      }

      if (password) {
        if (String(password).length < 6) {
          return res.status(400).json({ message: 'A senha precisa ter ao menos 6 caracteres.' })
        }
        try {
          await authAdmin().updateUser(id, { password })
        } catch (err: any) {
          if (err?.code === 'auth/user-not-found') {
            return res.status(404).json({ message: 'Conta não encontrada no Firebase Authentication.' })
          }
          throw err
        }
      }

      return res.status(200).json({ id, ...update })
    }

    if (req.method === 'DELETE' && action === 'delete') {
      const { id } = req.body || {}
      if (!id) return res.status(400).json({ message: 'Id do usuário é obrigatório.' })
      if (id === admin.uid) {
        return res.status(400).json({ message: 'Você não pode excluir a própria conta.' })
      }

      const ref = db().doc(`users/${id}`)
      const snapshot = await ref.get()
      if (!snapshot.exists) return res.status(404).json({ message: 'Usuário não encontrado.' })

      // remove o perfil e a conta do Auth; lançamento financeiro antigo é
      // preservado, porque o histórico precisa continuar auditável
      await ref.delete()
      try {
        await authAdmin().deleteUser(id)
      } catch (err: any) {
        if (err?.code !== 'auth/user-not-found') throw err
      }

      return res.status(200).json({ message: 'Usuário excluído com sucesso.' })
    }

    return res.status(404).json({ message: 'Ação não reconhecida.' })
  } catch (err: any) {
    console.error('admin/users error', err)
    return res.status(500).json({ message: err?.message || 'Erro interno ao gerenciar usuários.' })
  }
}