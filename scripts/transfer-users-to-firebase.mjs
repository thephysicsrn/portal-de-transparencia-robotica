// Transferência de usuários para o Firebase Authentication + Firestore.
//
// Por que existe: as senhas atuais só existem como hash bcrypt, que é
// irreversível. O Firebase Auth exige a senha em texto puro ao criar a conta,
// então cada usuário transferido recebe uma senha provisória, que precisa ser
// trocada no primeiro acesso.
//
// Uso:
//   node scripts/transfer-users-to-firebase.mjs [--dry-run] [--file caminho.json]
//
// A credencial vem do .env (nunca do repositório). Ver .env.example.

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync, existsSync } from 'node:fs'
import { randomBytes } from 'node:crypto'

const TEMP_PASSWORD_PREFIX = 'Portal@'

function loadEnv() {
  if (!existsSync('.env')) return
  for (const rawLine of readFileSync('.env', 'utf8').split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

loadEnv()

function getAdminApp() {
  if (getApps().length) return getApps()[0]

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (raw) {
    const parsed = JSON.parse(raw)
    return initializeApp({ credential: cert(parsed), projectId: parsed.project_id })
  }
  if (projectId && clientEmail && privateKey) {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId })
  }
  throw new Error(
    'Credencial ausente. Defina FIREBASE_SERVICE_ACCOUNT (ou FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY) no arquivo .env.'
  )
}

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const fileArg = args.indexOf('--file')
const sourcePath = fileArg !== -1 ? args[fileArg + 1] : 'server/data/db.json'

if (!existsSync(sourcePath)) {
  console.error(`Arquivo de origem não encontrado: ${sourcePath}`)
  process.exit(1)
}

const source = JSON.parse(readFileSync(sourcePath, 'utf8'))
const users = Array.isArray(source.users) ? source.users : []

if (users.length === 0) {
  console.log('Nenhum usuário encontrado na origem.')
  process.exit(0)
}

console.log(`Origem: ${sourcePath}`)
console.log(`Usuários encontrados: ${users.length}`)
console.log(`Modo: ${dryRun ? 'simulação (nada será gravado)' : 'gravação real'}`)
console.log('---')

const tempPasswords = new Map()

if (dryRun) {
  users.forEach(u => console.log(`  ${u.email}  [${u.role}]  equipe=${u.teamId || '-'}`))
  console.log('\nSimulação concluída. Rode sem --dry-run para gravar.')
  process.exit(0)
}

const app = getAdminApp()
const authAdmin = getAuth(app)
const db = getFirestore(app)

let created = 0
let updated = 0
let skipped = 0
const failures = []

for (const user of users) {
  const email = String(user.email || '').trim().toLowerCase()
  const name = user.name || email.split('@')[0]
  const role = user.role
  const teamId = user.teamId || null

  if (!email || !role) {
    failures.push({ email, reason: 'sem e-mail ou sem papel' })
    continue
  }

  const temporaryPassword = TEMP_PASSWORD_PREFIX + randomBytes(4).toString('hex')

  try {
    let uid = null

    try {
      const existing = await authAdmin.getUserByEmail(email)
      uid = existing.uid
      await authAdmin.updateUser(uid, { password: temporaryPassword, displayName: name })
      updated++
    } catch (err) {
      if (err?.code === 'auth/user-not-found') {
        const createdUser = await authAdmin.createUser({
          email,
          password: temporaryPassword,
          displayName: name,
          emailVerified: false,
          disabled: false
        })
        uid = createdUser.uid
        created++
      } else {
        throw err
      }
    }

    // o id do documento é o uid do Auth: é o que as Security Rules usam para
    // amarrar o perfil à sessão, então os dois nunca podem divergir
    const ref = db.doc(`users/${uid}`)
    const snapshot = await ref.get()

    await ref.set({
      id: uid,
      name,
      email,
      role,
      teamId,
      title: user.title || '',
      createdAt: snapshot.exists ? (snapshot.data().createdAt ?? new Date().toISOString()) : new Date().toISOString(),
      migratedFrom: sourcePath
    }, { merge: true })

    tempPasswords.set(email, temporaryPassword)
    console.log(`  OK  ${email}  [${role}]  equipe=${teamId || '-'}  uid=${uid}`)
  } catch (err) {
    failures.push({ email, reason: err?.message || String(err) })
    console.error(`  ERRO ${email}: ${err?.message || err}`)
  }
}

console.log('---')
console.log(`Criados: ${created} | Atualizados: ${updated} | Falhas: ${failures.length}`)

if (tempPasswords.size > 0) {
  console.log('\nSenhas provisórias (trocar no primeiro acesso):')
  for (const [email, password] of tempPasswords) {
    console.log(`  ${email}  ->  ${password}`)
  }
  console.log('\nGuarde essa lista. Ela não é guardada em nenhum lugar.')
}

if (failures.length > 0) {
  console.log('\nFalhas:')
  for (const f of failures) console.log(`  ${f.email}: ${f.reason}`)
}

process.exit(0)