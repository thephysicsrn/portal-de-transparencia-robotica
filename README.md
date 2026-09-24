# Portal de Transparência da Robótica

Sistema web para gestão financeira, acompanhamento de patrocínios, despesas e fluxo de aprovação de compras de equipes de robótica competitiva (FRC, FTC, FLL, Combate e Autônomos).

---

## 🚀 Como Executar o Sistema

### 1. Pré-requisitos
* Node.js v18+ (recomendado v20 ou v22)
* NPM instalado

### 2. Iniciar o ambiente completo (API + Frontend)
Execute na raiz do projeto:
```bash
npm run dev
```
Este comando executa simultaneamente:
* **API Backend Express:** `http://localhost:3001` (com persistência atômica, JWT, Multer e logs de auditoria)
* **Frontend Vite + React 19:** `http://localhost:5173` (com proxy automático para `/api` e `/uploads`)

Abra no navegador: **[http://localhost:5173](http://localhost:5173)**

---

## 👥 Perfis e Contas de Demonstração Pré-Configuradas

O sistema possui botões de **Acesso Rápido com 1 Clique** na tela de login, ou você pode utilizar as seguintes credenciais:

### 1. Responsável Técnica (Visão Global)
* **E-mail:** `responsavel@robotica.org`
* **Senha:** `admin123`
* **Perfil:** Visualiza todas as equipes, aprova/rejeita/solicita ajustes em solicitações de compras, audita histórico geral, cadastra equipes e emite relatórios consolidados em PDF e CSV.

### 2. Representantes de Equipe (Acesso Restrito à Própria Equipe)
* **Equipe Titanium 4022 (FRC):**
  * **E-mail:** `titanium@robotica.org` | **Senha:** `equipe123`
* **Equipe CyberGears 810 (FTC):**
  * **E-mail:** `cybergears@robotica.org` | **Senha:** `equipe123`
* **Equipe SparkBots 105 (FLL):**
  * **E-mail:** `sparkbots@robotica.org` | **Senha:** `equipe123`

---

## 🛠️ Funcionalidades Implementadas

1. **Painel Geral (Dashboard):**
   * Indicadores em tempo real: Saldo Disponível em Caixa, Total Recebido (Patrocínios), Total Gasto (Despesas), Compras em Andamento (com valor total aprovado/em execução) e Solicitações Aguardando Decisão.
   * Tabela comparativa financeira por equipe de robótica.
   * Lista prioritária de solicitações que exigem atenção imediata.
   * Atualização reativa dos dados sem necessidade de recarregar a página manualmente.

2. **Gestão de Patrocínios:**
   * Cadastro com patrocinador, equipe beneficiada, valor, data de recebimento, finalidade, observações e upload de comprovante (TED, PIX ou termo).
   * Visualizador modal de comprovantes com abertura em nova aba ou download.

3. **Gestão de Despesas:**
   * Lançamento categorizado (Peças e Componentes, Eletrônica e Sensores, Ferramentas, Inscrições e Torneios, Transporte e Viagem, Alimentação, Marketing, Outros).
   * Fornecedor, descrição detalhada, data, valor e anexo de Nota Fiscal (NF-e/NFC-e).
   * Identificação clara de despesas avulsas vs. despesas originadas de solicitações de compra concluídas.

4. **Fluxo Completo de Solicitações de Compra:**
   * **Cadastro:** múltiplos itens com quantidades, valores estimados unitários e totais, links de fornecedores, nível de urgência, finalidade e justificativa técnica detalhada.
   * **Fluxo de status:** `enviada` ➔ `em_analise` ➔ `ajuste_solicitado` (com reenvio pela equipe) ➔ `aprovada` (autoriza orçamento e transiciona para `compra_em_andamento`) ou `rejeitada`.
   * **Decisão Técnica Exclusiva:** apenas a Responsável Técnica pode aprovar, indeferir ou pedir ajustes; nenhuma equipe pode aprovar a própria solicitação (validação a nível de API).
   * **Regra Financeira Fundamental:** a aprovação autoriza o processo mas **NÃO debita o saldo**. O saldo da equipe permanece intacto até que a compra seja efetivada.

5. **Conclusão de Compra & Liquidação Automática:**
   * Registro do valor efetivamente pago e anexo da Nota Fiscal definitiva.
   * Criação automática do registro de despesa vinculado no extrato, debitando o saldo apenas neste momento.

6. **Prestação de Contas & Extrato Financeiro:**
   * Extrato unificado de entradas e saídas com saldo progressivo calculado linha a linha.
   * Filtros dinâmicos por equipe, período (data inicial e final) e categoria.
   * **Exportação em PDF:** relatório oficial formatado com cabeçalho institucional, resumo numérico e tabela detalhada (via `jsPDF` + `jspdf-autotable`).
   * **Exportação em Planilha (CSV):** arquivo compatível com Excel e Google Sheets com codificação UTF-8 BOM.

7. **Histórico e Trilha de Auditoria Imutável:**
   * Registro detalhado de cada ação (login, criação, edição, exclusão, aprovação, rejeição, solicitação de ajuste e conclusão de compra).
   * Armazena autor, perfil, equipe, data/hora e metadados das alterações anteriores e atuais.

8. **Segurança Multi-Tenant:**
   * Tokens JWT com expiração segura e hash de senhas via Bcrypt.
   * Middleware de isolamento estrito: representantes de equipe são bloqueados (HTTP 403) caso tentem acessar ou alterar dados de outra equipe via API ou URL.

---

## 📂 Estrutura do Código

```
├── server/
│   ├── data/
│   │   └── db.json         # Base de dados persistente com gravação atômica
│   ├── db.ts               # Gerenciador de dados, seed inicial e cálculos de saldo
│   ├── index.ts            # Servidor Express, rotas da API, autenticação e uploads
│   └── types.ts            # Definições de tipos e interfaces do backend
├── src/
│   ├── components/         # Componentes React (Dashboard, Extrato, Compras, etc.)
│   ├── context/            # AuthContext (sessão, perfil e escopo de equipe)
│   ├── services/           # Cliente HTTP da API REST com interceptor de token
│   ├── utils/              # Formatadores de moeda BRL, gerador PDF e exportador CSV
│   ├── App.tsx             # Aplicação principal e navegação reativa
│   └── index.css           # Design system moderno e identidade visual robótica
├── uploads/                # Armazenamento local de comprovantes e NFs
└── package.json
```
