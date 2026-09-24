import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import { DatabaseSchema, User, Team, Sponsorship, Expense, PurchaseRequest, AuditLog } from './types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.resolve(__dirname, 'data')
const DB_FILE = path.join(DATA_DIR, 'db.json')


if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const UPLOADS_DIR = path.resolve(__dirname, '..', 'uploads')
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

function getDefaultDatabase(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10)
  const adminPassword = bcrypt.hashSync('admin123', salt)
  const repPassword = bcrypt.hashSync('equipe123', salt)

  const teams: Team[] = [
    {
      id: 'team-1',
      name: 'Titanium 4022',
      code: 'TITAN-4022',
      category: 'FRC - FIRST Robotics Competition',
      institution: 'Centro de Tecnologia e Inovação SESI/SENAI',
      description: 'Equipe de robótica competitiva categoria avançada FRC de 50kg.',
      bankAccount: 'Banco do Brasil - Ag: 1234-5 | CC: 98765-4 (PIX: financeiro@titanium4022.org)',
      leaderName: 'Prof. Lucas Rocha',
      createdAt: '2026-01-10T10:00:00.000Z'
    },
    {
      id: 'team-2',
      name: 'CyberGears 810',
      code: 'CYBER-810',
      category: 'FTC - FIRST Tech Challenge',
      institution: 'Instituto Federal de Educação Tecnológica',
      description: 'Desenvolvimento de robôs móveis autônomos e teleoperados com visão computacional.',
      bankAccount: 'Caixa Econômica - Ag: 4321 | CC: 56789-0 (PIX: rep@cybergears.edu.br)',
      leaderName: 'Marina Duarte',
      createdAt: '2026-01-15T14:30:00.000Z'
    },
    {
      id: 'team-3',
      name: 'SparkBots 105',
      code: 'SPARK-105',
      category: 'FLL - FIRST Lego League',
      institution: 'Escola SESI de Educação Básica',
      description: 'Iniciação científica e robótica educacional para jovens talentos.',
      bankAccount: 'Bradesco - Ag: 0987 | CC: 12345-6 (PIX: sparkbots@fiern.org.br)',
      leaderName: 'Renato Sales',
      createdAt: '2026-02-01T09:00:00.000Z'
    }
  ]

  const users: User[] = [
    {
      id: 'user-tech-lead',
      name: 'Profª Dra. Marina Guimarães',
      email: 'responsavel@robotica.org',
      passwordHash: adminPassword,
      role: 'technical_lead',
      teamId: null,
      title: 'Responsável Técnica & Gestora de Projetos',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-01T08:00:00.000Z'
    },
    {
      id: 'user-rep-titanium',
      name: 'Gabriel Menezes',
      email: 'titanium@robotica.org',
      passwordHash: repPassword,
      role: 'team_rep',
      teamId: 'team-1',
      title: 'Capitão e Líder Financeiro Titanium 4022',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-11T11:00:00.000Z'
    },
    {
      id: 'user-rep-cybergears',
      name: 'Beatriz Vasconcelos',
      email: 'cybergears@robotica.org',
      passwordHash: repPassword,
      role: 'team_rep',
      teamId: 'team-2',
      title: 'Representante Financeira CyberGears 810',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-16T15:00:00.000Z'
    },
    {
      id: 'user-rep-sparkbots',
      name: 'Felipe Alencar',
      email: 'sparkbots@robotica.org',
      passwordHash: repPassword,
      role: 'team_rep',
      teamId: 'team-3',
      title: 'Representante SparkBots 105',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-02-02T10:00:00.000Z'
    }
  ]

  const sponsorships: Sponsorship[] = [
    {
      id: 'spon-1',
      teamId: 'team-1',
      sponsorName: 'MetalTech Usinagens de Precisão',
      amount: 18500.00,
      receiptDate: '2026-02-05',
      purpose: 'Aquisição de perfis de alumínio aeronáutico e caixas de transmissão',
      notes: 'Contrato de patrocínio Master temporada 2026. Comprovante de TED anexado.',
      receiptUrl: '/uploads/demo-recibo-patrocinio-metaltech.pdf',
      receiptFileName: 'TED-Comprovante-Metaltech-18500.pdf',
      createdBy: 'user-rep-titanium',
      createdByName: 'Gabriel Menezes',
      createdAt: '2026-02-05T14:22:00.000Z',
      updatedAt: '2026-02-05T14:22:00.000Z'
    },
    {
      id: 'spon-2',
      teamId: 'team-1',
      sponsorName: 'InovaSoft Sistemas',
      amount: 7200.00,
      receiptDate: '2026-02-18',
      purpose: 'Subsídio para eletrônica e sensores LiDaR',
      notes: 'Repasse via PIX institucional direto para a conta da equipe.',
      receiptUrl: '/uploads/demo-recibo-patrocinio-inovasoft.pdf',
      receiptFileName: 'PIX-InovaSoft-7200.pdf',
      createdBy: 'user-rep-titanium',
      createdByName: 'Gabriel Menezes',
      createdAt: '2026-02-18T16:10:00.000Z',
      updatedAt: '2026-02-18T16:10:00.000Z'
    },
    {
      id: 'spon-3',
      teamId: 'team-2',
      sponsorName: 'AutoPeças & Motores Brasil',
      amount: 9800.00,
      receiptDate: '2026-02-10',
      purpose: 'Inscrição na etapa regional e kit de motores REV Robotics',
      notes: 'Patrocínio Ouro categoria FTC.',
      receiptUrl: '/uploads/demo-recibo-autopecas.pdf',
      receiptFileName: 'Comprovante-AutoPecas-9800.pdf',
      createdBy: 'user-rep-cybergears',
      createdByName: 'Beatriz Vasconcelos',
      createdAt: '2026-02-10T10:05:00.000Z',
      updatedAt: '2026-02-10T10:05:00.000Z'
    },
    {
      id: 'spon-4',
      teamId: 'team-3',
      sponsorName: 'Associação de Pais e Apoiadores da Robótica',
      amount: 4500.00,
      receiptDate: '2026-02-25',
      purpose: 'Compra de tapetes oficiais de missão e transporte para o torneio',
      notes: 'Arrecadação de rifa e doações diretas registradas com recibo assinado.',
      receiptUrl: '/uploads/demo-recibo-associacao-pais.pdf',
      receiptFileName: 'Recibo-Campanha-Pais-4500.pdf',
      createdBy: 'user-rep-sparkbots',
      createdByName: 'Felipe Alencar',
      createdAt: '2026-02-25T11:40:00.000Z',
      updatedAt: '2026-02-25T11:40:00.000Z'
    }
  ]

  const expenses: Expense[] = [
    {
      id: 'exp-1',
      teamId: 'team-1',
      category: 'Peças e Componentes',
      description: 'Lote de 6x Motores brushless e cabos de sinal siliconados',
      amount: 4320.00,
      expenseDate: '2026-02-20',
      supplier: 'RoboCore Tecnologia Ltda',
      receiptUrl: '/uploads/demo-nf-robocore-4320.pdf',
      receiptFileName: 'NF-e-5491-RoboCore.pdf',
      purchaseRequestId: 'pr-1',
      createdBy: 'user-rep-titanium',
      createdByName: 'Gabriel Menezes',
      createdAt: '2026-02-20T17:15:00.000Z',
      updatedAt: '2026-02-20T17:15:00.000Z'
    },
    {
      id: 'exp-2',
      teamId: 'team-1',
      category: 'Ferramentas e Usinagem',
      description: 'Jogo de brocas HSS de precisão e fresas de topo para CNC',
      amount: 850.50,
      expenseDate: '2026-02-22',
      supplier: 'Ferragens & Ferramentas São Jorge',
      receiptUrl: '/uploads/demo-cupom-ferramentas.pdf',
      receiptFileName: 'NFC-e-88123-Ferramentas.pdf',
      purchaseRequestId: null,
      createdBy: 'user-rep-titanium',
      createdByName: 'Gabriel Menezes',
      createdAt: '2026-02-22T09:30:00.000Z',
      updatedAt: '2026-02-22T09:30:00.000Z'
    },
    {
      id: 'exp-3',
      teamId: 'team-2',
      category: 'Inscrições e Torneios',
      description: 'Taxa de inscrição oficial Regional FTC 2026',
      amount: 2500.00,
      expenseDate: '2026-02-15',
      supplier: 'FIRST Brasil / SESI Nacional',
      receiptUrl: '/uploads/demo-comprovante-inscricao-ftc.pdf',
      receiptFileName: 'Boleto-Quitado-Inscricao-FTC.pdf',
      purchaseRequestId: null,
      createdBy: 'user-rep-cybergears',
      createdByName: 'Beatriz Vasconcelos',
      createdAt: '2026-02-15T13:45:00.000Z',
      updatedAt: '2026-02-15T13:45:00.000Z'
    },
    {
      id: 'exp-4',
      teamId: 'team-3',
      category: 'Marketing e Uniformes',
      description: 'Camisetas personalizadas da equipe e crachás para a arena',
      amount: 780.00,
      expenseDate: '2026-02-28',
      supplier: 'Estamparia Arte & Cores',
      receiptUrl: '/uploads/demo-recibo-uniformes.pdf',
      receiptFileName: 'Recibo-Quitacao-Uniformes-780.pdf',
      purchaseRequestId: null,
      createdBy: 'user-rep-sparkbots',
      createdByName: 'Felipe Alencar',
      createdAt: '2026-02-28T14:10:00.000Z',
      updatedAt: '2026-02-28T14:10:00.000Z'
    }
  ]

  const purchaseRequests: PurchaseRequest[] = [
    {
      id: 'pr-1',
      teamId: 'team-1',
      title: 'Motores Brushless de Alta Performance para o Chassi',
      items: [
        {
          id: 'item-101',
          name: 'Motor Brushless NEO 550 com redutor planetary',
          quantity: 6,
          unitPriceEstimated: 750.00,
          totalEstimated: 4500.00,
          referenceLink: 'https://www.andymark.com/products/neo-550'
        }
      ],
      estimatedTotal: 4500.00,
      purpose: 'Substituição dos motores antigos com folga para tração do chassi swerve drive.',
      justification: 'A temporada atual exige velocidade e torque 30% superiores. Os motores atuais atingiram a vida útil limite.',
      urgency: 'alta',
      status: 'concluida',
      reviewNotes: 'Aprovado após análise técnica. Material essencial para a estabilidade da tração.',
      approvedAmount: 4500.00,
      reviewedBy: 'user-tech-lead',
      reviewedByName: 'Profª Dra. Marina Guimarães',
      reviewedAt: '2026-02-19T10:00:00.000Z',
      finalActualAmount: 4320.00,
      finalReceiptUrl: '/uploads/demo-nf-robocore-4320.pdf',
      finalReceiptFileName: 'NF-e-5491-RoboCore.pdf',
      expenseId: 'exp-1',
      createdBy: 'user-rep-titanium',
      createdByName: 'Gabriel Menezes',
      createdAt: '2026-02-18T14:00:00.000Z',
      updatedAt: '2026-02-20T17:15:00.000Z'
    },
    {
      id: 'pr-2',
      teamId: 'team-1',
      title: 'Câmera com Inteligência Artificial Limelight 3G para Alinhamento Autônomo',
      items: [
        {
          id: 'item-201',
          name: 'Câmera de Visão Limelight 3G com retroreflective tracking',
          quantity: 1,
          unitPriceEstimated: 3200.00,
          totalEstimated: 3200.00,
          referenceLink: 'https://limelightvision.io'
        }
      ],
      estimatedTotal: 3200.00,
      purpose: 'Identificação autônoma de april tags na arena e cálculo de odometria.',
      justification: 'Permite pontuação máxima no período autônomo de 15 segundos da partida regional.',
      urgency: 'alta',
      status: 'compra_em_andamento',
      reviewNotes: 'Aprovado pelo comitê técnico. Aguardando finalização da importação e nota fiscal.',
      approvedAmount: 3200.00,
      reviewedBy: 'user-tech-lead',
      reviewedByName: 'Profª Dra. Marina Guimarães',
      reviewedAt: '2026-02-21T11:30:00.000Z',
      finalActualAmount: null,
      finalReceiptUrl: null,
      finalReceiptFileName: null,
      expenseId: null,
      createdBy: 'user-rep-titanium',
      createdByName: 'Gabriel Menezes',
      createdAt: '2026-02-20T18:00:00.000Z',
      updatedAt: '2026-02-21T11:30:00.000Z'
    },
    {
      id: 'pr-3',
      teamId: 'team-1',
      title: 'Placas de Policarbonato Compacto 4mm para Blindagem de Mecanismo',
      items: [
        {
          id: 'item-301',
          name: 'Chapa de Policarbonato Cristal 2000x1000x4mm',
          quantity: 2,
          unitPriceEstimated: 650.00,
          totalEstimated: 1300.00,
          referenceLink: 'https://exemplo.com.br/policarbonato'
        }
      ],
      estimatedTotal: 1300.00,
      purpose: 'Proteção contra colisões e isolamento dos componentes pneumáticos.',
      justification: 'Exigência mandatória de segurança da inspeção oficial da FIRST.',
      urgency: 'media',
      status: 'enviada',
      reviewNotes: null,
      approvedAmount: null,
      reviewedBy: null,
      reviewedByName: null,
      reviewedAt: null,
      finalActualAmount: null,
      finalReceiptUrl: null,
      finalReceiptFileName: null,
      expenseId: null,
      createdBy: 'user-rep-titanium',
      createdByName: 'Gabriel Menezes',
      createdAt: '2026-03-01T09:15:00.000Z',
      updatedAt: '2026-03-01T09:15:00.000Z'
    },
    {
      id: 'pr-4',
      teamId: 'team-2',
      title: 'Sensores de Distância a Laser ToF (Time-of-Flight)',
      items: [
        {
          id: 'item-401',
          name: 'Sensor Laser ToF 2m I2C Rev Robotics',
          quantity: 4,
          unitPriceEstimated: 220.00,
          totalEstimated: 880.00,
          referenceLink: 'https://www.revrobotics.com/rev-31-1505/'
        }
      ],
      estimatedTotal: 880.00,
      purpose: 'Detecção de obstáculos e posicionamento preciso nas estações de carregamento.',
      justification: 'Melhora da precisão na manobra em baixa visibilidade.',
      urgency: 'media',
      status: 'ajuste_solicitado',
      reviewNotes: 'Por favor, inclua 3 orçamentos comparativos de distribuidores nacionais para verificar prazo de entrega antes da aprovação.',
      approvedAmount: null,
      reviewedBy: 'user-tech-lead',
      reviewedByName: 'Profª Dra. Marina Guimarães',
      reviewedAt: '2026-02-26T15:20:00.000Z',
      finalActualAmount: null,
      finalReceiptUrl: null,
      finalReceiptFileName: null,
      expenseId: null,
      createdBy: 'user-rep-cybergears',
      createdByName: 'Beatriz Vasconcelos',
      createdAt: '2026-02-24T16:00:00.000Z',
      updatedAt: '2026-02-26T15:20:00.000Z'
    },
    {
      id: 'pr-5',
      teamId: 'team-3',
      title: 'Baterias Recarregáveis Li-Po e Carregador Balanceador Inteligente',
      items: [
        {
          id: 'item-501',
          name: 'Bateria Li-Po 2S 7.4V 2200mAh',
          quantity: 4,
          unitPriceEstimated: 140.00,
          totalEstimated: 560.00,
          referenceLink: 'https://lojamodelismo.com.br/bateria-lipo-2s'
        },
        {
          id: 'item-502',
          name: 'Carregador Digital Balanceador IMAX B6 V2',
          quantity: 1,
          unitPriceEstimated: 350.00,
          totalEstimated: 350.00,
          referenceLink: 'https://lojamodelismo.com.br/imax-b6'
        }
      ],
      estimatedTotal: 910.00,
      purpose: 'Alimentação contínua nas baterias de treino sem interrupção de ciclo.',
      justification: 'As baterias atuais descarregam em menos de 10 minutos de teste.',
      urgency: 'alta',
      status: 'em_analise',
      reviewNotes: 'Solicitação em conferência pelo comitê técnico.',
      approvedAmount: null,
      reviewedBy: 'user-tech-lead',
      reviewedByName: 'Profª Dra. Marina Guimarães',
      reviewedAt: '2026-03-02T10:10:00.000Z',
      finalActualAmount: null,
      finalReceiptUrl: null,
      finalReceiptFileName: null,
      expenseId: null,
      createdBy: 'user-rep-sparkbots',
      createdByName: 'Felipe Alencar',
      createdAt: '2026-03-01T14:40:00.000Z',
      updatedAt: '2026-03-02T10:10:00.000Z'
    }
  ]

  const auditLogs: AuditLog[] = [
    {
      id: 'log-1',
      timestamp: '2026-02-05T14:22:00.000Z',
      userId: 'user-rep-titanium',
      userName: 'Gabriel Menezes',
      userRole: 'team_rep',
      teamId: 'team-1',
      teamName: 'Titanium 4022',
      action: 'CRIOU_PATROCINIO',
      entityType: 'sponsorship',
      entityId: 'spon-1',
      description: 'Registrou patrocínio de R$ 18.500,00 da MetalTech Usinagens com comprovante.'
    },
    {
      id: 'log-2',
      timestamp: '2026-02-18T14:00:00.000Z',
      userId: 'user-rep-titanium',
      userName: 'Gabriel Menezes',
      userRole: 'team_rep',
      teamId: 'team-1',
      teamName: 'Titanium 4022',
      action: 'CRIOU_SOLICITACAO_COMPRA',
      entityType: 'purchase_request',
      entityId: 'pr-1',
      description: 'Enviou solicitação de compra para Motores Brushless (estimado R$ 4.500,00).'
    },
    {
      id: 'log-3',
      timestamp: '2026-02-19T10:00:00.000Z',
      userId: 'user-tech-lead',
      userName: 'Profª Dra. Marina Guimarães',
      userRole: 'technical_lead',
      teamId: 'team-1',
      teamName: 'Titanium 4022',
      action: 'APROVOU_SOLICITACAO',
      entityType: 'purchase_request',
      entityId: 'pr-1',
      description: 'Aprovou a solicitação de Motores Brushless no valor de R$ 4.500,00 com parecer técnico.'
    },
    {
      id: 'log-4',
      timestamp: '2026-02-20T17:15:00.000Z',
      userId: 'user-rep-titanium',
      userName: 'Gabriel Menezes',
      userRole: 'team_rep',
      teamId: 'team-1',
      teamName: 'Titanium 4022',
      action: 'CONCLUIU_COMPRA',
      entityType: 'purchase_request',
      entityId: 'pr-1',
      description: 'Concluiu compra de Motores Brushless: valor efetivo de R$ 4.320,00 registrado com NF-e gerando a despesa exp-1.'
    },
    {
      id: 'log-5',
      timestamp: '2026-02-21T11:30:00.000Z',
      userId: 'user-tech-lead',
      userName: 'Profª Dra. Marina Guimarães',
      userRole: 'technical_lead',
      teamId: 'team-1',
      teamName: 'Titanium 4022',
      action: 'APROVOU_SOLICITACAO',
      entityType: 'purchase_request',
      entityId: 'pr-2',
      description: 'Aprovou solicitação da Câmera Limelight 3G (R$ 3.200,00) que transitou para compra em andamento.'
    },
    {
      id: 'log-6',
      timestamp: '2026-02-26T15:20:00.000Z',
      userId: 'user-tech-lead',
      userName: 'Profª Dra. Marina Guimarães',
      userRole: 'technical_lead',
      teamId: 'team-2',
      teamName: 'CyberGears 810',
      action: 'SOLICITOU_AJUSTE',
      entityType: 'purchase_request',
      entityId: 'pr-4',
      description: 'Solicitou ajustes na solicitação de Sensores ToF: requisição de 3 orçamentos comparativos.'
    },
    {
      id: 'log-7',
      timestamp: '2026-03-01T09:15:00.000Z',
      userId: 'user-rep-titanium',
      userName: 'Gabriel Menezes',
      userRole: 'team_rep',
      teamId: 'team-1',
      teamName: 'Titanium 4022',
      action: 'CRIOU_SOLICITACAO_COMPRA',
      entityType: 'purchase_request',
      entityId: 'pr-3',
      description: 'Enviou solicitação de compra de Placas de Policarbonato no valor estimado de R$ 1.300,00.'
    },
    {
      id: 'log-8',
      timestamp: '2026-03-02T10:10:00.000Z',
      userId: 'user-tech-lead',
      userName: 'Profª Dra. Marina Guimarães',
      userRole: 'technical_lead',
      teamId: 'team-3',
      teamName: 'SparkBots 105',
      action: 'ANALISE_INICIADA',
      entityType: 'purchase_request',
      entityId: 'pr-5',
      description: 'Iniciou análise técnica detalhada da solicitação de Baterias Li-Po e Carregador Balanceador.'
    }
  ]

  return {
    users,
    teams,
    sponsorships,
    expenses,
    purchaseRequests,
    auditLogs
  }
}

