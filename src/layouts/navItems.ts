import {
  IconArchive,
  IconHome,
  IconUserCircle,
  IconUsersGroup,
  type Icon,
} from '@tabler/icons-react'

export type NavItem = {
  to: string
  label: string
  icon: Icon
}

export function getNavItems(): NavItem[] {
  return [
    { to: '/', label: 'Главная', icon: IconHome },
    { to: '/tournament', label: 'Турниры', icon: IconArchive },
    { to: '/people', label: 'Участники', icon: IconUsersGroup },
    { to: '/profile', label: 'Профиль', icon: IconUserCircle },
  ]
}

export function isNavActive(pathname: string, to: string) {
  if (to === '/') {
    return pathname === '/'
  }
  if (to === '/tournament') {
    return pathname === '/tournament' || pathname.startsWith('/tournament/')
  }
  if (to === '/people') {
    return (
      pathname === '/people' ||
      pathname.startsWith('/athletes') ||
      pathname.startsWith('/teams')
    )
  }
  if (to === '/profile') {
    return pathname === '/profile'
  }
  return pathname === to || pathname.startsWith(`${to}/`)
}
