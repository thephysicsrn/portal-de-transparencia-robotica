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
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAsqcLzCS-ni-H13LPq4u_UyahuEVzszw8',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'sesi-2e0fc.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sesi-2e0fc',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'sesi-2e0fc.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '594607525814',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:594607525814:web:12e4a301f6516ead8afb17',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://sesi-2e0fc-default-rtdb.firebaseio.com'
}

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

let app: FirebaseApp | null = null
let authInstance: Auth | null = null
let dbInstance: Firestore | null = null

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  authInstance = getAuth(app)
  dbInstance = getFirestore(app)
}

export const firebaseApp = app
export const auth = authInstance
export const db = dbInstance