class Database {
  private data: DatabaseSchema

  constructor() {
    this.data = this.load()
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8')
        return JSON.parse(raw)
      }
    } catch (e) {
      console.error('Erro ao ler banco de dados. Recriando padrão.', e)
    }

    const defaultDb = getDefaultDatabase()
    this.saveData(defaultDb)
    return defaultDb
  }

  private saveData(data: DatabaseSchema) {
    const tempFile = `${DB_FILE}.tmp`
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8')
    fs.renameSync(tempFile, DB_FILE)
  }

  public save() {
    this.saveData(this.data)
  }

  public resetDemoData() {
    this.data = getDefaultDatabase()
    this.save()
    return this.data
  }

  public get users() { return this.data.users }
  public get teams() { return this.data.teams }
  public get sponsorships() { return this.data.sponsorships }
  public get expenses() { return this.data.expenses }
  public get purchaseRequests() { return this.data.purchaseRequests }
  public get auditLogs() { return this.data.auditLogs }

  public logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry
    }
    this.data.auditLogs.unshift(newLog)
    this.save()
    return newLog
  }

  public getTeamFinancialSummary(teamId: string): TeamFinancialSummary | null {
    const team = this.teams.find(t => t.id === teamId)
    if (!team) return null

    const teamSponsorships = this.sponsorships.filter(s => s.teamId === teamId)
    const teamExpenses = this.expenses.filter(e => e.teamId === teamId)
    const teamPurchases = this.purchaseRequests.filter(p => p.teamId === teamId)

    const totalReceived = teamSponsorships.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
    const totalSpent = teamExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
    const currentBalance = totalReceived - totalSpent

    const inProgressPurchases = teamPurchases.filter(p => p.status === 'compra_em_andamento')
    const inProgressPurchasesCount = inProgressPurchases.length
    const inProgressPurchasesApprovedTotal = inProgressPurchases.reduce(
      (acc, curr) => acc + (Number(curr.approvedAmount || curr.estimatedTotal) || 0),
      0
    )

    const pendingRequests = teamPurchases.filter(p => 
      p.status === 'enviada' || p.status === 'em_analise' || p.status === 'ajuste_solicitado'
    )
    const pendingRequestsCount = pendingRequests.length

    return {
      teamId: team.id,
      teamName: team.name,
      category: team.category,
      totalReceived,
      totalSpent,
      currentBalance,
      inProgressPurchasesCount,
      inProgressPurchasesApprovedTotal,
      pendingRequestsCount
    }
  }

  public getAllTeamsFinancialSummary(): TeamFinancialSummary[] {
    return this.teams.map(team => this.getTeamFinancialSummary(team.id)!)
  }
}

export const db = new Database()
