import React, { useState } from 'react'
import { Lock, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'

export const LoginView: React.FC = () => {
  const { login } = useAuth()
  const { showToast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      showToast('Preencha e-mail e senha.', 'error')
      return
    }

    try {
      setSubmitting(true)
      await login({ email, password })
      showToast('Login realizado com sucesso!', 'success')
    } catch (err: any) {
      showToast(err.message || 'Falha ao autenticar.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px 20px',
      position: 'relative'
    }}>
      <div style={{ width: '100%', maxWidth: '1050px' }}>
        {/* Header Hero */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ marginBottom: 18 }}>
            <img
              src="/logo-sesi.png"
              alt="SESI - Serviço Social da Indústria"
              style={{ height: 50, width: 'auto', objectFit: 'contain' }}
            />
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 20px',
            background: 'rgba(2, 132, 199, 0.08)',
            border: '1px solid rgba(2, 132, 199, 0.2)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--primary)',
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            marginBottom: 16
          }}>
            SISTEMA INTEGRADO DE PRESTAÇÃO DE CONTAS
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 12 }}>
            Portal de Transparência da Robótica
          </h1>
          <p style={{ maxWidth: 640, margin: '0 auto', fontSize: '1rem', color: 'var(--text-muted)' }}>
            Gestão transparente de recursos, patrocínios corporativos, controle rigoroso de despesas e aprovação de compras com auditoria contínua.
          </p>
        </div>

        <div style={{ maxWidth: 460, margin: '0 auto' }}>
          {/* Manual Login Form */}
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: 8 }}>
              Entrar com E-mail e Senha
            </h2>
            <p style={{ fontSize: '0.85rem', marginBottom: 20, color: 'var(--text-muted)' }}>
              Informe suas credenciais institucionais para prosseguir.
            </p>


            <form onSubmit={handleManualLogin}>
              <div className="form-group">
                <label className="form-label">E-mail Institucional</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: 42 }}
                    placeholder="seu.email@robotica.org"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Senha de Acesso</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: 42 }}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px 18px', marginTop: 10 }}
                disabled={submitting}
              >
                {submitting ? 'Autenticando...' : 'Acessar o Portal'}
              </button>
            </form>

            <div style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.775rem',
              color: 'var(--text-dim)',
              textAlign: 'center'
            }}>
              Ambiente protegido com criptografia de ponta a ponta e controle estrito de permissões.
            </div>

            <div style={{ marginTop: 14, textAlign: 'center' }}>
              <a
                href="/admin"
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-dim)',
                  textDecoration: 'none',
                  opacity: 0.5,
                  transition: 'opacity 0.15s'
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
              >
                ⚙ Painel Administrativo
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
