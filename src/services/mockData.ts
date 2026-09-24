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
  "users": [
    {
      "id": "user-tech-lead",
      "name": "Profª Dra. Marina Guimarães",
      "email": "responsavel@robotica.org",
      "passwordHash": "$2b$10$l1TnuUlQWCMNaeEwGTFpwe6kr7fHX0EyEWd.dfMaa8S303CPT0FRO",
      "role": "technical_lead",
      "teamId": null,
      "title": "Responsável Técnica & Gestora de Projetos",
      "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      "createdAt": "2026-01-01T08:00:00.000Z"
    },
    {
      "id": "user-rep-titanium",
      "name": "Gabriel Menezes",
      "email": "titanium@robotica.org",
      "passwordHash": "$2b$10$l1TnuUlQWCMNaeEwGTFpweuvSvI9rPMk4xULDEin.n7l2RPiKTaqi",
      "role": "team_rep",
      "teamId": "team-1",
      "title": "Capitão e Líder Financeiro Titanium 4022",
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      "createdAt": "2026-01-11T11:00:00.000Z"
    },
    {
      "id": "user-rep-cybergears",
      "name": "Beatriz Vasconcelos",
      "email": "cybergears@robotica.org",
      "passwordHash": "$2b$10$l1TnuUlQWCMNaeEwGTFpweuvSvI9rPMk4xULDEin.n7l2RPiKTaqi",
      "role": "team_rep",
      "teamId": "team-2",
      "title": "Representante Financeira CyberGears 810",
      "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      "createdAt": "2026-01-16T15:00:00.000Z"
    },
    {
      "id": "user-rep-sparkbots",
      "name": "Felipe Alencar",
      "email": "sparkbots@robotica.org",
      "passwordHash": "$2b$10$l1TnuUlQWCMNaeEwGTFpweuvSvI9rPMk4xULDEin.n7l2RPiKTaqi",
      "role": "team_rep",
      "teamId": "team-3",
      "title": "Representante SparkBots 105",
      "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      "createdAt": "2026-02-02T10:00:00.000Z"
    }
  ],
  "teams": [
    {
      "id": "team-1",
      "name": "Titanium 4022",
      "code": "TITAN-4022",
      "category": "FRC - FIRST Robotics Competition",
      "institution": "Centro de Tecnologia e Inovação SESI/SENAI",
      "description": "Equipe de robótica competitiva categoria avançada FRC de 50kg.",
      "bankAccount": "Banco do Brasil - Ag: 1234-5 | CC: 98765-4 (PIX: financeiro@titanium4022.org)",
      "leaderName": "Prof. Lucas Rocha",
      "createdAt": "2026-01-10T10:00:00.000Z"
    },
    {
      "id": "team-2",
      "name": "CyberGears 810",
      "code": "CYBER-810",
      "category": "FTC - FIRST Tech Challenge",
      "institution": "Instituto Federal de Educação Tecnológica",
      "description": "Desenvolvimento de robôs móveis autônomos e teleoperados com visão computacional.",
      "bankAccount": "Caixa Econômica - Ag: 4321 | CC: 56789-0 (PIX: rep@cybergears.edu.br)",
      "leaderName": "Marina Duarte",
      "createdAt": "2026-01-15T14:30:00.000Z"
    },
    {
      "id": "team-3",
      "name": "SparkBots 105",
      "code": "SPARK-105",
      "category": "FLL - FIRST Lego League",
      "institution": "Escola SESI de Educação Básica",
      "description": "Iniciação científica e robótica educacional para jovens talentos.",
      "bankAccount": "Bradesco - Ag: 0987 | CC: 12345-6 (PIX: sparkbots@fiern.org.br)",
      "leaderName": "Renato Sales",
      "createdAt": "2026-02-01T09:00:00.000Z"
    }
  ],
  "sponsorships": [
    {
      "id": "spon-4",
      "teamId": "team-3",
      "sponsorName": "Associação de Pais e Apoiadores da Robótica",
      "amount": 4500,
      "receiptDate": "2026-02-25",
      "purpose": "Compra de tapetes oficiais de missão e transporte para o torneio",
      "notes": "Arrecadação de rifa e doações diretas registradas com recibo assinado.",
      "receiptUrl": "/uploads/demo-recibo-associacao-pais.pdf",
      "receiptFileName": "Recibo-Campanha-Pais-4500.pdf",
      "createdBy": "user-rep-sparkbots",
      "createdByName": "Felipe Alencar",
      "createdAt": "2026-02-25T11:40:00.000Z",
      "updatedAt": "2026-02-25T11:40:00.000Z"
    },
    {
      "id": "spon-2",
      "teamId": "team-1",
      "sponsorName": "InovaSoft Sistemas",
      "amount": 7200,
      "receiptDate": "2026-02-18",
      "purpose": "Subsídio para eletrônica e sensores LiDaR",
      "notes": "Repasse via PIX institucional direto para a conta da equipe.",
      "receiptUrl": "/uploads/demo-recibo-patrocinio-inovasoft.pdf",
      "receiptFileName": "PIX-InovaSoft-7200.pdf",
      "createdBy": "user-rep-titanium",
      "createdByName": "Gabriel Menezes",
      "createdAt": "2026-02-18T16:10:00.000Z",
      "updatedAt": "2026-02-18T16:10:00.000Z"
    },
    {
      "id": "spon-3",
      "teamId": "team-2",
      "sponsorName": "AutoPeças & Motores Brasil",
      "amount": 9800,
      "receiptDate": "2026-02-10",
      "purpose": "Inscrição na etapa regional e kit de motores REV Robotics",
      "notes": "Patrocínio Ouro categoria FTC.",
      "receiptUrl": "/uploads/demo-recibo-autopecas.pdf",
      "receiptFileName": "Comprovante-AutoPecas-9800.pdf",
      "createdBy": "user-rep-cybergears",
      "createdByName": "Beatriz Vasconcelos",
      "createdAt": "2026-02-10T10:05:00.000Z",
      "updatedAt": "2026-02-10T10:05:00.000Z"
    },
    {
      "id": "spon-1",
      "teamId": "team-1",
      "sponsorName": "MetalTech Usinagens de Precisão",
      "amount": 18500,
      "receiptDate": "2026-02-05",
      "purpose": "Aquisição de perfis de alumínio aeronáutico e caixas de transmissão",
      "notes": "Contrato de patrocínio Master temporada 2026. Comprovante de TED anexado.",
      "receiptUrl": "/uploads/demo-recibo-patrocinio-metaltech.pdf",
      "receiptFileName": "TED-Comprovante-Metaltech-18500.pdf",
      "createdBy": "user-rep-titanium",
      "createdByName": "Gabriel Menezes",
      "createdAt": "2026-02-05T14:22:00.000Z",
      "updatedAt": "2026-02-05T14:22:00.000Z"
    }
  ],
  "expenses": [
    {
      "id": "exp-1790262982364",
      "teamId": "team-1",
      "category": "Peças e Componentes",
      "description": "[Conclusão de Solicitação] Kit de Sensores Ultrassônicos e Cabos CAN-bus - Desconto obtido à vista com pagamento PIX. NF-e emitida.",
      "amount": 285.5,
      "expenseDate": "2026-09-24",
      "supplier": "TechEletrônica Brasil",
      "receiptUrl": "/uploads/demo-cupom-ferramentas.pdf",
      "receiptFileName": "NFe-TechEletronica-285.pdf",
      "purchaseRequestId": "pr-1790262982227",
      "createdBy": "user-rep-titanium",
      "createdByName": "Gabriel Menezes",
      "createdAt": "2026-09-24T15:16:22.364Z",
      "updatedAt": "2026-09-24T15:16:22.364Z"
    },
    {
      "id": "exp-4",
      "teamId": "team-3",
      "category": "Marketing e Uniformes",
      "description": "Camisetas personalizadas da equipe e crachás para a arena",
      "amount": 780,
      "expenseDate": "2026-02-28",
      "supplier": "Estamparia Arte & Cores",
      "receiptUrl": "/uploads/demo-recibo-uniformes.pdf",
      "receiptFileName": "Recibo-Quitacao-Uniformes-780.pdf",
      "purchaseRequestId": null,
      "createdBy": "user-rep-sparkbots",
      "createdByName": "Felipe Alencar",
      "createdAt": "2026-02-28T14:10:00.000Z",
      "updatedAt": "2026-02-28T14:10:00.000Z"
    },
    {
      "id": "exp-2",
      "teamId": "team-1",
      "category": "Ferramentas e Usinagem",
      "description": "Jogo de brocas HSS de precisão e fresas de topo para CNC",
      "amount": 850.5,
      "expenseDate": "2026-02-22",
      "supplier": "Ferragens & Ferramentas São Jorge",
      "receiptUrl": "/uploads/demo-cupom-ferramentas.pdf",
      "receiptFileName": "NFC-e-88123-Ferramentas.pdf",
      "purchaseRequestId": null,
      "createdBy": "user-rep-titanium",
      "createdByName": "Gabriel Menezes",
      "createdAt": "2026-02-22T09:30:00.000Z",
      "updatedAt": "2026-02-22T09:30:00.000Z"
    },
    {
      "id": "exp-1",
      "teamId": "team-1",
      "category": "Peças e Componentes",
      "description": "Lote de 6x Motores brushless e cabos de sinal siliconados",
      "amount": 4320,
      "expenseDate": "2026-02-20",
      "supplier": "RoboCore Tecnologia Ltda",
      "receiptUrl": "/uploads/demo-nf-robocore-4320.pdf",
      "receiptFileName": "NF-e-5491-RoboCore.pdf",
      "purchaseRequestId": "pr-1",
      "createdBy": "user-rep-titanium",
      "createdByName": "Gabriel Menezes",
      "createdAt": "2026-02-20T17:15:00.000Z",
      "updatedAt": "2026-02-20T17:15:00.000Z"
    },
    {
      "id": "exp-3",
      "teamId": "team-2",
      "category": "Inscrições e Torneios",
      "description": "Taxa de inscrição oficial Regional FTC 2026",
      "amount": 2500,
      "expenseDate": "2026-02-15",
      "supplier": "FIRST Brasil / SESI Nacional",
      "receiptUrl": "/uploads/demo-comprovante-inscricao-ftc.pdf",
      "receiptFileName": "Boleto-Quitado-Inscricao-FTC.pdf",
      "purchaseRequestId": null,
      "createdBy": "user-rep-cybergears",
      "createdByName": "Beatriz Vasconcelos",
      "createdAt": "2026-02-15T13:45:00.000Z",
      "updatedAt": "2026-02-15T13:45:00.000Z"
    }
  ],
  "purchaseRequests": [
    {
      "id": "pr-1790262982227",
      "teamId": "team-1",
      "title": "Kit de Sensores Ultrassônicos e Cabos CAN-bus",
      "items": [
        {
          "id": "item-1790262982227-0",
          "name": "Sensor Ultrassônico HC-SR04 industrial",
          "quantity": 4,
          "unitPriceEstimated": 45,
          "totalEstimated": 180,
          "referenceLink": "https://exemplo.com"
        },
        {
          "id": "item-1790262982227-1",
          "name": "Cabo de dados CAN de par trançado 10m",
          "quantity": 2,
          "unitPriceEstimated": 60,
          "totalEstimated": 120,
          "referenceLink": "https://exemplo.com"
        }
      ],
      "estimatedTotal": 300,
      "purpose": "Odometria e detecção de proximidade lateral no robô.",
      "justification": "Componentes desgastados na última bateria de testes.",
      "urgency": "alta",
      "status": "concluida",
      "reviewNotes": "Aprovado orçamento de R$ 300,00 para aquisição urgente dos sensores.",
      "approvedAmount": 300,
      "reviewedBy": "user-tech-lead",
      "reviewedByName": "Profª Dra. Marina Guimarães",
      "reviewedAt": "2026-09-24T15:16:22.354Z",
      "finalActualAmount": 285.5,
      "finalReceiptUrl": "/uploads/demo-cupom-ferramentas.pdf",
      "finalReceiptFileName": "NFe-TechEletronica-285.pdf",
      "expenseId": "exp-1790262982364",
      "createdBy": "user-rep-titanium",
      "createdByName": "Gabriel Menezes",
      "createdAt": "2026-09-24T15:16:22.227Z",
      "updatedAt": "2026-09-24T15:16:22.364Z"
    },
    {
      "id": "pr-5",
      "teamId": "team-3",
      "title": "Baterias Recarregáveis Li-Po e Carregador Balanceador Inteligente",
      "items": [
        {
          "id": "item-501",
          "name": "Bateria Li-Po 2S 7.4V 2200mAh",
          "quantity": 4,
          "unitPriceEstimated": 140,
          "totalEstimated": 560,
          "referenceLink": "https://lojamodelismo.com.br/bateria-lipo-2s"
        },
        {
          "id": "item-502",
          "name": "Carregador Digital Balanceador IMAX B6 V2",
          "quantity": 1,
          "unitPriceEstimated": 350,
          "totalEstimated": 350,
          "referenceLink": "https://lojamodelismo.com.br/imax-b6"
        }
      ],
      "estimatedTotal": 910,
      "purpose": "Alimentação contínua nas baterias de treino sem interrupção de ciclo.",
      "justification": "As baterias atuais descarregam em menos de 10 minutos de teste.",
      "urgency": "alta",
      "status": "em_analise",
      "reviewNotes": "Solicitação em conferência pelo comitê técnico.",
      "approvedAmount": null,
      "reviewedBy": "user-tech-lead",
      "reviewedByName": "Profª Dra. Marina Guimarães",
      "reviewedAt": "2026-03-02T10:10:00.000Z",
      "finalActualAmount": null,
      "finalReceiptUrl": null,
      "finalReceiptFileName": null,
      "expenseId": null,
      "createdBy": "user-rep-sparkbots",
      "createdByName": "Felipe Alencar",
      "createdAt": "2026-03-01T14:40:00.000Z",
      "updatedAt": "2026-03-02T10:10:00.000Z"
    },
    {
      "id": "pr-3",
      "teamId": "team-1",
      "title": "Placas de Policarbonato Compacto 4mm para Blindagem de Mecanismo",
      "items": [
        {
          "id": "item-301",
          "name": "Chapa de Policarbonato Cristal 2000x1000x4mm",
          "quantity": 2,
          "unitPriceEstimated": 650,
          "totalEstimated": 1300,
          "referenceLink": "https://exemplo.com.br/policarbonato"
        }
      ],
      "estimatedTotal": 1300,
      "purpose": "Proteção contra colisões e isolamento dos componentes pneumáticos.",
      "justification": "Exigência mandatória de segurança da inspeção oficial da FIRST.",
      "urgency": "media",
      "status": "enviada",
      "reviewNotes": null,
      "approvedAmount": null,
      "reviewedBy": null,
      "reviewedByName": null,
      "reviewedAt": null,
      "finalActualAmount": null,
      "finalReceiptUrl": null,
      "finalReceiptFileName": null,
      "expenseId": null,
      "createdBy": "user-rep-titanium",
      "createdByName": "Gabriel Menezes",
      "createdAt": "2026-03-01T09:15:00.000Z",
      "updatedAt": "2026-03-01T09:15:00.000Z"
    },
    {
      "id": "pr-4",
      "teamId": "team-2",
      "title": "Sensores de Distância a Laser ToF (Time-of-Flight)",
      "items": [
        {
          "id": "item-401",
          "name": "Sensor Laser ToF 2m I2C Rev Robotics",
          "quantity": 4,
          "unitPriceEstimated": 220,
          "totalEstimated": 880,
          "referenceLink": "https://www.revrobotics.com/rev-31-1505/"
        }
      ],
      "estimatedTotal": 880,
      "purpose": "Detecção de obstáculos e posicionamento preciso nas estações de carregamento.",
      "justification": "Melhora da precisão na manobra em baixa visibilidade.",
      "urgency": "media",
      "status": "ajuste_solicitado",
      "reviewNotes": "Por favor, inclua 3 orçamentos comparativos de distribuidores nacionais para verificar prazo de entrega antes da aprovação.",
      "approvedAmount": null,
      "reviewedBy": "user-tech-lead",
      "reviewedByName": "Profª Dra. Marina Guimarães",
      "reviewedAt": "2026-02-26T15:20:00.000Z",
      "finalActualAmount": null,
      "finalReceiptUrl": null,
      "finalReceiptFileName": null,
      "expenseId": null,
      "createdBy": "user-rep-cybergears",
      "createdByName": "Beatriz Vasconcelos",
      "createdAt": "2026-02-24T16:00:00.000Z",
      "updatedAt": "2026-02-26T15:20:00.000Z"
    },
    {
      "id": "pr-2",
      "teamId": "team-1",
      "title": "Câmera com Inteligência Artificial Limelight 3G para Alinhamento Autônomo",
      "items": [
        {
          "id": "item-201",
          "name": "Câmera de Visão Limelight 3G com retroreflective tracking",
          "quantity": 1,
          "unitPriceEstimated": 3200,
          "totalEstimated": 3200,
          "referenceLink": "https://limelightvision.io"
        }
      ],
      "estimatedTotal": 3200,
      "purpose": "Identificação autônoma de april tags na arena e cálculo de odometria.",
      "justification": "Permite pontuação máxima no período autônomo de 15 segundos da partida regional.",
      "urgency": "alta",
      "status": "compra_em_andamento",
      "reviewNotes": "Aprovado pelo comitê técnico. Aguardando finalização da importação e nota fiscal.",
      "approvedAmount": 3200,
      "reviewedBy": "user-tech-lead",
      "reviewedByName": "Profª Dra. Marina Guimarães",
      "reviewedAt": "2026-02-21T11:30:00.000Z",
      "finalActualAmount": null,
      "finalReceiptUrl": null,
      "finalReceiptFileName": null,
      "expenseId": null,
      "createdBy": "user-rep-titanium",
      "createdByName": "Gabriel Menezes",
      "createdAt": "2026-02-20T18:00:00.000Z",
      "updatedAt": "2026-02-21T11:30:00.000Z"
    },
    {
      "id": "pr-1",
      "teamId": "team-1",
      "title": "Motores Brushless de Alta Performance para o Chassi",
      "items": [
        {
          "id": "item-101",
          "name": "Motor Brushless NEO 550 com redutor planetary",
          "quantity": 6,
          "unitPriceEstimated": 750,
          "totalEstimated": 4500,
          "referenceLink": "https://www.andymark.com/products/neo-550"
        }
      ],
      "estimatedTotal": 4500,
      "purpose": "Substituição dos motores antigos com folga para tração do chassi swerve drive.",
      "justification": "A temporada atual exige velocidade e torque 30% superiores. Os motores atuais atingiram a vida útil limite.",
      "urgency": "alta",
      "status": "concluida",
      "reviewNotes": "Aprovado após análise técnica. Material essencial para a estabilidade da tração.",
      "approvedAmount": 4500,
      "reviewedBy": "user-tech-lead",
      "reviewedByName": "Profª Dra. Marina Guimarães",
      "reviewedAt": "2026-02-19T10:00:00.000Z",
      "finalActualAmount": 4320,
      "finalReceiptUrl": "/uploads/demo-nf-robocore-4320.pdf",
      "finalReceiptFileName": "NF-e-5491-RoboCore.pdf",
      "expenseId": "exp-1",
      "createdBy": "user-rep-titanium",
      "createdByName": "Gabriel Menezes",
      "createdAt": "2026-02-18T14:00:00.000Z",
      "updatedAt": "2026-02-20T17:15:00.000Z"
    }
  ],
  "auditLogs": [
    {
      "id": "log-1790265999922-0fein",
      "timestamp": "2026-09-24T16:06:39.923Z",
      "userId": "user-tech-lead",
      "userName": "Profª Dra. Marina Guimarães",
      "userRole": "technical_lead",
      "teamId": null,
      "teamName": null,
      "action": "LOGIN",
      "entityType": "auth",
      "entityId": "user-tech-lead",
      "description": "Usuário realizou login com sucesso no sistema (Responsável Técnica)."
    },
    {
      "id": "log-1790263738373-udnav",
      "timestamp": "2026-09-24T15:28:58.373Z",
      "userId": "user-rep-cybergears",
      "userName": "Beatriz Vasconcelos",
      "userRole": "team_rep",
      "teamId": "team-2",
      "teamName": "CyberGears 810",
      "action": "LOGIN",
      "entityType": "auth",
      "entityId": "user-rep-cybergears",
      "description": "Usuário realizou login com sucesso no sistema (Representante)."
    },
    {
      "id": "log-1790263045458-5v39f",
      "timestamp": "2026-09-24T15:17:25.458Z",
      "userId": "user-tech-lead",
      "userName": "Profª Dra. Marina Guimarães",
      "userRole": "technical_lead",
      "teamId": null,
      "teamName": null,
      "action": "LOGIN",
      "entityType": "auth",
      "entityId": "user-tech-lead",
      "description": "Usuário realizou login com sucesso no sistema (Responsável Técnica)."
    },
    {
      "id": "log-1790262982365-qzicq",
      "timestamp": "2026-09-24T15:16:22.365Z",
      "userId": "user-rep-titanium",
      "userName": "Gabriel Menezes",
      "userRole": "team_rep",
      "teamId": "team-1",
      "teamName": "Titanium 4022",
      "action": "CONCLUIU_COMPRA",
      "entityType": "purchase_request",
      "entityId": "pr-1790262982227",
      "description": "Concluiu a compra de \"Kit de Sensores Ultrassônicos e Cabos CAN-bus\": valor estimado R$ 300.00, valor aprovado R$ 300.00, valor efetivo pago R$ 285.50. Despesa lançada automaticamente.",
      "details": {
        "estimatedTotal": 300,
        "approvedAmount": 300,
        "finalActualAmount": 285.5,
        "expenseId": "exp-1790262982364"
      }
    },
    {
      "id": "log-1790262982355-yyv3n",
      "timestamp": "2026-09-24T15:16:22.355Z",
      "userId": "user-tech-lead",
      "userName": "Profª Dra. Marina Guimarães",
      "userRole": "technical_lead",
      "teamId": "team-1",
      "teamName": "Titanium 4022",
      "action": "APROVOU_SOLICITACAO",
      "entityType": "purchase_request",
      "entityId": "pr-1790262982227",
      "description": "Aprovou a solicitação \"Kit de Sensores Ultrassônicos e Cabos CAN-bus\" no valor autorizado de R$ 300,00. Transicionada para Compra em Andamento.",
      "details": {
        "previousStatus": "enviada",
        "currentStatus": "compra_em_andamento",
        "reviewNotes": "Aprovado orçamento de R$ 300,00 para aquisição urgente dos sensores.",
        "approvedAmount": 300
      }
    },
    {
      "id": "log-1790262982349-117w5",
      "timestamp": "2026-09-24T15:16:22.349Z",
      "userId": "user-tech-lead",
      "userName": "Profª Dra. Marina Guimarães",
      "userRole": "technical_lead",
      "teamId": null,
      "teamName": null,
      "action": "LOGIN",
      "entityType": "auth",
      "entityId": "user-tech-lead",
      "description": "Usuário realizou login com sucesso no sistema (Responsável Técnica)."
    },
    {
      "id": "log-1790262982267-e0k3v",
      "timestamp": "2026-09-24T15:16:22.267Z",
      "userId": "user-rep-titanium",
      "userName": "Gabriel Menezes",
      "userRole": "team_rep",
      "teamId": "team-1",
      "teamName": "Titanium 4022",
      "action": "CRIOU_SOLICITACAO_COMPRA",
      "entityType": "purchase_request",
      "entityId": "pr-1790262982227",
      "description": "Criou solicitação de compra \"Kit de Sensores Ultrassônicos e Cabos CAN-bus\" com valor estimado de R$ 300,00.",
      "details": {
        "newRequest": {
          "id": "pr-1790262982227",
          "teamId": "team-1",
          "title": "Kit de Sensores Ultrassônicos e Cabos CAN-bus",
          "items": [
            {
              "id": "item-1790262982227-0",
              "name": "Sensor Ultrassônico HC-SR04 industrial",
              "quantity": 4,
              "unitPriceEstimated": 45,
              "totalEstimated": 180,
              "referenceLink": "https://exemplo.com"
            },
            {
              "id": "item-1790262982227-1",
              "name": "Cabo de dados CAN de par trançado 10m",
              "quantity": 2,
              "unitPriceEstimated": 60,
              "totalEstimated": 120,
              "referenceLink": "https://exemplo.com"
            }
          ],
          "estimatedTotal": 300,
          "purpose": "Odometria e detecção de proximidade lateral no robô.",
          "justification": "Componentes desgastados na última bateria de testes.",
          "urgency": "alta",
          "status": "concluida",
          "reviewNotes": "Aprovado orçamento de R$ 300,00 para aquisição urgente dos sensores.",
          "approvedAmount": 300,
          "reviewedBy": "user-tech-lead",
          "reviewedByName": "Profª Dra. Marina Guimarães",
          "reviewedAt": "2026-09-24T15:16:22.354Z",
          "finalActualAmount": 285.5,
          "finalReceiptUrl": "/uploads/demo-cupom-ferramentas.pdf",
          "finalReceiptFileName": "NFe-TechEletronica-285.pdf",
          "expenseId": "exp-1790262982364",
          "createdBy": "user-rep-titanium",
          "createdByName": "Gabriel Menezes",
          "createdAt": "2026-09-24T15:16:22.227Z",
          "updatedAt": "2026-09-24T15:16:22.364Z"
        }
      }
    },
    {
      "id": "log-1790262982209-v4byx",
      "timestamp": "2026-09-24T15:16:22.209Z",
      "userId": "user-rep-titanium",
      "userName": "Gabriel Menezes",
      "userRole": "team_rep",
      "teamId": "team-1",
      "teamName": "Titanium 4022",
      "action": "LOGIN",
      "entityType": "auth",
      "entityId": "user-rep-titanium",
      "description": "Usuário realizou login com sucesso no sistema (Representante)."
    },
    {
      "id": "log-1790262938862-0i2gx",
      "timestamp": "2026-09-24T15:15:38.862Z",
      "userId": "user-tech-lead",
      "userName": "Profª Dra. Marina Guimarães",
      "userRole": "technical_lead",
      "teamId": null,
      "teamName": null,
      "action": "LOGIN",
      "entityType": "auth",
      "entityId": "user-tech-lead",
      "description": "Usuário realizou login com sucesso no sistema (Responsável Técnica)."
    },
    {
      "id": "log-1",
      "timestamp": "2026-02-05T14:22:00.000Z",
      "userId": "user-rep-titanium",
      "userName": "Gabriel Menezes",
      "userRole": "team_rep",
      "teamId": "team-1",
      "teamName": "Titanium 4022",
      "action": "CRIOU_PATROCINIO",
      "entityType": "sponsorship",
      "entityId": "spon-1",
      "description": "Registrou patrocínio de R$ 18.500,00 da MetalTech Usinagens com comprovante."
    },
    {
      "id": "log-2",
      "timestamp": "2026-02-18T14:00:00.000Z",
      "userId": "user-rep-titanium",
      "userName": "Gabriel Menezes",
      "userRole": "team_rep",
      "teamId": "team-1",
      "teamName": "Titanium 4022",
      "action": "CRIOU_SOLICITACAO_COMPRA",
      "entityType": "purchase_request",
      "entityId": "pr-1",
      "description": "Enviou solicitação de compra para Motores Brushless (estimado R$ 4.500,00)."
    },
    {
      "id": "log-3",
      "timestamp": "2026-02-19T10:00:00.000Z",
      "userId": "user-tech-lead",
      "userName": "Profª Dra. Marina Guimarães",
      "userRole": "technical_lead",
      "teamId": "team-1",
      "teamName": "Titanium 4022",
      "action": "APROVOU_SOLICITACAO",
      "entityType": "purchase_request",
      "entityId": "pr-1",
      "description": "Aprovou a solicitação de Motores Brushless no valor de R$ 4.500,00 com parecer técnico."
    },
    {
      "id": "log-4",
      "timestamp": "2026-02-20T17:15:00.000Z",
      "userId": "user-rep-titanium",
      "userName": "Gabriel Menezes",
      "userRole": "team_rep",
      "teamId": "team-1",
      "teamName": "Titanium 4022",
      "action": "CONCLUIU_COMPRA",
      "entityType": "purchase_request",
      "entityId": "pr-1",
      "description": "Concluiu compra de Motores Brushless: valor efetivo de R$ 4.320,00 registrado com NF-e gerando a despesa exp-1."
    },
    {
      "id": "log-5",
      "timestamp": "2026-02-21T11:30:00.000Z",
      "userId": "user-tech-lead",
      "userName": "Profª Dra. Marina Guimarães",
      "userRole": "technical_lead",
      "teamId": "team-1",
      "teamName": "Titanium 4022",
      "action": "APROVOU_SOLICITACAO",
      "entityType": "purchase_request",
      "entityId": "pr-2",
      "description": "Aprovou solicitação da Câmera Limelight 3G (R$ 3.200,00) que transitou para compra em andamento."
    },
    {
      "id": "log-6",
      "timestamp": "2026-02-26T15:20:00.000Z",
      "userId": "user-tech-lead",
      "userName": "Profª Dra. Marina Guimarães",
      "userRole": "technical_lead",
      "teamId": "team-2",
      "teamName": "CyberGears 810",
      "action": "SOLICITOU_AJUSTE",
      "entityType": "purchase_request",
      "entityId": "pr-4",
      "description": "Solicitou ajustes na solicitação de Sensores ToF: requisição de 3 orçamentos comparativos."
    },
    {
      "id": "log-7",
      "timestamp": "2026-03-01T09:15:00.000Z",
      "userId": "user-rep-titanium",
      "userName": "Gabriel Menezes",
      "userRole": "team_rep",
      "teamId": "team-1",
      "teamName": "Titanium 4022",
      "action": "CRIOU_SOLICITACAO_COMPRA",
      "entityType": "purchase_request",
      "entityId": "pr-3",
      "description": "Enviou solicitação de compra de Placas de Policarbonato no valor estimado de R$ 1.300,00."
    },
    {
      "id": "log-8",
      "timestamp": "2026-03-02T10:10:00.000Z",
      "userId": "user-tech-lead",
      "userName": "Profª Dra. Marina Guimarães",
      "userRole": "technical_lead",
      "teamId": "team-3",
      "teamName": "SparkBots 105",
      "action": "ANALISE_INICIADA",
      "entityType": "purchase_request",
      "entityId": "pr-5",
      "description": "Iniciou análise técnica detalhada da solicitação de Baterias Li-Po e Carregador Balanceador."
    }
  ]
}
