import React, { useState } from 'react'
import {
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react'
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

  const handleQuickLogin = async (quickEmail: string, quickPass: string, roleName: string) => {
    try {
      setSubmitting(true)
      setEmail(quickEmail)
      setPassword(quickPass)
      await login({ email: quickEmail, password: quickPass })
      showToast(`Bem-vindo(a) como ${roleName}!`, 'success')
    } catch (err: any) {
      showToast(err.message || 'Falha ao autenticar.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const demoAccounts = [
    {
      role: 'Responsável Técnica (Supervisão)',
      name: 'Profª Dra. Marina Guimarães',
      desc: 'Supervisão Geral: Acompanha tudo de todas as equipes, extratos, auditoria e status de compras.',
      email: 'responsavel@robotica.org',
      pass: 'admin123',
      color: 'cyan',
      icon: ShieldCheck
    },
    {
      role: 'Técnico da Equipe (Titanium 4022)',
      name: 'Prof. Lucas Rocha (Técnico)',
      desc: 'Painel do Técnico: Analisa e aprova/rejeita compras solicitadas pelos alunos e gere receitas/despesas.',
      email: 'tecnico@robotica.org',
      pass: 'tecnico123',
      color: 'emerald',
      icon: UserCheck
    },
    {
      role: 'Aluno da Equipe (Titanium 4022)',
      name: 'Gabriel Menezes (Aluno)',
      desc: 'Painel do Aluno: Cria solicitações de compras com orçamentos e especificações para aprovação do técnico.',
      email: 'aluno@robotica.org',
      pass: 'aluno123',
      color: 'indigo',
      icon: GraduationCap
    },
    {
      role: 'Técnica CyberGears 810',
      name: 'Marina Duarte (Técnica)',
      desc: 'Acesso à equipe CyberGears 810 para aprovações e gestão técnica.',
      email: 'tecnico.cybergears@robotica.org',
      pass: 'tecnico123',
      color: 'amber',
      icon: UserCheck
    },
    {
      role: 'Aluno CyberGears 810',
      name: 'Beatriz Vasconcelos (Aluna)',
      desc: 'Acesso para solicitação de compras da equipe CyberGears 810.',
      email: 'aluno.cybergears@robotica.org',
      pass: 'aluno123',
      color: 'indigo',
      icon: GraduationCap
    }
  ]

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

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 28,
          alignItems: 'start'
        }}>
          {/* Left: Quick Access for Testing & Demonstration */}
          <div className="card" style={{ borderColor: 'var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Sparkles size={20} color="var(--primary)" />
              <h2 style={{ fontSize: '1.15rem', color: 'var(--text-main)' }}>Acesso Rápido de Demonstração</h2>
            </div>
            <p style={{ fontSize: '0.8125rem', marginBottom: 20, color: 'var(--text-muted)' }}>
              Clique em um dos perfis pré-configurados para explorar o sistema com permissões reais:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {demoAccounts.map(acc => {
                const Icon = acc.icon
                return (
                  <button
                    key={acc.email}
                    type="button"
                    className="btn btn-secondary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      textAlign: 'left',
                      height: 'auto',
                      borderRadius: 'var(--radius-md)'
                    }}
                    onClick={() => handleQuickLogin(acc.email, acc.pass, acc.role)}
                    disabled={submitting}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className={`stat-icon-wrapper ${acc.color}`} style={{ width: 34, height: 34 }}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                          {acc.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {acc.role}
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={16} color="var(--primary)" />
                  </button>
                )
              })}
            </div>

            <div style={{
              marginTop: 18,
              padding: 12,
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Info size={15} color="var(--primary)" />
              <span>Senhas padrão: <code>admin123</code> (Responsável Técnica) / <code>tecnico123</code> (Técnicos) / <code>aluno123</code> (Alunos).</span>
            </div>
          </div>

          {/* Right: Manual Login Form */}
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
