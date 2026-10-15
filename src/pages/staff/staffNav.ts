import {
  IconBook,
  IconClock,
  IconFish,
  IconHome,
  IconMapPin,
  IconSettings,
  IconTrophy,
  type Icon,
} from '@tabler/icons-react'
import type { AppRole } from '../../features/auth/types'
import { canJudgeDay, canManageTournament } from '../../features/auth/permissions'

export type StaffNavItem = {
  to: string
  label: string
  short: string
  icon: Icon
  allow: (role: AppRole | null) => boolean
  group: 'overview' | 'tournament' | 'day'
}

export const staffNavItems: StaffNavItem[] = [
  {
    to: '/staff',
    label: 'Обзор',
    short: 'Обзор',
    icon: IconHome,
    allow: canJudgeDay,
    group: 'overview',
  },
  {
    to: '/staff/tournament',
    label: 'Настройки турнира',
    short: 'Турнир',
    icon: IconSettings,
    allow: canManageTournament,
    group: 'tournament',
  },
  {
    to: '/staff/rules',
    label: 'Регламент',
    short: 'Регламент',
    icon: IconBook,
    allow: canManageTournament,
    group: 'tournament',
  },
  {
    to: '/staff/entries',
    label: 'Заявки',
    short: 'Заявки',
    icon: IconTrophy,
    allow: canManageTournament,
    group: 'tournament',
  },
  {
    to: '/staff/draw',
    label: 'Зоны',
    short: 'Зоны',
    icon: IconMapPin,
    allow: canManageTournament,
    group: 'tournament',
  },
  {
    to: '/staff/schedule',
    label: 'Расписание / сдвиг',
    short: 'Время',
    icon: IconClock,
    allow: canJudgeDay,
    group: 'day',
  },
  {
    to: '/staff/catches',
    label: 'Улов',
    short: 'Улов',
    icon: IconFish,
    allow: canJudgeDay,
    group: 'day',
  },
]

export function staffNavForRole(role: AppRole | null) {
  return staffNavItems.filter((item) => item.allow(role))
}
