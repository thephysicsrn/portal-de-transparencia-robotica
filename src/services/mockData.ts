import type { User, Team, Sponsorship, Expense, PurchaseRequest, AuditLog } from "../types"

export interface ClientDatabase {
  users: User[]
  teams: Team[]
  sponsorships: Sponsorship[]
  expenses: Expense[]
  purchaseRequests: PurchaseRequest[]
  auditLogs: AuditLog[]
}

export const INITIAL_MOCK_DATA: ClientDatabase = {
  users: [
    {
      id: "user-tech-lead",
      name: "Profª Dra. Marina Guimarães",
      email: "responsavel@robotica.org",
      passwordHash: "$2b$10$9rm2GXuP88cSc96lWFVGOei.3rDB0ehdu3ni2762g7ztlp0bsPIPW", // admin123
      role: "technical_lead",
      teamId: null,
      title: "Responsável Técnica & Supervisora Geral",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      createdAt: "2026-01-01T08:00:00.000Z"
    },
    {
      id: "user-coach-titanium",
      name: "Prof. Lucas Rocha",
      email: "tecnico@robotica.org",
      passwordHash: "$2b$10$FnUE/I.REZ5nsv40ZCQfG.Q1Er9M.D5By4TeMbYftSZe0PetL5e66", // tecnico123
      role: "team_coach",
      teamId: "team-1",
      title: "Técnico / Mentor Titanium 4022",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      createdAt: "2026-01-10T09:00:00.000Z"
    },
    {
      id: "user-student-titanium",
      name: "Gabriel Menezes",
      email: "aluno@robotica.org",
      passwordHash: "$2b$10$f38o2FS3BtyLAHNjfjTDFuSF7sK.2JNfFpjBw/odJe4y4YoOnxZfC", // aluno123
      role: "student",
      teamId: "team-1",
      title: "Aluno & Solicitante Titanium 4022",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      createdAt: "2026-01-11T11:00:00.000Z"
    },
    {
      id: "user-coach-cybergears",
      name: "Marina Duarte",
      email: "tecnico.cybergears@robotica.org",
      passwordHash: "$2b$10$FnUE/I.REZ5nsv40ZCQfG.Q1Er9M.D5By4TeMbYftSZe0PetL5e66",
      role: "team_coach",
      teamId: "team-2",
      title: "Técnica CyberGears 810",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
      createdAt: "2026-01-15T09:00:00.000Z"
    },
    {
      id: "user-student-cybergears",
      name: "Beatriz Vasconcelos",
      email: "aluno.cybergears@robotica.org",
      passwordHash: "$2b$10$f38o2FS3BtyLAHNjfjTDFuSF7sK.2JNfFpjBw/odJe4y4YoOnxZfC",
      role: "student",
      teamId: "team-2",
      title: "Aluna CyberGears 810",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      createdAt: "2026-01-16T15:00:00.000Z"
    },
    {
      id: "user-coach-sparkbots",
      name: "Renato Sales",
      email: "tecnico.sparkbots@robotica.org",
      passwordHash: "$2b$10$FnUE/I.REZ5nsv40ZCQfG.Q1Er9M.D5By4TeMbYftSZe0PetL5e66",
      role: "team_coach",
      teamId: "team-3",
      title: "Técnico SparkBots 105",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      createdAt: "2026-02-01T09:00:00.000Z"
    },
    {
      id: "user-student-sparkbots",
      name: "Felipe Alencar",
      email: "aluno.sparkbots@robotica.org",
      passwordHash: "$2b$10$f38o2FS3BtyLAHNjfjTDFuSF7sK.2JNfFpjBw/odJe4y4YoOnxZfC",
      role: "student",
      teamId: "team-3",
      title: "Aluno SparkBots 105",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      createdAt: "2026-02-02T10:00:00.000Z"
    }
  ],
  teams: [
    {
      id: "team-1",
      name: "Titanium 4022",
      code: "TITAN-4022",
      category: "FRC - FIRST Robotics Competition",
      institution: "Centro de Tecnologia e Inovação SESI/SENAI",
      description: "Equipe de robótica competitiva categoria avançada FRC de 50kg.",
      bankAccount: "Banco do Brasil - Ag: 1234-5 | CC: 98765-4 (PIX: financeiro@titanium4022.org)",
      leaderName: "Prof. Lucas Rocha",
      createdAt: "2026-01-10T10:00:00.000Z"
    },
    {
      id: "team-2",
      name: "CyberGears 810",
      code: "CYBER-810",
      category: "FTC - FIRST Tech Challenge",
      institution: "Instituto Federal de Educação Tecnológica",
      description: "Desenvolvimento de robôs móveis autônomos e teleoperados com visão computacional.",
      bankAccount: "Caixa Econômica - Ag: 4321 | CC: 56789-0 (PIX: rep@cybergears.edu.br)",
      leaderName: "Marina Duarte",
      createdAt: "2026-01-15T14:30:00.000Z"
    },
    {
      id: "team-3",
      name: "SparkBots 105",
      code: "SPARK-105",
      category: "FLL - FIRST Lego League",
      institution: "Escola SESI de Educação Básica",
      description: "Iniciação científica e robótica educacional para jovens talentos.",
      bankAccount: "Bradesco - Ag: 0987 | CC: 12345-6 (PIX: sparkbots@fiern.org.br)",
      leaderName: "Renato Sales",
      createdAt: "2026-02-01T09:00:00.000Z"
    }
  ],
  sponsorships: [],
  expenses: [],
  purchaseRequests: [],
  auditLogs: [
    {
      id: "log-init",
      timestamp: new Date().toISOString(),
      userId: "system",
      userName: "Sistema de Transparência",
      userRole: "technical_lead",
      teamId: null,
      teamName: null,
      action: "SISTEMA_INICIALIZADO",
      entityType: "team",
      entityId: "root",
      description: "Base de dados limpa com sucesso. Pronto para inserção dos dados originais da robótica."
    }
  ]
}
