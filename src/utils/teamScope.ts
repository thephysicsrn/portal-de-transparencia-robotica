import type { User } from '../types'

// Escopo de equipe do usuário.
//
// A responsável técnica e o administrador de TI enxergam todas as equipes.
// Técnicos e alunos ficam presos à própria equipe: o fallback nunca "adivinha"
// a primeira equipe da lista, porque isso abriria vazamento de dados de outra
// equipe quando o perfil estivesse mal configurado.

export function canSeeAllTeams(user: User | null | undefined): boolean {
  return user?.role === 'system_admin' || user?.role === 'technical_lead'
}

/**
 * Id de equipe a ser usado nas leituras.
 * Retorna 'all' para perfis com visão global e o próprio teamId nos demais.
 * Se o perfil não estiver vinculado a nenhuma equipe, retorna null e o
 * chamador deve exibir uma lista vazia em vez da primeira equipe.
 */
export function resolveReadScope(user: User | null | undefined, requestedTeamId?: string): string | null {
  if (canSeeAllTeams(user)) return requestedTeamId || 'all'
  return user?.teamId || null
}

/**
 * Id de equipe sugerido em formulários de lançamento.
 * Para perfil global devolve a primeira equipe apenas como sugestão, já que a
 * pessoa escolhe a equipe no próprio formulário.
 */
export function resolveFormDefaultTeam(user: User | null | undefined, teams: Array<{ id: string }>): string {
  if (user?.teamId) return user.teamId
  if (canSeeAllTeams(user)) return teams[0]?.id || ''
  return ''
}