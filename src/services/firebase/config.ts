import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

// Configuracao do app web do Firebase.
//
// Esta configuracao e publica por natureza: ela vai embutida no bundle do
// navegador e qualquer pessoaconsegue extrair do site. Isso e esperado no
// Firebase SDK, e nao e um vazamento. A protecao dos dados vem das Firestore
// Security Rules (firestore.rules), que sao aplicadas no servidor do Firebase.
//
// Os valores podem ser sobrescritos por variaveis de ambiente VITE_FIREBASE_*,
// o que evita deixar o arquivo como fonte unica em outros ambientes.
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID

// O Firebase só é ativado se as credenciais forem explicitamente configuradas via .env
export const isFirebaseConfigured = Boolean(apiKey && projectId)

const firebaseConfig = {
  apiKey: apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: projectId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || ''
}

let app: FirebaseApp | null = null
let authInstance: Auth | null = null
let dbInstance: Firestore | null = null

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig)
    authInstance = getAuth(app)
    dbInstance = getFirestore(app)
  } catch (err) {
    console.warn('Falha ao inicializar Firebase SDK:', err)
  }
}

export const firebaseApp = app
export const auth = authInstance
export const db = dbInstance