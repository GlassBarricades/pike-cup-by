import type { AppRole } from './types'

export function isStaff(role: AppRole | null | undefined): boolean {
  return role === 'judge' || role === 'organizer' || role === 'admin'
}

export function canJudgeDay(role: AppRole | null | undefined): boolean {
  return role === 'judge' || role === 'organizer' || role === 'admin'
}

export function canManageTournament(role: AppRole | null | undefined): boolean {
  return role === 'organizer' || role === 'admin'
}

export function canManageRoles(role: AppRole | null | undefined): boolean {
  return role === 'admin'
}

export const roleLabel: Record<AppRole, string> = {
  participant: 'Участник',
  judge: 'Судья',
  organizer: 'Организатор',
  admin: 'Админ',
}
