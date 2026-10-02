import React, { useState } from 'react'
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'

export const LoginView: React.FC = () => {
  const { login } = useAuth()
  const { showToast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
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
      padding: '40px 20px',
      position: 'relative',
      background: 'var(--bg-primary, #030712)'
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Header Hero */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ marginBottom: 20 }}>
            <img
              src="/logo-sesi.png"
              alt="SESI - Serviço Social da Indústria"
              style={{ height: 54, width: 'auto', objectFit: 'contain' }}
            />
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            background: 'rgba(2, 132, 199, 0.08)',
            border: '1px solid rgba(2, 132, 199, 0.2)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--primary)',
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            marginBottom: 14
          }}>
            <ShieldCheck size={14} /> SISTEMA INTEGRADO DE PRESTAÇÃO DE CONTAS
          </div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 10, letterSpacing: '-0.02em' }}>
            Portal de Transparência
          </h1>
          <p style={{ margin: '0 auto', fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Gestão transparente de recursos, patrocínios, compras e controle rigoroso de despesas das equipes de robótica.
          </p>
        </div>

        {/* Login Form Card */}
        <div className="card" style={{
          padding: '32px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--border-subtle)'
        }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: 6, fontWeight: 700 }}>
            Acesso ao Sistema
          </h2>
          <p style={{ fontSize: '0.85rem', marginBottom: 24, color: 'var(--text-muted)' }}>
            Informe suas credenciais institucionais para entrar.
          </p>

          <form onSubmit={handleManualLogin}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>E-mail Institucional</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: 42 }}
                  placeholder="seu.email@robotica.org"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Senha de Acesso</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: 42, paddingRight: 42 }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                  aria-label={showPass ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px 18px', fontWeight: 700, fontSize: '0.95rem' }}
              disabled={submitting}
            >
              {submitting ? 'Autenticando...' : 'Acessar o Portal'}
            </button>
          </form>

          <div style={{
            marginTop: 24,
            paddingTop: 18,
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.775rem',
            color: 'var(--text-dim)',
            textAlign: 'center'
          }}>
            Ambiente seguro com criptografia de ponta a ponta e controle estrito de permissões.
          </div>

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <a
              href="/admin"
              style={{
                fontSize: '0.8rem',
                color: 'var(--primary)',
                textDecoration: 'none',
                opacity: 0.85,
                fontWeight: 600,
                transition: 'opacity 0.15s'
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0.85')}
            >
              ⚙ Painel de Gestão e Administração
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
