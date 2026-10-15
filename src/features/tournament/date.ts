import type { Tournament, TournamentStatus } from './types'

export function formatTournamentDate(isoDate: string) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export const statusLabel: Record<TournamentStatus, string> = {
  draft: 'Черновик',
  published: 'Актуальный',
  live: 'Идёт',
  finished: 'Архив',
}

export function pickCurrentTournament(list: Tournament[]): Tournament | null {
  if (list.length === 0) return null
  return (
    list.find((t) => t.status === 'live') ??
    list.find((t) => t.status === 'published') ??
    list[0] ??
    null
  )
}

export function isArchiveTournament(t: Tournament, currentId: string | null): boolean {
  if (t.id === currentId) return false
  return t.status === 'finished' || t.status === 'draft' || Boolean(currentId)
}
