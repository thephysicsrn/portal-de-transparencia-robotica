import React, { useState } from 'react'
import {
  Lock,
  Mail,
  Sparkles,
  ArrowRight,
  Crown,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Info,
  Eye,
  EyeOff
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

  const handleQuickLogin = async (targetEmail: string, targetPass: string, roleName: string) => {
    setEmail(targetEmail)
    setPassword(targetPass)
    try {
      setSubmitting(true)
      await login({ email: targetEmail, password: targetPass })
      showToast(`Conectado como ${roleName}!`, 'success')
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
      desc: 'Visão global, aprovação final de compras e relatórios consolidados.',
      email: 'responsavel@robotica.org',
      pass: 'admin123',
      color: 'cyan',
      icon: Crown
    },
    {
      role: 'Administrador de TI',
      name: 'Equipe de Sistemas & TI',
      desc: 'Gestão completa de acessos, equipes e configurações globais.',
      email: 'ti@robotica.org',
      pass: 'ti123',
      color: 'purple',
      icon: ShieldCheck
    },
    {
      role: 'Técnico / Mentor Titanium 4022',
      name: 'Prof. Lucas Rocha (FRC)',
      desc: 'Aprovações técnicas e controle orçamentário da Titanium 4022.',
      email: 'tecnico@robotica.org',
      pass: 'tecnico123',
      color: 'emerald',
      icon: UserCheck
    },
    {
      role: 'Aluno Solicitante Titanium 4022',
      name: 'Gabriel Menezes (FRC)',
      desc: 'Criação e acompanhamento de solicitações de compras de peças.',
      email: 'aluno@robotica.org',
      pass: 'aluno123',
      color: 'blue',
      icon: GraduationCap
    },
    {
      role: 'Técnica CyberGears 810',
      name: 'Marina Duarte (FTC)',
      desc: 'Gestão técnica e financeira da equipe CyberGears 810.',
      email: 'tecnico.cybergears@robotica.org',
      pass: 'tecnico123',
      color: 'emerald',
      icon: UserCheck
    },
    {
      role: 'Representante Titanium 4022 (Equipe)',
      name: 'Titanium 4022 (Acesso Direto)',
      desc: 'Acesso simplificado de equipe (senha padrão de equipe).',
      email: 'titanium@robotica.org',
      pass: 'equipe123',
      color: 'amber',
      icon: UserCheck
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
      <div style={{ width: '100%', maxWidth: '1080px' }}>
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 28,
          alignItems: 'start'
        }}>
          {/* Left: Quick Access for Testing & Demonstration */}
          <div className="card" style={{ borderColor: 'var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Sparkles size={20} color="var(--primary)" />
              <h2 style={{ fontSize: '1.15rem', color: 'var(--text-main)' }}>Acesso Rápido com 1 Clique</h2>
            </div>
            <p style={{ fontSize: '0.8125rem', marginBottom: 20, color: 'var(--text-muted)' }}>
              Selecione um dos perfis pré-configurados para entrar instantaneamente no sistema com permissões reais:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                      padding: '10px 14px',
                      textAlign: 'left',
                      height: 'auto',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      border: '1px solid var(--border-subtle)',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => handleQuickLogin(acc.email, acc.pass, acc.role)}
                    disabled={submitting}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className={`stat-icon-wrapper ${acc.color}`} style={{ width: 34, height: 34, flexShrink: 0 }}>
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
              <Info size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
              <span>Senhas: <code>admin123</code> (Técnica) | <code>ti123</code> (TI) | <code>tecnico123</code> (Técnico) | <code>aluno123</code> (Aluno) | <code>equipe123</code> (Equipe).</span>
            </div>
          </div>

          {/* Right: Manual Login Form */}
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: 8 }}>
              Entrar com E-mail e Senha
            </h2>
            <p style={{ fontSize: '0.85rem', marginBottom: 20, color: 'var(--text-muted)' }}>
              Informe suas credenciais para autenticar no banco de dados.
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
                    type={showPass ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingLeft: 42, paddingRight: 42 }}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
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
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
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
              Ambiente protegido com tokens JWT, senhas Bcrypt e persistência contínua.
            </div>

            <div style={{ marginTop: 14, textAlign: 'center' }}>
              <a
                href="/admin"
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  textDecoration: 'none',
                  opacity: 0.7,
                  transition: 'opacity 0.15s'
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
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
