import {
  IconClipboardList,
  IconHome,
  IconTrophy,
  IconUser,
  IconUserCircle,
  IconUsers,
  IconUsersGroup,
  type Icon,
} from '@tabler/icons-react'
import type { AppRole } from '../features/auth/types'
import { isStaff } from '../features/auth/permissions'

export type NavItem = {
  to: string
  label: string
  icon: Icon
  /** Только боковое меню на ПК */
  desktopOnly?: boolean
}

export function getNavItems(role: AppRole | null | undefined, variant: 'side' | 'bottom'): NavItem[] {
  const peopleHub: NavItem = {
    to: '/people',
    label: 'Участники',
    icon: IconUsersGroup,
  }

  const peopleDesktop: NavItem[] = [
    { to: '/athletes', label: 'Рыбаки', icon: IconUser, desktopOnly: true },
    { to: '/teams', label: 'Команды', icon: IconUsers, desktopOnly: true },
  ]

  // Live-first: Results убраны из таббара — вход через главную и хаб турнира
  const base: NavItem[] = [
    { to: '/', label: 'Главная', icon: IconHome },
    { to: '/tournament', label: 'Турнир', icon: IconTrophy },
    ...(variant === 'side' ? peopleDesktop : [peopleHub]),
  ]

  if (isStaff(role)) {
    base.push({ to: '/staff', label: 'Орг', icon: IconClipboardList })
  }

  base.push({ to: '/profile', label: 'Профиль', icon: IconUserCircle })
  return base
}

export function isNavActive(pathname: string, to: string) {
  if (to === '/') return pathname === '/'
  if (to === '/tournament') {
    return pathname === '/tournament' || pathname.startsWith('/tournament/')
  }
  if (to === '/staff') {
    return pathname === '/staff' || pathname.startsWith('/staff/')
  }
  if (to === '/people') {
    return (
      pathname === '/people' ||
      pathname.startsWith('/athletes') ||
      pathname.startsWith('/teams')
    )
  }
  if (to === '/athletes') {
    return pathname === '/athletes' || pathname.startsWith('/athletes/')
  }
  if (to === '/teams') {
    return pathname === '/teams' || pathname.startsWith('/teams/')
  }
  return pathname === to || pathname.startsWith(`${to}/`)
}
