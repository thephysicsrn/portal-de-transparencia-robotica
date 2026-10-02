import type { User, Team, Sponsorship, Expense, PurchaseRequest, AuditLog } from "../types"

export interface ClientDatabase {
  users: User[]
  teams: Team[]
  sponsorships: Sponsorship[]
  expenses: Expense[]
  purchaseRequests: PurchaseRequest[]
  auditLogs: AuditLog[]
}

const COACH_PASSWORD_HASH = "$2b$10$7fknagUbhDt3QHmhOf3G2u3NlRSKsldkQ.q5C4twKamLWKInfy0R6" // tecnico@2026
const STUDENT_PASSWORD_HASH = "$2b$10$NdmwES7b8iySK4oCH.PZAeauVbtqTvfRiRDdr9zjfPa9nG4pKPzb2" // aluno@2026

export const INITIAL_MOCK_DATA: ClientDatabase = {
  teams: [
    {
      id: "team-batlego",
      name: "BATLEGO",
      code: "BAT-FLL",
      category: "FLL - FIRST Lego League",
      institution: "SESI RN",
      description: "Equipe de robótica da categoria FLL (FIRST Lego League) do SESI RN.",
      bankAccount: "SESI RN / BATLEGO",
      leaderName: "Mateus Zeca Bezerra da Silva",
      createdAt: "2026-02-01T10:00:00.000Z"
    },
    {
      id: "team-guarani",
      name: "GUARANI",
      code: "GUA-FLL",
      category: "FLL - FIRST Lego League",
      institution: "SESI RN",
      description: "Equipe de robótica da categoria FLL (FIRST Lego League) do SESI RN.",
      bankAccount: "SESI RN / GUARANI",
      leaderName: "Sheyla de Paula Cardoso",
      createdAt: "2026-02-01T10:00:00.000Z"
    },
    {
      id: "team-carcara-lux",
      name: "CARCARÁ LUX",
      code: "CAR-SR",
      category: "STEAM RACING",
      institution: "SESI RN",
      description: "Equipe de robótica e automobilismo educacional categoria STEAM RACING.",
      bankAccount: "SESI RN / CARCARÁ LUX",
      leaderName: "Zania Christina Feitosa Lobo Gomes",
      createdAt: "2026-02-01T10:00:00.000Z"
    },
    {
      id: "team-p0t1bat",
      name: "P0T1BAT",
      code: "POT-FRC",
      category: "FRC - FIRST Robotics Competition",
      institution: "SESI RN",
      description: "Equipe avançada de robótica industrial competitiva FRC de 50kg.",
      bankAccount: "SESI RN / P0T1BAT",
      leaderName: "Terciano Fonseca de Souza",
      createdAt: "2026-02-01T10:00:00.000Z"
    },
    {
      id: "team-jovens-punares",
      name: "JOVENS PUNARÉS",
      code: "PUN-FLL",
      category: "FLL - FIRST Lego League",
      institution: "SESI RN",
      description: "Equipe de robótica da categoria FLL (FIRST Lego League) do SESI RN.",
      bankAccount: "SESI RN / JOVENS PUNARÉS",
      leaderName: "Paulo Cesar Palhares de Lima",
      createdAt: "2026-02-01T10:00:00.000Z"
    },
    {
      id: "team-techno-sertao",
      name: "TECHNO SERTÃO",
      code: "TEC-FLL",
      category: "FLL - FIRST Lego League",
      institution: "SESI RN",
      description: "Equipe de robótica da categoria FLL (FIRST Lego League) do SESI RN.",
      bankAccount: "SESI RN / TECHNO SERTÃO",
      leaderName: "Micael Silva dos Santos",
      createdAt: "2026-02-01T10:00:00.000Z"
    }
  ],
  users: [
    {
      id: "user-system-admin",
      name: "Administrador de TI",
      email: "ti@robotica.org",
      passwordHash: "$2b$10$.PINbwShVtmqNMQJd3qH8.1UPB9.oa4/Sf49UiHmdFmwVXgCdAEXm", // ti123
      role: "system_admin",
      teamId: null,
      title: "Administrador do Sistema & TI",
      avatar: "",
      createdAt: "2026-01-01T07:00:00.000Z"
    },
    {
      id: "user-tech-lead",
      name: "Laysa Guimarães",
      email: "gilmaraguimaraes@rn.sesi.org.br",
      passwordHash: "$2b$10$9rm2GXuP88cSc96lWFVGOei.3rDB0ehdu3ni2762g7ztlp0bsPIPW", // admin123
      role: "technical_lead",
      teamId: null,
      title: "Responsável Técnica & Supervisora Geral",
      avatar: "",
      createdAt: "2026-01-01T08:00:00.000Z"
    },
    // BATLEGO
    {
      id: "user-coach-batlego",
      name: "Mateus Zeca Bezerra da Silva",
      email: "mateusssilva@rn.sesi.org.br",
      passwordHash: COACH_PASSWORD_HASH,
      role: "team_coach",
      teamId: "team-batlego",
      title: "Técnico - BATLEGO",
      avatar: "",
      createdAt: "2026-02-01T10:00:00.000Z"
    },
    {
      id: "user-student-batlego",
      name: "Enio Josias de Melo",
      email: "enio.melo@rn.aluno.sesi.org.br",
      passwordHash: STUDENT_PASSWORD_HASH,
      role: "student",
      teamId: "team-batlego",
      title: "Representante Estudantil - BATLEGO",
      avatar: "",
      createdAt: "2026-02-01T10:00:00.000Z"
    },
    // GUARANI
    {
      id: "user-coach-guarani",
      name: "Sheyla de Paula Cardoso",
      email: "sheylaferreira@rn.sesi.org.br",
      passwordHash: COACH_PASSWORD_HASH,
      role: "team_coach",
      teamId: "team-guarani",
      title: "Técnica - GUARANI",
      avatar: "",
      createdAt: "2026-02-01T10:00:00.000Z"
    },
    {
      id: "user-student-guarani",
      name: "Angélica Pinheiro",
      email: "angelica.pinheiro@rn.aluno.sesi.org.br",
      passwordHash: STUDENT_PASSWORD_HASH,
      role: "student",
      teamId: "team-guarani",
      title: "Representante Estudantil - GUARANI",
      avatar: "",
      createdAt: "2026-02-01T10:00:00.000Z"
    },
    // CARCARÁ LUX
    {
      id: "user-coach-carcara-lux",
      name: "Zania Christina Feitosa Lobo Gomes",
      email: "zaniagomes@rn.sesi.org.br",
      passwordHash: COACH_PASSWORD_HASH,
      role: "team_coach",
      teamId: "team-carcara-lux",
      title: "Técnica - CARCARÁ LUX",
      avatar: "",
      createdAt: "2026-02-01T10:00:00.000Z"
    },
    {
      id: "user-student-carcara-lux",
      name: "Maria Vitória Mariano Jales",
      email: "maria.mariano@rn.aluno.sesi.org.br",
      passwordHash: STUDENT_PASSWORD_HASH,
      role: "student",
      teamId: "team-carcara-lux",
      title: "Representante Estudantil - CARCARÁ LUX",
      avatar: "",
      createdAt: "2026-02-01T10:00:00.000Z"
    },
    // P0T1BAT
    {
      id: "user-coach-p0t1bat",
      name: "Terciano Fonseca de Souza",
      email: "tercianosouza@rn.sesi.org.br",
      passwordHash: COACH_PASSWORD_HASH,
      role: "team_coach",
      teamId: "team-p0t1bat",
      title: "Técnico - P0T1BAT",
      avatar: "",
      createdAt: "2026-02-01T10:00:00.000Z"
    },
    {
      id: "user-student-p0t1bat",
      name: "Julia Letícia Da Silva Aguiar",
      email: "julia.aguiar@rn.aluno.sesi.org.br",
      passwordHash: STUDENT_PASSWORD_HASH,
      role: "student",
      teamId: "team-p0t1bat",
      title: "Representante Estudantil - P0T1BAT",
      avatar: "",
      createdAt: "2026-02-01T10:00:00.000Z"
    },
    // JOVENS PUNARÉS
    {
      id: "user-coach-jovens-punares",
      name: "Paulo Cesar Palhares de Lima",
      email: "paulolima@rn.sesi.org.br",
      passwordHash: COACH_PASSWORD_HASH,
      role: "team_coach",
      teamId: "team-jovens-punares",
      title: "Técnico - JOVENS PUNARÉS",
      avatar: "",
      createdAt: "2026-02-01T10:00:00.000Z"
    },
    {
      id: "user-student-jovens-punares",
      name: "Heitor Guedes Santos da Silva",
      email: "heitorguedessantosdasilva@gmail.com",
      passwordHash: STUDENT_PASSWORD_HASH,
      role: "student",
      teamId: "team-jovens-punares",
      title: "Representante Estudantil - JOVENS PUNARÉS",
      avatar: "",
      createdAt: "2026-02-01T10:00:00.000Z"
    },
    // TECHNO SERTÃO
    {
      id: "user-coach-techno-sertao",
      name: "Micael Silva dos Santos",
      email: "micaelsantos@rn.sesi.org.br",
      passwordHash: COACH_PASSWORD_HASH,
      role: "team_coach",
      teamId: "team-techno-sertao",
      title: "Técnico - TECHNO SERTÃO",
      avatar: "",
      createdAt: "2026-02-01T10:00:00.000Z"
    },
    {
      id: "user-student-techno-sertao",
      name: "Lara Silva",
      email: "lara.silva@rn.aluno.sesi.org.br",
      passwordHash: STUDENT_PASSWORD_HASH,
      role: "student",
      teamId: "team-techno-sertao",
      title: "Representante Estudantil - TECHNO SERTÃO",
      avatar: "",
      createdAt: "2026-02-01T10:00:00.000Z"
    }
  ],
  sponsorships: [],
  expenses: [],
  purchaseRequests: [],
  auditLogs: [
    {
      id: "log-init",
      timestamp: "2026-10-02T20:53:00.000Z",
      userId: "user-system-admin",
      userName: "Sistema de Transparência",
      userRole: "system_admin",
      teamId: null,
      teamName: null,
      action: "SISTEMA_INICIALIZADO",
      entityType: "team",
      entityId: "root",
      description: "Equipes reais do SESI RN e contas de técnicos e alunos cadastradas com sucesso."
    }
  ]
}
