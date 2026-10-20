const CHEER_KEY = 'pikecup.cheer'

export function readCheer(tournamentId: string): string | null {
  try {
    const raw = localStorage.getItem(CHEER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { tournamentId?: string; entryId?: string }
    return parsed.tournamentId === tournamentId && parsed.entryId ? parsed.entryId : null
  } catch {
    return null
  }
}

export function writeCheer(tournamentId: string, entryId: string) {
  localStorage.setItem(CHEER_KEY, JSON.stringify({ tournamentId, entryId }))
}

export function clearCheer() {
  localStorage.removeItem(CHEER_KEY)
}
